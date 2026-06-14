package com.explore.app.imports;

import java.time.Instant;
import java.util.List;

import com.explore.app.appconfig.model.AppConfiguration;
import com.explore.app.appconfig.repository.AppConfigurationRepository;
import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyLocation;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.shared.CategoryNormalizer;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class LegacyDataImporter implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(LegacyDataImporter.class);

    private final ObjectMapper objectMapper;
    private final AppConfigurationRepository appConfigurationRepository;
    private final LocationRepository locationRepository;
    private final JourneyRepository journeyRepository;
    private final JourneyLocationRepository journeyLocationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Value("classpath:imports/exported_data.json")
    private Resource legacyDataFile;

    @Value("${app.seed.legacy-enabled:false}")
    private boolean legacySeedEnabled;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        long locationCount = locationRepository.count();
        long journeyCount = journeyRepository.count();
        boolean hasLocations = locationCount > 0;
        boolean hasJourneys = journeyCount > 0;

        if (hasLocations != hasJourneys) {
            throw new IllegalStateException(
                    "Legacy starter import requires locations and journeys to be both empty or both populated. "
                            + "Found locations=%d, journeys=%d."
                            .formatted(locationCount, journeyCount));
        }

        AppConfiguration configuration = appConfigurationRepository.findGlobal()
                .orElseThrow(() -> new IllegalStateException(
                        "Global app configuration row is missing; cannot determine starter seed state."));

        if (!hasLocations && configuration.getStarterDataSeededAt() != null) {
            throw new IllegalStateException(
                    "Starter data is marked as already seeded at %s, but locations and journeys are empty. "
                            + "Refusing to reseed automatically."
                            .formatted(configuration.getStarterDataSeededAt()));
        }

        if (!legacySeedEnabled) {
            if (hasLocations) {
                LOGGER.info(
                        "Legacy starter data import is disabled; skipping startup seed because content already exists "
                                + "(locations={}, journeys={}).",
                        locationCount,
                        journeyCount);
            } else {
                LOGGER.info(
                        "Legacy starter data import is disabled; empty database will remain unseeded until "
                                + "app.seed.legacy-enabled is turned on.");
            }
            return;
        }

        if (hasLocations) {
            LOGGER.info(
                    "Legacy starter data import skipped because content already exists "
                            + "(locations={}, journeys={}, seededAt={}).",
                    locationCount,
                    journeyCount,
                    configuration.getStarterDataSeededAt());
            return;
        }

        LOGGER.info(
                "Legacy starter data import starting from {}.",
                legacyDataFile.getDescription());

        LegacyImportData data = objectMapper.readValue(
                legacyDataFile.getInputStream(),
                LegacyImportData.class);

        importLocations(data.locations());
        importJourneys(data.journeys());
        importJourneyLocations(data.journeys());
        syncIdentitySequence("locations");
        syncIdentitySequence("journeys");
        configuration.setStarterDataSeededAt(Instant.now());
        appConfigurationRepository.save(configuration);

        LOGGER.info(
                "Legacy starter data import completed successfully (locationsImported={}, journeysImported={}).",
                data.locations().size(),
                data.journeys().size());
    }

    private void importLocations(List<LegacyLocation> legacyLocations) {

        for (LegacyLocation legacy : legacyLocations) {

            Point point = geometryFactory.createPoint(
                    new Coordinate(
                            legacy.longitude(),
                            legacy.latitude()));

            point.setSRID(4326);

            entityManager.createNativeQuery("""
                    INSERT INTO locations(
                        id,
                        title,
                        description,
                        latitude,
                        longitude,
                        point,
                        county,
                        category,
                        experience,
                        difficulty,
                        notes,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES(
                        :id,
                        :title,
                        :description,
                        :latitude,
                        :longitude,
                        ST_GeogFromText(:point),
                        :county,
                        :category,
                        :experience,
                        :difficulty,
                        :notes,
                        :status,
                        NOW(),
                        NOW()
                    )
                    """)
                    .setParameter("id", legacy.id())
                    .setParameter("title", legacy.title())
                    .setParameter("description", legacy.description())
                    .setParameter("latitude", legacy.latitude())
                    .setParameter("longitude", legacy.longitude())
                    .setParameter(
                            "point",
                            String.format(
                                    "POINT(%f %f)",
                                    legacy.longitude(),
                                    legacy.latitude()))
                    .setParameter("county", legacy.county())
                    .setParameter("category", CategoryNormalizer.normalizeOptionalCategory(legacy.category()))
                    .setParameter("experience", legacy.experience())
                    .setParameter("difficulty", legacy.difficulty())
                    .setParameter(
                            "notes",
                            legacy.notes() != null ? String.valueOf(legacy.notes()) : null)
                    .setParameter(
                            "status",
                            toLocationStatus(
                                    legacy.status(),
                                    legacy.active()).name())
                    .executeUpdate();

            if (legacy.image() != null && !legacy.image().isBlank()) {
                entityManager.createNativeQuery("""
                        INSERT INTO location_images(
                            location_id,
                            image_url,
                            is_cover,
                            sort_order
                        )
                        VALUES(
                            :locationId,
                            :imageUrl,
                            TRUE,
                            0
                        )
                        """)
                        .setParameter("locationId", legacy.id())
                        .setParameter("imageUrl", legacy.image())
                        .executeUpdate();
            }
        }
    }

    private void importJourneys(List<LegacyJourney> legacyJourneys) {

        for (LegacyJourney legacy : legacyJourneys) {

            entityManager.createNativeQuery("""
                    INSERT INTO journeys(
                        id,
                        title,
                        description,
                        latitude,
                        longitude,
                        county,
                        category,
                        experience,
                        distance,
                        difficulty,
                        polyline,
                        notes,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES(
                        :id,
                        :title,
                        :description,
                        :latitude,
                        :longitude,
                        :county,
                        :category,
                        :experience,
                        :distance,
                        :difficulty,
                        :polyline,
                        :notes,
                        :status,
                        NOW(),
                        NOW()
                    )
                    """)
                    .setParameter("id", legacy.id())
                    .setParameter("title", legacy.title())
                    .setParameter("description", legacy.description())
                    .setParameter("latitude", legacy.latitude())
                    .setParameter("longitude", legacy.longitude())
                    .setParameter("county", legacy.county())
                    .setParameter("category", CategoryNormalizer.normalizeOptionalCategory(legacy.category()))
                    .setParameter("experience", legacy.experience())
                    .setParameter("distance", legacy.distance())
                    .setParameter("difficulty", legacy.difficulty())
                    .setParameter("polyline", legacy.polyline())
                    .setParameter(
                            "notes",
                            legacy.notes() != null ? String.valueOf(legacy.notes()) : null)
                    .setParameter(
                            "status",
                            toJourneyStatus(
                                    legacy.status(),
                                    legacy.active()).name())
                    .executeUpdate();
        }
    }

    private void importJourneyLocations(List<LegacyJourney> legacyJourneys) {
        for (LegacyJourney legacyJourney : legacyJourneys) {
            Journey journey = journeyRepository.findById(legacyJourney.id())
                    .orElseThrow();

            List<Integer> locationIds = List.of(
                    legacyJourney.location1(),
                    legacyJourney.location2(),
                    legacyJourney.location3(),
                    legacyJourney.location4(),
                    legacyJourney.location5(),
                    legacyJourney.location6(),
                    legacyJourney.location7(),
                    legacyJourney.location8());

            for (int i = 0; i < locationIds.size(); i++) {
                Integer locationId = locationIds.get(i);

                if (locationId == null || locationId <= 0) {
                    continue;
                }

                Location location = locationRepository.findById(locationId.longValue())
                        .orElse(null);

                if (location == null) {
                    continue;
                }

                JourneyLocation journeyLocation = JourneyLocation.builder()
                        .journey(journey)
                        .location(location)
                        .sortOrder(i + 1)
                        .build();

                journeyLocationRepository.save(journeyLocation);
            }
        }
    }

    private LocationStatus toLocationStatus(Integer oldStatus, Integer active) {

        if (oldStatus != null && oldStatus == 0) {
            return LocationStatus.INACTIVE;
        }

        return LocationStatus.ACTIVE;
    }

    private JourneyStatus toJourneyStatus(Integer oldStatus, Integer active) {

        if (oldStatus != null && oldStatus == 0) {
            return JourneyStatus.INACTIVE;
        }

        return JourneyStatus.ACTIVE;
    }

    private void syncIdentitySequence(String tableName) {
        // Legacy imports provide explicit IDs, so PostgreSQL will not advance the identity sequence for us.
        entityManager.createNativeQuery("""
                SELECT setval(
                    pg_get_serial_sequence('%s', 'id'),
                    COALESCE((SELECT MAX(id) FROM %s), 0) + 1,
                    false
                )
                """.formatted(tableName, tableName))
                .getSingleResult();
    }

}
