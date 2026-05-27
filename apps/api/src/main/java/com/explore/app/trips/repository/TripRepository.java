package com.explore.app.trips.repository;

import com.explore.app.trips.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findAllByUserId(UUID userId);

    List<Trip> findByUserIdAndIsArchivedFalseOrderByUpdatedAtDesc(UUID userId);

    Optional<Trip> findByIdAndUserId(Long id, UUID userId);
}
