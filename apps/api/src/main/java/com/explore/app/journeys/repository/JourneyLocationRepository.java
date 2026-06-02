package com.explore.app.journeys.repository;

import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.locations.model.LocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JourneyLocationRepository extends JpaRepository<JourneyLocation, Long> {

    List<JourneyLocation> findByJourneyIdOrderBySortOrderAsc(Long journeyId);

    List<JourneyLocation> findByJourneyIdAndLocationStatusOrderBySortOrderAsc(Long journeyId, LocationStatus status);

    Optional<JourneyLocation> findByJourneyIdAndLocationId(Long journeyId, Long locationId);

    boolean existsByJourneyIdAndLocationId(Long journeyId, Long locationId);

    @Query("""
            select distinct journeyLocation.journey.id
            from JourneyLocation journeyLocation
            where journeyLocation.location.id in :locationIds
              and journeyLocation.journey.status = :status
            """)
    List<Long> findDistinctJourneyIdsByLocationIdInAndJourneyStatus(
            @Param("locationIds") Collection<Long> locationIds,
            @Param("status") JourneyStatus status);

    @Query("""
            select journeyLocation
            from JourneyLocation journeyLocation
            join fetch journeyLocation.journey journey
            join fetch journeyLocation.location location
            where journey.id in :journeyIds
            order by journey.id asc, journeyLocation.sortOrder asc
            """)
    List<JourneyLocation> findJourneyLocationsForCompletion(@Param("journeyIds") Collection<Long> journeyIds);
}





