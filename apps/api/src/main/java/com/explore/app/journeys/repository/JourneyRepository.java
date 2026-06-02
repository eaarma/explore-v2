package com.explore.app.journeys.repository;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JourneyRepository extends JpaRepository<Journey, Long> {

    List<Journey> findByStatus(JourneyStatus status);

    Optional<Journey> findByIdAndStatus(Long id, JourneyStatus status);

    List<Journey> findByCategoryIgnoreCase(String category);

    List<Journey> findByCategoryIgnoreCaseAndStatus(String category, JourneyStatus status);

    List<Journey> findByCountyIgnoreCase(String county);

    List<Journey> findByCountyIgnoreCaseAndStatus(String county, JourneyStatus status);
}





