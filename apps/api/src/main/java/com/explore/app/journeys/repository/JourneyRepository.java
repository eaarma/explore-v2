package com.explore.app.journeys.repository;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JourneyRepository extends JpaRepository<Journey, Long> {

    Page<Journey> findByStatusOrderByCreatedAtDescIdDesc(JourneyStatus status, Pageable pageable);

    Optional<Journey> findByIdAndStatus(Long id, JourneyStatus status);

    Page<Journey> findByCategoryIgnoreCaseOrderByCreatedAtDescIdDesc(String category, Pageable pageable);

    Page<Journey> findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
            String category,
            JourneyStatus status,
            Pageable pageable);

    Page<Journey> findByCountyIgnoreCaseOrderByCreatedAtDescIdDesc(String county, Pageable pageable);

    Page<Journey> findByCountyIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
            String county,
            JourneyStatus status,
            Pageable pageable);

    @Query(value = """
            SELECT j.*
            FROM journeys j
            WHERE j.status = :status
              AND j.point IS NOT NULL
              AND ST_DWithin(
                    j.point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radiusMeters
              )
            ORDER BY ST_Distance(
                    j.point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                ) ASC,
                j.id ASC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM journeys j
                    WHERE j.status = :status
                      AND j.point IS NOT NULL
                      AND ST_DWithin(
                            j.point,
                            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                            :radiusMeters
                      )
                    """,
            nativeQuery = true)
    Page<Journey> findNearbyByStatus(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters,
            @Param("status") String status,
            Pageable pageable);
}





