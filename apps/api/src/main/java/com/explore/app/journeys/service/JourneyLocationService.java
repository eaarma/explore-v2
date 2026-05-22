package com.explore.app.journeys.service;

import com.explore.app.journeys.mapper.JourneyLocationMapper;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.journeys.dto.JourneyLocationOrderRequest;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JourneyLocationService {

    private final JourneyRepository journeyRepository;
    private final LocationRepository locationRepository;
    private final JourneyLocationRepository journeyLocationRepository;
    private final JourneyLocationMapper journeyLocationMapper;

    public List<JourneyLocationResponse> getLocationsForJourney(Long journeyId) {
        findJourney(journeyId);

        return journeyLocationRepository.findByJourneyIdOrderBySortOrderAsc(journeyId)
                .stream()
                .map(journeyLocationMapper::toResponse)
                .toList();
    }

    @Transactional
    public void addLocationToJourney(Long journeyId, Long locationId, Integer sortOrder) {
        validateSortOrder(sortOrder);

        if (journeyLocationRepository.existsByJourneyIdAndLocationId(journeyId, locationId)) {
            throw new IllegalArgumentException("Location is already assigned to this journey");
        }

        Journey journey = findJourney(journeyId);
        Location location = findLocation(locationId);

        journeyLocationRepository.save(JourneyLocation.builder()
                .journey(journey)
                .location(location)
                .sortOrder(sortOrder)
                .build());
    }

    @Transactional
    public void removeLocationFromJourney(Long journeyId, Long locationId) {
        JourneyLocation journeyLocation = journeyLocationRepository.findByJourneyIdAndLocationId(journeyId, locationId)
                .orElseThrow(() -> new IllegalArgumentException("Journey location mapping not found"));

        journeyLocationRepository.delete(journeyLocation);
    }

    @Transactional
    public void reorderJourneyLocations(Long journeyId, List<JourneyLocationOrderRequest> order) {
        findJourney(journeyId);
        validateOrder(order);

        List<JourneyLocation> existingLocations = journeyLocationRepository.findByJourneyIdOrderBySortOrderAsc(journeyId);
        if (existingLocations.size() != order.size()) {
            throw new IllegalArgumentException("Reorder payload must include all current journey locations");
        }

        Map<Long, JourneyLocation> locationsById = existingLocations.stream()
                .collect(Collectors.toMap(location -> location.getLocation().getId(), Function.identity()));

        for (JourneyLocationOrderRequest request : order) {
            JourneyLocation journeyLocation = locationsById.get(request.getLocationId());
            if (journeyLocation == null) {
                throw new IllegalArgumentException("Location " + request.getLocationId() + " is not part of the journey");
            }

            journeyLocation.setSortOrder(request.getSortOrder());
        }
    }

    @Transactional
    public void replaceJourneyLocations(Long journeyId, List<JourneyLocationOrderRequest> locations) {
        Journey journey = findJourney(journeyId);
        validateOrder(locations);

        List<JourneyLocation> existingLocations = journeyLocationRepository.findByJourneyIdOrderBySortOrderAsc(journeyId);
        if (!existingLocations.isEmpty()) {
            journeyLocationRepository.deleteAll(existingLocations);
            journeyLocationRepository.flush();
        }

        List<JourneyLocation> replacements = locations.stream()
                .map(request -> JourneyLocation.builder()
                        .journey(journey)
                        .location(findLocation(request.getLocationId()))
                        .sortOrder(request.getSortOrder())
                        .build())
                .toList();

        journeyLocationRepository.saveAll(replacements);
    }

    private Journey findJourney(Long journeyId) {
        return journeyRepository.findById(journeyId)
                .orElseThrow(() -> new IllegalArgumentException("Journey not found"));
    }

    private Location findLocation(Long locationId) {
        return locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));
    }

    private void validateOrder(List<JourneyLocationOrderRequest> order) {
        if (order == null) {
            throw new IllegalArgumentException("Order payload must not be null");
        }

        Set<Long> locationIds = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();

        for (JourneyLocationOrderRequest request : order) {
            if (request == null) {
                throw new IllegalArgumentException("Order entries must not be null");
            }

            if (request.getLocationId() == null) {
                throw new IllegalArgumentException("Location id must not be null");
            }

            validateSortOrder(request.getSortOrder());

            if (!locationIds.add(request.getLocationId())) {
                throw new IllegalArgumentException("Duplicate location id in order payload: " + request.getLocationId());
            }

            if (!sortOrders.add(request.getSortOrder())) {
                throw new IllegalArgumentException("Duplicate sort order in payload: " + request.getSortOrder());
            }
        }
    }

    private void validateSortOrder(Integer sortOrder) {
        if (sortOrder == null || sortOrder < 0) {
            throw new IllegalArgumentException("Sort order must be zero or greater");
        }
    }
}





