package com.explore.app.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String secret,
        long expirationMs) {

    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("security.jwt.secret must be configured");
        }

        if (secret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("security.jwt.secret must be at least 32 bytes");
        }

        if (expirationMs <= 0) {
            throw new IllegalArgumentException("security.jwt.expiration-ms must be greater than 0");
        }
    }
}


