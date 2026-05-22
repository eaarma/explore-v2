package com.explore.app.locations.repository;

import com.explore.app.locations.model.LocationDiscovery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LocationDiscoveryRepository extends JpaRepository<LocationDiscovery, Long> {

    Optional<LocationDiscovery> findByUserIdAndLocationId(UUID userId, Long locationId);

    boolean existsByUserIdAndLocationId(UUID userId, Long locationId);

    List<LocationDiscovery> findByUserId(UUID userId);

    List<LocationDiscovery> findByUserIdAndLocationIdIn(UUID userId, Collection<Long> locationIds);

    @Query("""
            select discovery
            from LocationDiscovery discovery
            join fetch discovery.location location
            where discovery.user.id = :userId
            order by discovery.discoveredAt asc, location.id asc
            """)
    List<LocationDiscovery> findAllForUserProgress(@Param("userId") UUID userId);
}
