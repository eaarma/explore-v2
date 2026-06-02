package com.explore.app.geospatial;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.journeys.service.JourneyService;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.locations.service.LocationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "security.rate-limit.enabled=false")
@Transactional
class NearbyQueryIntegrationTest {

    private static final double TEST_LATITUDE = 59.4370;
    private static final double TEST_LONGITUDE = 24.7536;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private JourneyRepository journeyRepository;

    @Autowired
    private LocationService locationService;

    @Autowired
    private JourneyService journeyService;

    @Test
    void discoveryCandidateQueryReturnsOnlyActiveNearbyLocationsOrderedByDistance() {
        Location closest = saveLocation(
                "Closest Location",
                TEST_LATITUDE,
                TEST_LONGITUDE,
                LocationStatus.ACTIVE);
        Location secondClosest = saveLocation(
                "Second Closest Location",
                59.43745,
                TEST_LONGITUDE,
                LocationStatus.ACTIVE);
        saveLocation(
                "Too Far Location",
                59.4470,
                TEST_LONGITUDE,
                LocationStatus.ACTIVE);
        saveLocation(
                "Inactive Nearby Location",
                59.43720,
                TEST_LONGITUDE,
                LocationStatus.INACTIVE);

        List<LocationRepository.DiscoveryCandidateProjection> results =
                locationRepository.findDiscoveryCandidates(
                        TEST_LATITUDE,
                        TEST_LONGITUDE,
                        100d,
                        LocationStatus.ACTIVE.name());

        assertEquals(2, results.size());
        assertEquals(closest.getId(), results.get(0).getLocationId());
        assertEquals(secondClosest.getId(), results.get(1).getLocationId());
        assertTrue(results.get(0).getDistanceMeters() <= results.get(1).getDistanceMeters());
        assertTrue(results.get(0).getDistanceMeters() < 1d);
        assertTrue(results.get(1).getDistanceMeters() > 1d);
    }

    @Test
    void publicNearbyLocationsUsesRealDatabaseRecordsAndFiltersByRadiusAndStatus() {
        Location included = saveLocation(
                "Included Location",
                TEST_LATITUDE,
                TEST_LONGITUDE,
                LocationStatus.ACTIVE);
        Location alsoIncluded = saveLocation(
                "Also Included",
                59.43740,
                24.7536,
                LocationStatus.ACTIVE);
        saveLocation(
                "Outside Radius",
                59.4470,
                TEST_LONGITUDE,
                LocationStatus.ACTIVE);
        saveLocation(
                "Inactive Nearby",
                59.43725,
                TEST_LONGITUDE,
                LocationStatus.INACTIVE);

        List<LocationResponse> results =
                locationService.getPublicNearbyLocations(TEST_LATITUDE, TEST_LONGITUDE, 100d);

        assertEquals(2, results.size());
        assertEquals(
                Set.of(included.getId(), alsoIncluded.getId()),
                results.stream().map(LocationResponse::getId).collect(Collectors.toSet()));
        assertTrue(results.stream().noneMatch(location -> "Outside Radius".equals(location.getTitle())));
        assertTrue(results.stream().noneMatch(location -> "Inactive Nearby".equals(location.getTitle())));
    }

    @Test
    void publicNearbyJourneysUsesRealDatabaseRecordsAndFiltersByRadiusAndStatus() {
        Journey included = saveJourney(
                "Included Journey",
                TEST_LATITUDE,
                TEST_LONGITUDE,
                JourneyStatus.ACTIVE);
        Journey alsoIncluded = saveJourney(
                "Also Included Journey",
                59.43735,
                24.7536,
                JourneyStatus.ACTIVE);
        saveJourney(
                "Outside Radius Journey",
                59.4570,
                TEST_LONGITUDE,
                JourneyStatus.ACTIVE);
        saveJourney(
                "Inactive Nearby Journey",
                59.43725,
                TEST_LONGITUDE,
                JourneyStatus.INACTIVE);
        journeyRepository.saveAndFlush(Journey.builder()
                .title("Journey Missing Coordinates")
                .status(JourneyStatus.ACTIVE)
                .build());

        List<JourneyResponse> results =
                journeyService.getPublicNearbyJourneys(TEST_LATITUDE, TEST_LONGITUDE, 100d);

        assertEquals(2, results.size());
        assertEquals(
                Set.of(included.getId(), alsoIncluded.getId()),
                results.stream().map(JourneyResponse::getId).collect(Collectors.toSet()));
        assertTrue(results.stream().noneMatch(journey -> "Outside Radius Journey".equals(journey.getTitle())));
        assertTrue(results.stream().noneMatch(journey -> "Inactive Nearby Journey".equals(journey.getTitle())));
        assertTrue(results.stream().noneMatch(journey -> "Journey Missing Coordinates".equals(journey.getTitle())));
    }

    private Location saveLocation(String title, double latitude, double longitude, LocationStatus status) {
        return locationRepository.saveAndFlush(Location.builder()
                .title(title)
                .latitude(latitude)
                .longitude(longitude)
                .county("Harju")
                .category("nature")
                .status(status)
                .build());
    }

    private Journey saveJourney(String title, double latitude, double longitude, JourneyStatus status) {
        return journeyRepository.saveAndFlush(Journey.builder()
                .title(title)
                .latitude(latitude)
                .longitude(longitude)
                .county("Harju")
                .category("hiking")
                .status(status)
                .build());
    }

}
