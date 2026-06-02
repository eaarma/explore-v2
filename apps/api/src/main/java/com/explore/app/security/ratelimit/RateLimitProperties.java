package com.explore.app.security.ratelimit;

import java.time.Duration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "security.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;

    @Valid
    @NotNull
    private LimitRule login = new LimitRule(5, Duration.ofMinutes(1));

    @Valid
    @NotNull
    private LimitRule register = new LimitRule(5, Duration.ofMinutes(15));

    @Valid
    @NotNull
    private LimitRule discovery = new LimitRule(120, Duration.ofMinutes(1));

    @Valid
    @NotNull
    private LimitRule adminImageUpload = new LimitRule(20, Duration.ofMinutes(10));

    @Getter
    @Setter
    public static class LimitRule {

        @Min(1)
        private int maxRequests;

        @NotNull
        private Duration window;

        public LimitRule() {
        }

        public LimitRule(int maxRequests, Duration window) {
            this.maxRequests = maxRequests;
            this.window = window;
        }
    }
}
