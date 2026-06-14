package com.explore.app.journeys.mapper;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyTrait;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.dto.JourneyCreateRequest;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.dto.JourneyTraitRequest;
import com.explore.app.journeys.dto.JourneyTraitResponse;
import com.explore.app.journeys.dto.JourneyUpdateRequest;
import com.explore.app.shared.CategoryNormalizer;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class JourneyMapper {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    public Journey toEntity(JourneyCreateRequest request) {
        Journey journey = Journey.builder()
                .title(normalizeRequired(request.getTitle(), "title"))
                .description(normalizeOptional(request.getDescription()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .point(createPoint(request.getLatitude(), request.getLongitude()))
                .county(normalizeOptional(request.getCounty()))
                .category(CategoryNormalizer.normalizeOptionalCategory(request.getCategory()))
                .experience(request.getExperience())
                .distance(request.getDistance())
                .difficulty(request.getDifficulty())
                .polyline(normalizeOptional(request.getPolyline()))
                .notes(normalizeOptional(request.getNotes()))
                .status(toStatus(request.getStatus()))
                .build();

        replaceTraits(journey, normalizeTraitNames(request.getTraits()));

        return journey;
    }

    public void updateEntity(Journey journey, JourneyUpdateRequest request) {
        if (request.getTitle() != null) {
            journey.setTitle(normalizeRequired(request.getTitle(), "title"));
        }

        if (request.getDescription() != null) {
            journey.setDescription(normalizeOptional(request.getDescription()));
        }

        if (request.getLatitude() != null) {
            journey.setLatitude(request.getLatitude());
        }

        if (request.getLongitude() != null) {
            journey.setLongitude(request.getLongitude());
        }

        if (request.getCounty() != null) {
            journey.setCounty(normalizeOptional(request.getCounty()));
        }

        if (request.getCategory() != null) {
            journey.setCategory(CategoryNormalizer.normalizeOptionalCategory(request.getCategory()));
        }

        if (request.getExperience() != null) {
            journey.setExperience(request.getExperience());
        }

        if (request.getDistance() != null) {
            journey.setDistance(request.getDistance());
        }

        if (request.getDifficulty() != null) {
            journey.setDifficulty(request.getDifficulty());
        }

        if (request.getPolyline() != null) {
            journey.setPolyline(normalizeOptional(request.getPolyline()));
        }

        if (request.getTraits() != null) {
            replaceTraits(journey, normalizeTraitNames(request.getTraits()));
        }

        if (request.getNotes() != null) {
            journey.setNotes(normalizeOptional(request.getNotes()));
        }

        if (request.getStatus() != null) {
            journey.setStatus(toStatus(request.getStatus()));
        }

        journey.setPoint(createPoint(journey.getLatitude(), journey.getLongitude()));
    }

    public JourneyResponse toResponse(Journey journey) {
        return JourneyResponse.builder()
                .id(journey.getId())
                .title(journey.getTitle())
                .description(journey.getDescription())
                .latitude(resolveLatitude(journey))
                .longitude(resolveLongitude(journey))
                .county(journey.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(journey.getCategory()))
                .experience(journey.getExperience())
                .distance(journey.getDistance())
                .difficulty(journey.getDifficulty())
                .polyline(journey.getPolyline())
                .traits(resolveTraits(journey))
                .notes(journey.getNotes())
                .status(journey.getStatus().getCode())
                .createdAt(journey.getCreatedAt())
                .updatedAt(journey.getUpdatedAt())
                .build();
    }

    public JourneyDetailResponse toDetailResponse(Journey journey, List<JourneyLocationResponse> locations) {
        return JourneyDetailResponse.builder()
                .id(journey.getId())
                .title(journey.getTitle())
                .description(journey.getDescription())
                .latitude(resolveLatitude(journey))
                .longitude(resolveLongitude(journey))
                .county(journey.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(journey.getCategory()))
                .experience(journey.getExperience())
                .distance(journey.getDistance())
                .difficulty(journey.getDifficulty())
                .polyline(journey.getPolyline())
                .traits(resolveTraits(journey))
                .notes(journey.getNotes())
                .status(journey.getStatus().getCode())
                .createdAt(journey.getCreatedAt())
                .updatedAt(journey.getUpdatedAt())
                .locations(locations)
                .build();
    }

    public JourneyStatus toStatus(Integer status) {
        return JourneyStatus.fromCode(status);
    }

    private Point createPoint(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }

        return GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
    }

    private Double resolveLatitude(Journey journey) {
        if (journey == null) {
            return null;
        }

        if (journey.getLatitude() != null) {
            return journey.getLatitude();
        }

        Point point = journey.getPoint();
        return point != null ? point.getY() : null;
    }

    private Double resolveLongitude(Journey journey) {
        if (journey == null) {
            return null;
        }

        if (journey.getLongitude() != null) {
            return journey.getLongitude();
        }

        Point point = journey.getPoint();
        return point != null ? point.getX() : null;
    }

    private List<JourneyTraitResponse> resolveTraits(Journey journey) {
        if (journey == null || journey.getTraits() == null) {
            return List.of();
        }

        return journey.getTraits().stream()
                .map(journeyTrait -> JourneyTraitResponse.builder()
                        .id(journeyTrait.getId())
                        .name(journeyTrait.getName())
                        .sortOrder(journeyTrait.getSortOrder())
                        .build())
                .toList();
    }

    private void replaceTraits(Journey journey, List<String> traitNames) {
        journey.getTraits().clear();

        if (traitNames == null || traitNames.isEmpty()) {
            return;
        }

        for (int index = 0; index < traitNames.size(); index++) {
            journey.getTraits().add(JourneyTrait.builder()
                    .journey(journey)
                    .name(traitNames.get(index))
                    .sortOrder(index)
                    .build());
        }
    }

    private List<String> normalizeTraitNames(List<JourneyTraitRequest> requestTraits) {
        if (requestTraits == null) {
            return List.of();
        }

        List<String> normalizedTraitNames = new ArrayList<>();
        Set<String> seenTraitNames = new LinkedHashSet<>();

        for (JourneyTraitRequest requestTrait : requestTraits) {
            if (requestTrait == null) {
                continue;
            }

            String normalizedName = normalizeOptional(requestTrait.getName());

            if (normalizedName == null) {
                continue;
            }

            String dedupeKey = normalizedName.toLowerCase(Locale.ROOT);

            if (!seenTraitNames.add(dedupeKey)) {
                continue;
            }

            normalizedTraitNames.add(normalizedName);
        }

        return normalizedTraitNames;
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }

        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}





