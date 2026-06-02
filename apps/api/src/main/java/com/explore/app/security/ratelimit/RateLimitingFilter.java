package com.explore.app.security.ratelimit;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String REGISTER_PATH = "/api/auth/register";
    private static final String DISCOVERY_CHECK_PATH = "/api/discoveries/check";
    private static final String DISCOVERY_SYNC_PATH = "/api/discoveries/sync-offline";

    private final RateLimitingService rateLimitingService;
    private final RateLimitProperties rateLimitProperties;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitProperties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitTarget target = resolveTarget(request);
        if (target == null) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitDecision decision = rateLimitingService.tryConsume(
                target.namespace(),
                target.subjectKey(),
                target.rule());

        if (decision.allowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        writeTooManyRequestsResponse(request, response, target.label(), decision.retryAfter());
    }

    private RateLimitTarget resolveTarget(HttpServletRequest request) {
        if (matchesExactPath(request, "POST", LOGIN_PATH)) {
            return new RateLimitTarget(
                    "auth-login",
                    "login",
                    resolveClientIpKey(request),
                    rateLimitProperties.getLogin());
        }

        if (matchesExactPath(request, "POST", REGISTER_PATH)) {
            return new RateLimitTarget(
                    "auth-register",
                    "registration",
                    resolveClientIpKey(request),
                    rateLimitProperties.getRegister());
        }

        if (matchesExactPath(request, "POST", DISCOVERY_CHECK_PATH)
                || matchesExactPath(request, "POST", DISCOVERY_SYNC_PATH)) {
            return new RateLimitTarget(
                    "discovery",
                    "discovery sync",
                    resolveAuthenticatedSubjectKey(request),
                    rateLimitProperties.getDiscovery());
        }

        if (matchesAdminImageUploadPath(request)) {
            return new RateLimitTarget(
                    "admin-image-upload",
                    "admin image upload",
                    resolveAuthenticatedSubjectKey(request),
                    rateLimitProperties.getAdminImageUpload());
        }

        return null;
    }

    private String resolveAuthenticatedSubjectKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String subject = authentication.getName();
            if (StringUtils.hasText(subject) && !"anonymousUser".equalsIgnoreCase(subject)) {
                return "user:" + subject.trim().toLowerCase(Locale.ROOT);
            }
        }

        return resolveClientIpKey(request);
    }

    private String resolveClientIpKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            String firstAddress = forwardedFor.split(",")[0].trim();
            if (StringUtils.hasText(firstAddress)) {
                return "ip:" + firstAddress;
            }
        }

        String forwarded = request.getHeader("Forwarded");
        if (StringUtils.hasText(forwarded)) {
            for (String segment : forwarded.split(";")) {
                String trimmedSegment = segment.trim();
                if (trimmedSegment.regionMatches(true, 0, "for=", 0, 4)) {
                    String address = trimmedSegment.substring(4).replace("\"", "").trim();
                    if (StringUtils.hasText(address)) {
                        return "ip:" + address;
                    }
                }
            }
        }

        return "ip:" + request.getRemoteAddr();
    }

    private void writeTooManyRequestsResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            String targetLabel,
            Duration retryAfter) throws IOException {

        long retryAfterSeconds = toRetryAfterSeconds(retryAfter);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", Long.toString(retryAfterSeconds));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase());
        body.put("message", "Too many requests for " + targetLabel + ". Please retry later.");
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getWriter(), body);
    }

    private boolean matchesExactPath(HttpServletRequest request, String method, String path) {
        return method.equalsIgnoreCase(request.getMethod()) && path.equals(resolveRequestPath(request));
    }

    private boolean matchesAdminImageUploadPath(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String requestUri = resolveRequestPath(request);
        return requestUri.matches("^/api/admin/locations/[^/]+/images$");
    }

    private String resolveRequestPath(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (StringUtils.hasText(contextPath) && requestUri.startsWith(contextPath)) {
            return requestUri.substring(contextPath.length());
        }
        return requestUri;
    }

    private long toRetryAfterSeconds(Duration retryAfter) {
        long retryAfterMillis = Math.max(1L, retryAfter.toMillis());
        return Math.max(1L, (retryAfterMillis + 999L) / 1000L);
    }

    private record RateLimitTarget(
            String namespace,
            String label,
            String subjectKey,
            RateLimitProperties.LimitRule rule) {
    }
}
