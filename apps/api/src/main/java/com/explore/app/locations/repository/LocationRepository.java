package com.explore.app.locations.repository;

import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {

    interface DiscoveryCandidateProjection {

        Long getLocationId();

        Double getDistanceMeters();
    }

    Page<Location> findByStatusOrderByCreatedAtDescIdDesc(LocationStatus status, Pageable pageable);

    Optional<Location> findByIdAndStatus(Long id, LocationStatus status);

    Page<Location> findByCategoryIgnoreCaseOrderByCreatedAtDescIdDesc(String category, Pageable pageable);

    Page<Location> findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
            String category,
            LocationStatus status,
            Pageable pageable);

    Page<Location> findByCountyIgnoreCaseOrderByCreatedAtDescIdDesc(String county, Pageable pageable);

    Page<Location> findByCountyIgnoreCaseAndStatusOrderByCreatedAtDescIdDesc(
            String county,
            LocationStatus status,
            Pageable pageable);

    @Query(value = """
            SELECT
                l.id AS locationId,
                CAST(
                    ST_Distance(
                        l.point,
                        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                    ) AS DOUBLE PRECISION
                ) AS distanceMeters
            FROM locations l
            WHERE l.status = :status
              AND l.point IS NOT NULL
              AND ST_DWithin(
                    l.point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radiusMeters
              )
            ORDER BY distanceMeters ASC, l.id ASC
            """, nativeQuery = true)
    List<DiscoveryCandidateProjection> findDiscoveryCandidates(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters,
            @Param("status") String status);

    @Query(value = """
            SELECT l.*
            FROM locations l
            WHERE l.status = :status
              AND l.point IS NOT NULL
              AND ST_DWithin(
                    l.point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radiusMeters
              )
            ORDER BY ST_Distance(
                    l.point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                ) ASC,
                l.id ASC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM locations l
                    WHERE l.status = :status
                      AND l.point IS NOT NULL
                      AND ST_DWithin(
                            l.point,
                            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                            :radiusMeters
                      )
                    """,
            nativeQuery = true)
    Page<Location> findNearbyByStatus(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters,
            @Param("status") String status,
            Pageable pageable);
}





