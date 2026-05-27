package com.explore.app.trips.mapper;

import com.explore.app.trips.dto.TripCreateRequest;
import com.explore.app.trips.dto.TripResponse;
import com.explore.app.trips.model.Trip;
import com.explore.app.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class TripMapper {

    public Trip toEntity(User user, TripCreateRequest request) {
        return Trip.builder()
                .user(user)
                .name(normalizeRequired(request.getName(), "name"))
                .description(normalizeOptional(request.getDescription()))
                .isArchived(false)
                .build();
    }

    public TripResponse toResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .name(trip.getName())
                .description(trip.getDescription())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .isArchived(trip.isArchived())
                .locationCount(trip.getLocations() != null ? trip.getLocations().size() : 0)
                .journeyCount(trip.getJourneys() != null ? trip.getJourneys().size() : 0)
                .build();
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
