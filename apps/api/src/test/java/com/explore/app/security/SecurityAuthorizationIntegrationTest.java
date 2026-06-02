package com.explore.app.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.explore.app.discoveries.service.DiscoveryService;
import com.explore.app.locations.dto.LocationImageUploadResponse;
import com.explore.app.locations.service.LocationService;
import com.explore.app.trips.service.TripService;
import com.explore.app.user.dto.UpdateUserRequest;
import com.explore.app.user.dto.UserResponse;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.UserStatus;
import com.explore.app.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
@AutoConfigureMockMvc
class SecurityAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private DiscoveryService discoveryService;

    @MockBean
    private TripService tripService;

    @MockBean
    private LocationService locationService;

    @Test
    void managerCannotPatchAdminUsers() throws Exception {
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");

        mockMvc.perform(patch("/api/admin/users/{id}", userId)
                        .with(user("manager@example.com").roles("MANAGER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Patched User",
                                  "role": "ADMIN",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(userService, never()).updateUser(eq(userId), any(UpdateUserRequest.class));
    }

    @Test
    void adminCanPatchAdminUsers() throws Exception {
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UserResponse response = UserResponse.builder()
                .id(userId)
                .email("patched@example.com")
                .name("Patched User")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.parse("2026-06-03T00:00:00Z"))
                .build();

        when(userService.updateUser(eq(userId), any(UpdateUserRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/admin/users/{id}", userId)
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Patched User",
                                  "role": "ADMIN",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("patched@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(userService).updateUser(eq(userId), any(UpdateUserRequest.class));
    }

    @Test
    void managerCanReadManagerUsers() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(UUID.fromString("33333333-3333-3333-3333-333333333333"))
                .email("manager-visible@example.com")
                .name("Visible User")
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.parse("2026-06-03T00:00:00Z"))
                .build();

        when(userService.getAllUsers()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/manager/users")
                        .with(user("manager@example.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("manager-visible@example.com"))
                .andExpect(jsonPath("$[0].role").value("USER"));

        verify(userService).getAllUsers();
    }

    @Test
    void anonymousUserCannotAccessDiscoveryCheck() throws Exception {
        mockMvc.perform(post("/api/discoveries/check")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 59.437,
                                  "longitude": 24.7536,
                                  "accuracyMeters": 8.5
                                }
                                """))
                .andExpect(status().isUnauthorized());

        verify(discoveryService, never()).check(any(), any());
    }

    @Test
    void anonymousUserCannotCreateTrips() throws Exception {
        mockMvc.perform(post("/api/users/me/trips")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Weekend Plan",
                                  "description": "Forest loop"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        verify(tripService, never()).createTrip(any(), any());
    }

    @Test
    void managerCannotUploadAdminLocationImages() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.png",
                "image/png",
                "fake-image".getBytes());

        mockMvc.perform(multipart("/api/admin/locations/{id}/images", 42L)
                        .file(file)
                        .with(user("manager@example.com").roles("MANAGER")))
                .andExpect(status().isForbidden());

        verify(locationService, never()).uploadLocationImage(any(), eq(42L), any());
    }

    @Test
    void managerCannotDeletePendingAdminLocationImages() throws Exception {
        mockMvc.perform(delete("/api/admin/locations/{id}/images/temp", 42L)
                        .queryParam("storagePath", "locations/42/temp.png")
                        .with(user("manager@example.com").roles("MANAGER")))
                .andExpect(status().isForbidden());

        verify(locationService, never()).deletePendingLocationImage(any(), eq(42L), any());
    }

    @Test
    void adminCanUploadAdminLocationImages() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.png",
                "image/png",
                "fake-image".getBytes());
        LocationImageUploadResponse response = LocationImageUploadResponse.builder()
                .url("https://firebasestorage.googleapis.com/example")
                .storagePath("locations/42/generated.png")
                .fileName("generated.png")
                .build();

        when(locationService.uploadLocationImage(eq("admin@example.com"), eq(42L), any()))
                .thenReturn(response);

        mockMvc.perform(multipart("/api/admin/locations/{id}/images", 42L)
                        .file(file)
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.storagePath").value("locations/42/generated.png"))
                .andExpect(jsonPath("$.fileName").value("generated.png"));

        verify(locationService).uploadLocationImage(eq("admin@example.com"), eq(42L), any());
    }
}
