package com.explore.app.trips.service;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.trips.dto.TripCreateRequest;
import com.explore.app.trips.dto.TripReorderItemRequest;
import com.explore.app.trips.dto.TripReorderRequest;
import com.explore.app.trips.dto.TripResponse;
import com.explore.app.trips.mapper.TripMapper;
import com.explore.app.trips.model.Trip;
import com.explore.app.trips.model.TripJourney;
import com.explore.app.trips.model.TripLocation;
import com.explore.app.trips.repository.TripJourneyRepository;
import com.explore.app.trips.repository.TripLocationRepository;
import com.explore.app.trips.repository.TripRepository;
import com.explore.app.shared.NotFoundException;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TripService {

    private final TripRepository tripRepository;
    private final TripLocationRepository tripLocationRepository;
    private final TripJourneyRepository tripJourneyRepository;
    private final LocationRepository locationRepository;
    private final JourneyRepository journeyRepository;
    private final UserRepository userRepository;
    private final TripMapper tripMapper;

    public List<TripResponse> getCurrentUserTrips(String email) {
        User user = findUser(email);

        return tripRepository.findByUserIdAndIsArchivedFalseOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(tripMapper::toResponse)
                .toList();
    }

    @Transactional
    public TripResponse createTrip(String email, TripCreateRequest request) {
        User user = findUser(email);
        Trip trip = tripMapper.toEntity(user, request);
        Trip savedTrip = tripRepository.save(trip);
        return tripMapper.toResponse(savedTrip);
    }

    @Transactional
    public TripResponse addLocationToTrip(String email, Long tripId, Long locationId) {
        User user = findUser(email);
        Trip trip = findOwnedTrip(user.getId(), tripId);
        ensureTripIsEditable(trip);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new NotFoundException("Location not found"));

        if (tripLocationRepository.findByTripIdAndLocationId(tripId, locationId).isEmpty()) {
            TripLocation tripLocation = TripLocation.builder()
                    .trip(trip)
                    .location(location)
                    .sortOrder(getNextTripSortOrder(tripId))
                    .build();
            tripLocationRepository.save(tripLocation);
        }

        touchTrip(trip);
        return tripMapper.toResponse(findOwnedTrip(user.getId(), tripId));
    }

    @Transactional
    public TripResponse addJourneyToTrip(String email, Long tripId, Long journeyId) {
        User user = findUser(email);
        Trip trip = findOwnedTrip(user.getId(), tripId);
        ensureTripIsEditable(trip);
        Journey journey = journeyRepository.findById(journeyId)
                .orElseThrow(() -> new NotFoundException("Journey not found"));

        if (tripJourneyRepository.findByTripIdAndJourneyId(tripId, journeyId).isEmpty()) {
            TripJourney tripJourney = TripJourney.builder()
                    .trip(trip)
                    .journey(journey)
                    .sortOrder(getNextTripSortOrder(tripId))
                    .build();
            tripJourneyRepository.save(tripJourney);
        }

        touchTrip(trip);
        return tripMapper.toResponse(findOwnedTrip(user.getId(), tripId));
    }

    @Transactional
    public TripResponse removeLocationFromTrip(String email, Long tripId, Long locationId) {
        User user = findUser(email);
        Trip trip = findOwnedTrip(user.getId(), tripId);
        ensureTripIsEditable(trip);

        if (tripLocationRepository.findByTripIdAndLocationId(tripId, locationId).isPresent()) {
            tripLocationRepository.deleteByTripIdAndLocationId(tripId, locationId);
            touchTrip(trip);
        }

        return tripMapper.toResponse(findOwnedTrip(user.getId(), tripId));
    }

    @Transactional
    public TripResponse removeJourneyFromTrip(String email, Long tripId, Long journeyId) {
        User user = findUser(email);
        Trip trip = findOwnedTrip(user.getId(), tripId);
        ensureTripIsEditable(trip);

        if (tripJourneyRepository.findByTripIdAndJourneyId(tripId, journeyId).isPresent()) {
            tripJourneyRepository.deleteByTripIdAndJourneyId(tripId, journeyId);
            touchTrip(trip);
        }

        return tripMapper.toResponse(findOwnedTrip(user.getId(), tripId));
    }

    @Transactional
    public TripResponse reorderTripItems(String email, Long tripId, TripReorderRequest request) {
        User user = findUser(email);
        Trip trip = findOwnedTrip(user.getId(), tripId);
        ensureTripIsEditable(trip);

        List<TripReorderItemRequest> items = request != null ? request.getItems() : null;

        if (items == null || items.isEmpty()) {
          throw new IllegalArgumentException("Trip reorder items must not be empty");
        }

        for (int index = 0; index < items.size(); index++) {
            TripReorderItemRequest item = items.get(index);
            String kind = normalizeKind(item != null ? item.getKind() : null);
            Long relationId = item != null ? item.getRelationId() : null;

            if (relationId == null) {
                throw new IllegalArgumentException("Trip reorder relationId must not be null");
            }

            if ("location".equals(kind)) {
                TripLocation tripLocation = tripLocationRepository.findByIdAndTripId(relationId, tripId)
                        .orElseThrow(() -> new NotFoundException("Trip location not found"));
                tripLocation.setSortOrder(index);
                continue;
            }

            TripJourney tripJourney = tripJourneyRepository.findByIdAndTripId(relationId, tripId)
                    .orElseThrow(() -> new NotFoundException("Trip journey not found"));
            tripJourney.setSortOrder(index);
        }

        touchTrip(trip);
        return tripMapper.toResponse(findOwnedTrip(user.getId(), tripId));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Trip findOwnedTrip(UUID userId, Long tripId) {
        return tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new NotFoundException("Trip not found"));
    }

    private void ensureTripIsEditable(Trip trip) {
        if (trip.isArchived()) {
            throw new IllegalArgumentException("Archived trips cannot be edited");
        }
    }

    private int getNextTripSortOrder(Long tripId) {
        int nextLocationSortOrder = tripLocationRepository.findTopByTripIdOrderBySortOrderDesc(tripId)
                .map(existingTripLocation -> existingTripLocation.getSortOrder() + 1)
                .orElse(0);
        int nextJourneySortOrder = tripJourneyRepository.findTopByTripIdOrderBySortOrderDesc(tripId)
                .map(existingTripJourney -> existingTripJourney.getSortOrder() + 1)
                .orElse(0);

        return Math.max(nextLocationSortOrder, nextJourneySortOrder);
    }

    private void touchTrip(Trip trip) {
        trip.setUpdatedAt(Instant.now());
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("User email is required");
        }

        return email.trim().toLowerCase();
    }

    private String normalizeKind(String kind) {
        if (kind == null) {
            throw new IllegalArgumentException("Trip reorder kind must not be blank");
        }

        String normalizedKind = kind.trim().toLowerCase(Locale.ROOT);

        if (!"location".equals(normalizedKind) && !"journey".equals(normalizedKind)) {
            throw new IllegalArgumentException("Trip reorder kind must be location or journey");
        }

        return normalizedKind;
    }
}
