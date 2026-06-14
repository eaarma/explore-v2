package com.explore.app.security.ratelimit;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RateLimitingService {

    private static final long MIN_BUCKET_TTL_MILLIS = Duration.ofMinutes(1).toMillis();
    private static final long CLEANUP_INTERVAL = 256L;

    private static final String UPSERT_DATABASE_BUCKET_SQL = """
            INSERT INTO rate_limit_buckets (
                bucket_namespace,
                subject_key,
                window_millis,
                window_started_at,
                request_count,
                expires_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
            ON CONFLICT (bucket_namespace, subject_key, window_millis, window_started_at)
            DO UPDATE SET
                request_count = rate_limit_buckets.request_count + 1,
                expires_at = EXCLUDED.expires_at,
                updated_at = EXCLUDED.updated_at
            RETURNING request_count
            """;

    private static final String DELETE_EXPIRED_DATABASE_BUCKETS_SQL = """
            DELETE FROM rate_limit_buckets
            WHERE expires_at < ?
            """;

    private final RateLimitProperties properties;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final Map<String, TokenBucket> buckets;
    private final AtomicLong cleanupCounter;

    @Autowired
    public RateLimitingService(RateLimitProperties properties, JdbcTemplate jdbcTemplate) {
        this(properties, jdbcTemplate, Clock.systemUTC(), new ConcurrentHashMap<>(), new AtomicLong());
    }

    RateLimitingService() {
        this(
                new RateLimitProperties(),
                null,
                Clock.systemUTC(),
                new ConcurrentHashMap<>(),
                new AtomicLong());
    }

    RateLimitingService(RateLimitProperties properties) {
        this(
                properties,
                null,
                Clock.systemUTC(),
                new ConcurrentHashMap<>(),
                new AtomicLong());
    }

    RateLimitingService(RateLimitProperties properties, JdbcTemplate jdbcTemplate, Clock clock) {
        this(properties, jdbcTemplate, clock, new ConcurrentHashMap<>(), new AtomicLong());
    }

    private RateLimitingService(
            RateLimitProperties properties,
            JdbcTemplate jdbcTemplate,
            Clock clock,
            Map<String, TokenBucket> buckets,
            AtomicLong cleanupCounter) {
        this.properties = properties;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
        this.buckets = buckets;
        this.cleanupCounter = cleanupCounter;
    }

    public RateLimitDecision tryConsume(String bucketNamespace, String subjectKey, RateLimitProperties.LimitRule rule) {
        return switch (properties.getStorage()) {
            case DATABASE -> tryConsumeWithDatabase(bucketNamespace, subjectKey, rule);
            case MEMORY -> tryConsumeInMemory(bucketNamespace, subjectKey, rule);
        };
    }

    private RateLimitDecision tryConsumeInMemory(
            String bucketNamespace,
            String subjectKey,
            RateLimitProperties.LimitRule rule) {
        long nowNanos = System.nanoTime();
        String bucketKey = bucketNamespace + ":" + subjectKey;

        TokenBucket bucket = buckets.computeIfAbsent(
                bucketKey,
                key -> new TokenBucket(rule.getMaxRequests(), rule.getWindow(), nowNanos));

        RateLimitDecision decision = bucket.tryConsume(nowNanos);
        cleanupExpiredMemoryBuckets(nowNanos);
        return decision;
    }

    private RateLimitDecision tryConsumeWithDatabase(
            String bucketNamespace,
            String subjectKey,
            RateLimitProperties.LimitRule rule) {
        if (jdbcTemplate == null) {
            throw new IllegalStateException("Database-backed rate limiting requires a JdbcTemplate");
        }

        Instant now = clock.instant();
        long windowMillis = Math.max(1L, rule.getWindow().toMillis());
        long windowStartMillis = Math.floorDiv(now.toEpochMilli(), windowMillis) * windowMillis;
        Instant windowStart = Instant.ofEpochMilli(windowStartMillis);
        Instant windowEnd = windowStart.plusMillis(windowMillis);
        Instant expiresAt = windowEnd.plusMillis(Math.max(windowMillis, MIN_BUCKET_TTL_MILLIS));

        Integer requestCount = jdbcTemplate.queryForObject(
                UPSERT_DATABASE_BUCKET_SQL,
                Integer.class,
                bucketNamespace,
                subjectKey,
                windowMillis,
                Timestamp.from(windowStart),
                Timestamp.from(expiresAt),
                Timestamp.from(now),
                Timestamp.from(now));

        cleanupExpiredDatabaseBuckets(now);

        if (requestCount != null && requestCount <= rule.getMaxRequests()) {
            return RateLimitDecision.allow();
        }

        Duration retryAfter = Duration.between(now, windowEnd);
        if (retryAfter.isZero() || retryAfter.isNegative()) {
            retryAfter = Duration.ofMillis(1);
        }

        return RateLimitDecision.reject(retryAfter);
    }

    private void cleanupExpiredMemoryBuckets(long nowNanos) {
        if (cleanupCounter.incrementAndGet() % CLEANUP_INTERVAL != 0) {
            return;
        }

        buckets.entrySet().removeIf(entry -> entry.getValue().isExpired(nowNanos));
    }

    private void cleanupExpiredDatabaseBuckets(Instant now) {
        if (cleanupCounter.incrementAndGet() % CLEANUP_INTERVAL != 0) {
            return;
        }

        jdbcTemplate.update(DELETE_EXPIRED_DATABASE_BUCKETS_SQL, Timestamp.from(now));
    }

    private static final class TokenBucket {

        private final int capacity;
        private final double refillTokensPerNano;
        private final long bucketTtlNanos;

        private double tokens;
        private long lastRefillNanos;
        private long lastAccessNanos;

        private TokenBucket(int capacity, Duration window, long nowNanos) {
            this.capacity = capacity;
            this.refillTokensPerNano = capacity / (double) window.toNanos();
            this.bucketTtlNanos = Math.max(window.multipliedBy(2).toNanos(), Duration.ofMinutes(1).toNanos());
            this.tokens = capacity;
            this.lastRefillNanos = nowNanos;
            this.lastAccessNanos = nowNanos;
        }

        private synchronized RateLimitDecision tryConsume(long nowNanos) {
            refill(nowNanos);
            lastAccessNanos = nowNanos;

            if (tokens >= 1.0d) {
                tokens -= 1.0d;
                return RateLimitDecision.allow();
            }

            double missingTokens = 1.0d - tokens;
            long retryAfterNanos = (long) Math.ceil(missingTokens / refillTokensPerNano);
            return RateLimitDecision.reject(Duration.ofNanos(Math.max(1L, retryAfterNanos)));
        }

        private synchronized boolean isExpired(long nowNanos) {
            return nowNanos - lastAccessNanos >= bucketTtlNanos;
        }

        private void refill(long nowNanos) {
            long elapsedNanos = nowNanos - lastRefillNanos;
            if (elapsedNanos <= 0L) {
                return;
            }

            double replenishedTokens = elapsedNanos * refillTokensPerNano;
            tokens = Math.min(capacity, tokens + replenishedTokens);
            lastRefillNanos = nowNanos;
        }
    }
}
