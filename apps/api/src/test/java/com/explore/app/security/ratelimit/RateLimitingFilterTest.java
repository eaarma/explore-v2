package com.explore.app.security.ratelimit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class RateLimitingFilterTest {

    private final RateLimitingService rateLimitingService = new RateLimitingService();
    private final RateLimitProperties properties = buildProperties();
    private final RateLimitingFilter filter =
            new RateLimitingFilter(rateLimitingService, properties, new ObjectMapper());

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginRequestsAreBlockedAfterConfiguredBurst() throws ServletException, IOException {
        properties.setLogin(new RateLimitProperties.LimitRule(2, Duration.ofMinutes(1)));
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();

        MockHttpServletResponse first = executeRequest("POST", "/api/auth/login", "203.0.113.10", chain);
        MockHttpServletResponse second = executeRequest("POST", "/api/auth/login", "203.0.113.10", chain);
        MockHttpServletResponse third = executeRequest("POST", "/api/auth/login", "203.0.113.10", chain);

        assertEquals(200, first.getStatus());
        assertEquals(200, second.getStatus());
        assertEquals(429, third.getStatus());
        assertEquals(2, chainCalls.get());
        assertNotNull(third.getHeader("Retry-After"));
    }

    @Test
    void discoveryRateLimitIsScopedPerAuthenticatedUser() throws ServletException, IOException {
        properties.setDiscovery(new RateLimitProperties.LimitRule(1, Duration.ofMinutes(1)));
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("first@example.com", null, List.of()));
        MockHttpServletResponse firstUserResponse =
                executeRequest("POST", "/api/discoveries/check", "10.0.0.5", chain);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("second@example.com", null, List.of()));
        MockHttpServletResponse secondUserResponse =
                executeRequest("POST", "/api/discoveries/check", "10.0.0.5", chain);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("first@example.com", null, List.of()));
        MockHttpServletResponse blockedResponse =
                executeRequest("POST", "/api/discoveries/sync-offline", "10.0.0.5", chain);

        assertEquals(200, firstUserResponse.getStatus());
        assertEquals(200, secondUserResponse.getStatus());
        assertEquals(429, blockedResponse.getStatus());
        assertEquals(2, chainCalls.get());
    }

    @Test
    void adminImageUploadsAreRateLimitedOnUploadRoute() throws ServletException, IOException {
        properties.setAdminImageUpload(new RateLimitProperties.LimitRule(1, Duration.ofMinutes(1)));
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@example.com", null, List.of()));

        MockHttpServletResponse first =
                executeRequest("POST", "/api/admin/locations/42/images", "198.51.100.20", chain);
        MockHttpServletResponse second =
                executeRequest("POST", "/api/admin/locations/42/images", "198.51.100.20", chain);

        assertEquals(200, first.getStatus());
        assertEquals(429, second.getStatus());
        assertEquals(1, chainCalls.get());
    }

    @Test
    void NonProtectedRoutesAreNotRateLimited() throws ServletException, IOException {
        properties.setLogin(new RateLimitProperties.LimitRule(1, Duration.ofMinutes(1)));
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();

        MockHttpServletResponse first = executeRequest("GET", "/api/auth/me", "203.0.113.20", chain);
        MockHttpServletResponse second = executeRequest("GET", "/api/auth/me", "203.0.113.20", chain);

        assertEquals(200, first.getStatus());
        assertEquals(200, second.getStatus());
        assertEquals(2, chainCalls.get());
    }

    private MockHttpServletResponse executeRequest(
            String method,
            String path,
            String remoteAddress,
            FilterChain chain) throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr(remoteAddress);

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    private RateLimitProperties buildProperties() {
        return new RateLimitProperties();
    }
}
