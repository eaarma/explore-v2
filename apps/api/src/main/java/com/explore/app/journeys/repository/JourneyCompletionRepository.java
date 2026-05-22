package com.explore.app.journeys.repository;

import com.explore.app.journeys.model.JourneyCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JourneyCompletionRepository extends JpaRepository<JourneyCompletion, Long> {

    Optional<JourneyCompletion> findByUserIdAndJourneyId(UUID userId, Long journeyId);

    boolean existsByUserIdAndJourneyId(UUID userId, Long journeyId);

    List<JourneyCompletion> findByUserId(UUID userId);

    List<JourneyCompletion> findByUserIdAndJourneyIdIn(UUID userId, Collection<Long> journeyIds);

    @Query("""
            select distinct completion
            from JourneyCompletion completion
            join fetch completion.journey journey
            left join fetch journey.locations locations
            where completion.user.id = :userId
            order by completion.completedAt asc, journey.id asc
            """)
    List<JourneyCompletion> findAllForUserProgress(@Param("userId") UUID userId);
}
