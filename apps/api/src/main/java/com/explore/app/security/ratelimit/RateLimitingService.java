package com.explore.app.security.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

@Service
public class RateLimitingService {

    private static final long MIN_BUCKET_TTL_NANOS = Duration.ofMinutes(1).toNanos();
    private static final long CLEANUP_INTERVAL = 256L;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicLong cleanupCounter = new AtomicLong();

    public RateLimitDecision tryConsume(String bucketNamespace, String subjectKey, RateLimitProperties.LimitRule rule) {
        long nowNanos = System.nanoTime();
        String bucketKey = bucketNamespace + ":" + subjectKey;

        TokenBucket bucket = buckets.computeIfAbsent(
                bucketKey,
                key -> new TokenBucket(rule.getMaxRequests(), rule.getWindow(), nowNanos));

        RateLimitDecision decision = bucket.tryConsume(nowNanos);
        cleanupExpiredBuckets(nowNanos);
        return decision;
    }

    private void cleanupExpiredBuckets(long nowNanos) {
        if (cleanupCounter.incrementAndGet() % CLEANUP_INTERVAL != 0) {
            return;
        }

        buckets.entrySet().removeIf(entry -> entry.getValue().isExpired(nowNanos));
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
            this.bucketTtlNanos = Math.max(window.multipliedBy(2).toNanos(), MIN_BUCKET_TTL_NANOS);
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
