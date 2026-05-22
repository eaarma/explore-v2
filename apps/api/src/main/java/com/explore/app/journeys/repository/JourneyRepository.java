package com.explore.app.journeys.repository;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JourneyRepository extends JpaRepository<Journey, Long> {

    List<Journey> findByStatus(JourneyStatus status);

    List<Journey> findByCategoryIgnoreCase(String category);

    List<Journey> findByCountyIgnoreCase(String county);
}





