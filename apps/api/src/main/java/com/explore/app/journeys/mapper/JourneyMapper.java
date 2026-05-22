package com.explore.app.journeys.mapper;

import com.explore.app.journeys.model.Journey;
import com.explore.app.journeys.model.JourneyStatus;
import com.explore.app.journeys.dto.JourneyCreateRequest;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.dto.JourneyUpdateRequest;
import com.explore.app.shared.CategoryNormalizer;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JourneyMapper {

    public Journey toEntity(JourneyCreateRequest request) {
        return Journey.builder()
                .title(normalizeRequired(request.getTitle(), "title"))
                .description(normalizeOptional(request.getDescription()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .county(normalizeOptional(request.getCounty()))
                .category(CategoryNormalizer.normalizeOptionalCategory(request.getCategory()))
                .experience(request.getExperience())
                .distance(request.getDistance())
                .difficulty(request.getDifficulty())
                .polyline(normalizeOptional(request.getPolyline()))
                .notes(request.getNotes())
                .status(toStatus(request.getStatus()))
                .build();
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

        if (request.getNotes() != null) {
            journey.setNotes(request.getNotes());
        }

        if (request.getStatus() != null) {
            journey.setStatus(toStatus(request.getStatus()));
        }
    }

    public JourneyResponse toResponse(Journey journey) {
        return JourneyResponse.builder()
                .id(journey.getId())
                .title(journey.getTitle())
                .description(journey.getDescription())
                .latitude(journey.getLatitude())
                .longitude(journey.getLongitude())
                .county(journey.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(journey.getCategory()))
                .experience(journey.getExperience())
                .distance(journey.getDistance())
                .difficulty(journey.getDifficulty())
                .polyline(journey.getPolyline())
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
                .latitude(journey.getLatitude())
                .longitude(journey.getLongitude())
                .county(journey.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(journey.getCategory()))
                .experience(journey.getExperience())
                .distance(journey.getDistance())
                .difficulty(journey.getDifficulty())
                .polyline(journey.getPolyline())
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





