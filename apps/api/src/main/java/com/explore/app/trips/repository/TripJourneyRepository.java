package com.explore.app.trips.repository;

import com.explore.app.trips.model.TripJourney;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TripJourneyRepository extends JpaRepository<TripJourney, Long> {

    Optional<TripJourney> findByIdAndTripId(Long id, Long tripId);

    Optional<TripJourney> findByTripIdAndJourneyId(Long tripId, Long journeyId);

    void deleteByTripIdAndJourneyId(Long tripId, Long journeyId);

    Optional<TripJourney> findTopByTripIdOrderBySortOrderDesc(Long tripId);
}
