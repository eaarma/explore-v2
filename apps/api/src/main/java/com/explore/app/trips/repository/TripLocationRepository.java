package com.explore.app.trips.repository;

import com.explore.app.trips.model.TripLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TripLocationRepository extends JpaRepository<TripLocation, Long> {

    Optional<TripLocation> findByIdAndTripId(Long id, Long tripId);

    Optional<TripLocation> findByTripIdAndLocationId(Long tripId, Long locationId);

    void deleteByTripIdAndLocationId(Long tripId, Long locationId);

    Optional<TripLocation> findTopByTripIdOrderBySortOrderDesc(Long tripId);
}
