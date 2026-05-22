package com.explore.app.security.jwt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class JwtService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final JwtProperties jwtProperties;
    private final ObjectMapper objectMapper;
    private final byte[] signingKey;

    public JwtService(JwtProperties jwtProperties, ObjectMapper objectMapper) {
        this.jwtProperties = jwtProperties;
        this.objectMapper = objectMapper;
        this.signingKey = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(UserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtProperties.expirationMs());

        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(Map.of(
                "sub", userDetails.getUsername(),
                "iat", now.getEpochSecond(),
                "exp", expiry.getEpochSecond()));
        String signingInput = header + "." + payload;

        return signingInput + "." + encodeBase64Url(sign(signingInput));
    }

    public String extractUsername(String token) {
        Object subject = extractPayload(token).get("sub");
        if (!(subject instanceof String username) || username.isBlank()) {
            throw new IllegalArgumentException("Token subject is missing");
        }

        return username;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Object expiration = extractPayload(token).get("exp");
        if (!(expiration instanceof Number expiresAtEpochSeconds)) {
            throw new IllegalArgumentException("Token expiration is missing");
        }

        return Instant.ofEpochSecond(expiresAtEpochSeconds.longValue()).isBefore(Instant.now());
    }

    private Map<String, Object> extractPayload(String token) {
        String[] tokenParts = token.split("\\.");
        if (tokenParts.length != 3) {
            throw new IllegalArgumentException("Token must contain header, payload and signature");
        }

        String signingInput = tokenParts[0] + "." + tokenParts[1];
        byte[] providedSignature = decodeBase64Url(tokenParts[2]);
        byte[] expectedSignature = sign(signingInput);

        if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
            throw new IllegalArgumentException("Token signature is invalid");
        }

        try {
            byte[] payloadBytes = decodeBase64Url(tokenParts[1]);
            return objectMapper.readValue(payloadBytes, MAP_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Token payload is invalid", exception);
        }
    }

    private String encodeJson(Map<String, Object> content) {
        try {
            return encodeBase64Url(objectMapper.writeValueAsBytes(content));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JWT content", exception);
        }
    }

    private byte[] sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign JWT token", exception);
        }
    }

    private String encodeBase64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] decodeBase64Url(String value) {
        try {
            return Base64.getUrlDecoder().decode(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Token contains invalid base64url data", exception);
        }
    }
}


