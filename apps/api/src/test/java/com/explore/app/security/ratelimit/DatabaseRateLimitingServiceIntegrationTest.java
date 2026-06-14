package com.explore.app.security.ratelimit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
class DatabaseRateLimitingServiceIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearBuckets() {
        jdbcTemplate.update("DELETE FROM rate_limit_buckets");
    }

    @Test
    void databaseStorageSharesCountersAcrossServiceInstances() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setStorage(RateLimitProperties.StorageMode.DATABASE);

        Clock clock = Clock.fixed(Instant.parse("2026-06-14T10:15:30Z"), ZoneOffset.UTC);
        RateLimitProperties.LimitRule rule = new RateLimitProperties.LimitRule(1, java.time.Duration.ofMinutes(1));

        RateLimitingService firstInstance = new RateLimitingService(properties, jdbcTemplate, clock);
        RateLimitingService secondInstance = new RateLimitingService(properties, jdbcTemplate, clock);

        RateLimitDecision firstDecision = firstInstance.tryConsume("auth-login", "ip:203.0.113.10", rule);
        RateLimitDecision secondDecision = secondInstance.tryConsume("auth-login", "ip:203.0.113.10", rule);

        assertTrue(firstDecision.allowed());
        assertFalse(secondDecision.allowed());
    }
}
