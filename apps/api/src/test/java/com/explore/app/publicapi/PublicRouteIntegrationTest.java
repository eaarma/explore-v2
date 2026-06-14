package com.explore.app.publicapi;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.service.JourneyLocationService;
import com.explore.app.journeys.service.JourneyService;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.service.LocationService;
import com.explore.app.shared.NotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
@AutoConfigureMockMvc
class PublicRouteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LocationService locationService;

    @MockBean
    private JourneyService journeyService;

    @MockBean
    private JourneyLocationService journeyLocationService;

    @Test
    void publicLocationsRouteWorksWithoutExplicitPaginationParams() throws Exception {
        when(locationService.getPublicLocations(0, 100)).thenReturn(List.of(
                LocationResponse.builder()
                        .id(15L)
                        .title("Forest Shelter")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(15))
                .andExpect(jsonPath("$[0].title").value("Forest Shelter"));

        verify(locationService).getPublicLocations(0, 100);
    }

    @Test
    void publicLocationCategoryRouteWorksWithoutAuth() throws Exception {
        when(locationService.getPublicLocationsByCategory("nature", 0, 100)).thenReturn(List.of(
                LocationResponse.builder()
                        .id(1L)
                        .title("Bog Trail")
                        .category("nature")
                        .county("Harju")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/locations/category/{category}", "nature"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Bog Trail"))
                .andExpect(jsonPath("$[0].category").value("nature"));

        verify(locationService).getPublicLocationsByCategory("nature", 0, 100);
    }

    @Test
    void publicLocationCountyRouteWorksWithoutAuth() throws Exception {
        when(locationService.getPublicLocationsByCounty("Harju", 0, 100)).thenReturn(List.of(
                LocationResponse.builder()
                        .id(2L)
                        .title("Cliff Walk")
                        .county("Harju")
                        .category("hiking")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/locations/county/{county}", "Harju"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].county").value("Harju"))
                .andExpect(jsonPath("$[0].title").value("Cliff Walk"));

        verify(locationService).getPublicLocationsByCounty("Harju", 0, 100);
    }

    @Test
    void publicLocationNearbyRouteWorksWithoutAuth() throws Exception {
        when(locationService.getPublicNearbyLocations(59.437, 24.7536, 750.0, 0, 100)).thenReturn(List.of(
                LocationResponse.builder()
                        .id(3L)
                        .title("Nearby Point")
                        .latitude(59.4372)
                        .longitude(24.7539)
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/locations/nearby")
                        .queryParam("latitude", "59.437")
                        .queryParam("longitude", "24.7536")
                        .queryParam("radiusMeters", "750"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].title").value("Nearby Point"));

        verify(locationService).getPublicNearbyLocations(59.437, 24.7536, 750.0, 0, 100);
    }

    @Test
    void publicLocationNearbyRouteReturnsBadRequestWhenServiceRejectsClientInput() throws Exception {
        when(locationService.getPublicNearbyLocations(59.437, 24.7536, -1.0, 0, 100))
                .thenThrow(new IllegalArgumentException("Radius must be zero or greater"));

        mockMvc.perform(get("/api/public/locations/nearby")
                        .queryParam("latitude", "59.437")
                        .queryParam("longitude", "24.7536")
                        .queryParam("radiusMeters", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Radius must be zero or greater"));

        verify(locationService).getPublicNearbyLocations(59.437, 24.7536, -1.0, 0, 100);
    }

    @Test
    void publicLocationByIdReturnsNotFoundWithoutAuthWhenInactiveOrMissing() throws Exception {
        when(locationService.getPublicLocationById(99L))
                .thenThrow(new NotFoundException("Location not found"));

        mockMvc.perform(get("/api/public/locations/{id}", 99L))
                .andExpect(status().isNotFound());

        verify(locationService).getPublicLocationById(99L);
    }

    @Test
    void publicJourneysRouteWorksWithoutExplicitPaginationParams() throws Exception {
        when(journeyService.getPublicJourneys(0, 100)).thenReturn(List.of(
                JourneyResponse.builder()
                        .id(16L)
                        .title("River Route")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/journeys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(16))
                .andExpect(jsonPath("$[0].title").value("River Route"));

        verify(journeyService).getPublicJourneys(0, 100);
    }

    @Test
    void publicJourneyCategoryRouteWorksWithoutAuth() throws Exception {
        when(journeyService.getPublicJourneysByCategory("hiking", 0, 100)).thenReturn(List.of(
                JourneyResponse.builder()
                        .id(10L)
                        .title("Forest Loop")
                        .category("hiking")
                        .county("Harju")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/journeys/category/{category}", "hiking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Forest Loop"))
                .andExpect(jsonPath("$[0].category").value("hiking"));

        verify(journeyService).getPublicJourneysByCategory("hiking", 0, 100);
    }

    @Test
    void publicJourneyCountyRouteWorksWithoutAuth() throws Exception {
        when(journeyService.getPublicJourneysByCounty("Harju", 0, 100)).thenReturn(List.of(
                JourneyResponse.builder()
                        .id(11L)
                        .title("Coastal Ride")
                        .county("Harju")
                        .category("adventure")
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/journeys/county/{county}", "Harju"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(11))
                .andExpect(jsonPath("$[0].county").value("Harju"))
                .andExpect(jsonPath("$[0].title").value("Coastal Ride"));

        verify(journeyService).getPublicJourneysByCounty("Harju", 0, 100);
    }

    @Test
    void publicJourneyNearbyRouteWorksWithoutAuth() throws Exception {
        when(journeyService.getPublicNearbyJourneys(59.437, 24.7536, 1500.0, 0, 100)).thenReturn(List.of(
                JourneyResponse.builder()
                        .id(12L)
                        .title("Nearby Journey")
                        .latitude(59.438)
                        .longitude(24.754)
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/journeys/nearby")
                        .queryParam("latitude", "59.437")
                        .queryParam("longitude", "24.7536")
                        .queryParam("radiusMeters", "1500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(12))
                .andExpect(jsonPath("$[0].title").value("Nearby Journey"));

        verify(journeyService).getPublicNearbyJourneys(59.437, 24.7536, 1500.0, 0, 100);
    }

    @Test
    void publicJourneyDetailRouteWorksWithoutAuth() throws Exception {
        JourneyLocationResponse stop = JourneyLocationResponse.builder()
                .id(21L)
                .journeyId(13L)
                .locationId(5L)
                .title("Visible Stop")
                .sortOrder(0)
                .status(1)
                .build();
        when(journeyService.getPublicJourneyWithLocations(13L)).thenReturn(
                JourneyDetailResponse.builder()
                        .id(13L)
                        .title("Historic Route")
                        .county("Harju")
                        .category("sightseeing")
                        .status(1)
                        .locations(List.of(stop))
                        .build());

        mockMvc.perform(get("/api/public/journeys/{journeyId}/detail", 13L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(13))
                .andExpect(jsonPath("$.title").value("Historic Route"))
                .andExpect(jsonPath("$.locations[0].locationId").value(5))
                .andExpect(jsonPath("$.locations[0].title").value("Visible Stop"));

        verify(journeyService).getPublicJourneyWithLocations(13L);
    }

    @Test
    void publicJourneyByIdReturnsNotFoundWithoutAuthWhenInactiveOrMissing() throws Exception {
        when(journeyService.getPublicJourneyById(77L))
                .thenThrow(new NotFoundException("Journey not found"));

        mockMvc.perform(get("/api/public/journeys/{id}", 77L))
                .andExpect(status().isNotFound());

        verify(journeyService).getPublicJourneyById(77L);
    }

    @Test
    void publicJourneyDetailReturnsNotFoundWithoutAuthWhenInactiveOrMissing() throws Exception {
        when(journeyService.getPublicJourneyWithLocations(78L))
                .thenThrow(new NotFoundException("Journey not found"));

        mockMvc.perform(get("/api/public/journeys/{journeyId}/detail", 78L))
                .andExpect(status().isNotFound());

        verify(journeyService).getPublicJourneyWithLocations(78L);
    }

    @Test
    void publicJourneyLocationsRouteWorksWithoutAuth() throws Exception {
        when(journeyLocationService.getPublicLocationsForJourney(14L)).thenReturn(List.of(
                JourneyLocationResponse.builder()
                        .id(22L)
                        .journeyId(14L)
                        .locationId(6L)
                        .title("Stop One")
                        .sortOrder(0)
                        .status(1)
                        .build()));

        mockMvc.perform(get("/api/public/journeys/{journeyId}/locations", 14L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].journeyId").value(14))
                .andExpect(jsonPath("$[0].locationId").value(6))
                .andExpect(jsonPath("$[0].title").value("Stop One"));

        verify(journeyLocationService).getPublicLocationsForJourney(14L);
    }
}
