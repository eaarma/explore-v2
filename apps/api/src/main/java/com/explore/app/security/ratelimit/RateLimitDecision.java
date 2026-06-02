package com.explore.app.security.ratelimit;

import java.time.Duration;

public record RateLimitDecision(boolean allowed, Duration retryAfter) {

    public static RateLimitDecision allow() {
        return new RateLimitDecision(true, Duration.ZERO);
    }

    public static RateLimitDecision reject(Duration retryAfter) {
        return new RateLimitDecision(false, retryAfter);
    }
}
