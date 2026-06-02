package com.explore.app.security.ratelimit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import com.explore.app.auth.dto.LoginResponse;
import com.explore.app.auth.service.AuthService;
import com.explore.app.discoveries.dto.DiscoveryCheckResponse;
import com.explore.app.discoveries.service.DiscoveryService;
import com.explore.app.locations.dto.LocationImageUploadResponse;
import com.explore.app.locations.service.LocationService;
import com.explore.app.user.dto.UserResponse;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@SpringBootTest(properties = {
        "security.rate-limit.enabled=true",
        "security.rate-limit.login.max-requests=1",
        "security.rate-limit.login.window=PT1M",
        "security.rate-limit.discovery.max-requests=1",
        "security.rate-limit.discovery.window=PT1M",
        "security.rate-limit.admin-image-upload.max-requests=1",
        "security.rate-limit.admin-image-upload.window=PT1M"
})
@AutoConfigureMockMvc
class RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private DiscoveryService discoveryService;

    @MockBean
    private LocationService locationService;

    @Test
    void loginRouteReturns429AfterFirstRequestFromSameClientIp() throws Exception {
        when(authService.login(any())).thenReturn(LoginResponse.builder()
                .accessToken("token")
                .tokenType("Bearer")
                .user(UserResponse.builder()
                        .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                        .email("rate-limit-login@example.com")
                        .name("Rate Limit Login")
                        .role(Role.USER)
                        .status(UserStatus.ACTIVE)
                        .createdAt(Instant.parse("2026-06-03T00:00:00Z"))
                        .build())
                .build());

        mockMvc.perform(post("/api/auth/login")
                        .with(remoteAddr("203.0.113.10"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "rate-limit-login@example.com",
                                  "password": "CorrectPass1!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));

        mockMvc.perform(post("/api/auth/login")
                        .with(remoteAddr("203.0.113.10"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "rate-limit-login@example.com",
                                  "password": "CorrectPass1!"
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));

        verify(authService, times(1)).login(any());
    }

    @Test
    void discoveryRouteReturns429AfterFirstRequestForSameAuthenticatedUser() throws Exception {
        when(discoveryService.check(eq("rate-limit-discovery@example.com"), any()))
                .thenReturn(DiscoveryCheckResponse.builder()
                        .accuracyValid(true)
                        .maxAllowedAccuracyMeters(20.0)
                        .discoveryRadiusMeters(50.0)
                        .discoveredLocationCount(0)
                        .completedJourneyCount(0)
                        .checkedAt(Instant.parse("2026-06-03T00:00:00Z"))
                        .build());

        mockMvc.perform(post("/api/discoveries/check")
                        .with(user("rate-limit-discovery@example.com").roles("USER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 59.437,
                                  "longitude": 24.7536,
                                  "accuracyMeters": 8.5
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accuracyValid").value(true));

        mockMvc.perform(post("/api/discoveries/check")
                        .with(user("rate-limit-discovery@example.com").roles("USER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 59.437,
                                  "longitude": 24.7536,
                                  "accuracyMeters": 8.5
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));

        verify(discoveryService, times(1)).check(eq("rate-limit-discovery@example.com"), any());
    }

    @Test
    void adminImageUploadRouteReturns429AfterFirstRequestForSameAdminUser() throws Exception {
        when(locationService.uploadLocationImage(eq("rate-limit-admin@example.com"), eq(42L), any()))
                .thenReturn(LocationImageUploadResponse.builder()
                        .url("https://firebasestorage.googleapis.com/example")
                        .storagePath("locations/42/cover.png")
                        .fileName("cover.png")
                        .build());

        mockMvc.perform(multipart("/api/admin/locations/{id}/images", 42L)
                        .file(buildImageFile())
                        .with(user("rate-limit-admin@example.com").roles("ADMIN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.storagePath").value("locations/42/cover.png"));

        mockMvc.perform(multipart("/api/admin/locations/{id}/images", 42L)
                        .file(buildImageFile())
                        .with(user("rate-limit-admin@example.com").roles("ADMIN")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));

        verify(locationService, times(1)).uploadLocationImage(eq("rate-limit-admin@example.com"), eq(42L), any());
    }

    private MockMultipartFile buildImageFile() {
        return new MockMultipartFile(
                "file",
                "cover.png",
                "image/png",
                "fake-image".getBytes());
    }

    private RequestPostProcessor remoteAddr(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
