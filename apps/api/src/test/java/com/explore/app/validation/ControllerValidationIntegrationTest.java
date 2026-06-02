package com.explore.app.validation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.explore.app.journeys.service.JourneyService;
import com.explore.app.locations.service.LocationService;
import com.explore.app.trips.service.TripService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
@AutoConfigureMockMvc
class ControllerValidationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TripService tripService;

    @MockBean
    private LocationService locationService;

    @MockBean
    private JourneyService journeyService;

    @Test
    void createTripRejectsBlankNamePayload() throws Exception {
        mockMvc.perform(post("/api/users/me/trips")
                        .with(user("user@example.com").roles("USER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": " ",
                                  "description": "Forest loop"
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(tripService, never()).createTrip(any(), any());
    }

    @Test
    void addLocationToTripRejectsNonPositiveLocationId() throws Exception {
        mockMvc.perform(post("/api/users/me/trips/{tripId}/locations", 5L)
                        .with(user("user@example.com").roles("USER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "locationId": 0
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(tripService, never()).addLocationToTrip(any(), eq(5L), any());
    }

    @Test
    void createLocationRejectsOutOfRangeCoordinatesAndStatus() throws Exception {
        mockMvc.perform(post("/api/manager/locations")
                        .with(user("manager@example.com").roles("MANAGER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Cliff Walk",
                                  "latitude": 91.0,
                                  "longitude": -181.0,
                                  "status": 7
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(locationService, never()).createLocation(any(), any());
    }

    @Test
    void updateLocationStatusRejectsOutOfRangeStatusQueryParam() throws Exception {
        mockMvc.perform(patch("/api/manager/locations/{id}/status", 42L)
                        .with(user("manager@example.com").roles("MANAGER"))
                        .queryParam("status", "99"))
                .andExpect(status().isBadRequest());

        verify(locationService, never()).updateLocationStatus(eq(42L), any());
    }

    @Test
    void createJourneyRejectsOutOfRangeCoordinatesDistanceAndStatus() throws Exception {
        mockMvc.perform(post("/api/manager/journeys")
                        .with(user("manager@example.com").roles("MANAGER"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Forest Loop",
                                  "latitude": -91.0,
                                  "longitude": 181.0,
                                  "distance": -1.0,
                                  "status": 4
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(journeyService, never()).createJourney(any());
    }

    @Test
    void updateJourneyStatusRejectsOutOfRangeStatusQueryParam() throws Exception {
        mockMvc.perform(patch("/api/manager/journeys/{id}/status", 42L)
                        .with(user("manager@example.com").roles("MANAGER"))
                        .queryParam("status", "2"))
                .andExpect(status().isBadRequest());

        verify(journeyService, never()).updateJourneyStatus(eq(42L), any());
    }

    @Test
    void uploadLocationImageRejectsMissingMultipartFile() throws Exception {
        mockMvc.perform(multipart("/api/admin/locations/{id}/images", 42L)
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isBadRequest());

        verify(locationService, never()).uploadLocationImage(any(), eq(42L), any());
    }
}
