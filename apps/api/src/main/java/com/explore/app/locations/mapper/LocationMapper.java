package com.explore.app.locations.mapper;

import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationImage;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import com.explore.app.shared.CategoryNormalizer;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class LocationMapper {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    public Location toEntity(LocationCreateRequest request) {
        String imageUrl = normalizeOptional(request.getImageUrl());

        Location location = Location.builder()
                .title(normalizeRequired(request.getTitle(), "title"))
                .description(normalizeOptional(request.getDescription()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .point(createPoint(request.getLatitude(), request.getLongitude()))
                .county(normalizeOptional(request.getCounty()))
                .category(CategoryNormalizer.normalizeOptionalCategory(request.getCategory()))
                .experience(request.getExperience())
                .difficulty(request.getDifficulty())
                .notes(request.getNotes())
                .status(toStatus(request.getStatus()))
                .build();

        replaceImages(location, imageUrl);
        return location;
    }

    public void updateEntity(Location location, LocationUpdateRequest request) {
        if (request.getTitle() != null) {
            location.setTitle(normalizeRequired(request.getTitle(), "title"));
        }

        if (request.getDescription() != null) {
            location.setDescription(normalizeOptional(request.getDescription()));
        }

        if (request.getLatitude() != null) {
            location.setLatitude(request.getLatitude());
        }

        if (request.getLongitude() != null) {
            location.setLongitude(request.getLongitude());
        }

        if (request.getCounty() != null) {
            location.setCounty(normalizeOptional(request.getCounty()));
        }

        if (request.getCategory() != null) {
            location.setCategory(CategoryNormalizer.normalizeOptionalCategory(request.getCategory()));
        }

        if (request.getImageUrl() != null) {
            replaceImages(location, normalizeOptional(request.getImageUrl()));
        }

        if (request.getExperience() != null) {
            location.setExperience(request.getExperience());
        }

        if (request.getDifficulty() != null) {
            location.setDifficulty(request.getDifficulty());
        }

        if (request.getNotes() != null) {
            location.setNotes(request.getNotes());
        }

        if (request.getStatus() != null) {
            location.setStatus(toStatus(request.getStatus()));
        }

        location.setPoint(createPoint(location.getLatitude(), location.getLongitude()));
    }

    public LocationResponse toResponse(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .title(location.getTitle())
                .description(location.getDescription())
                .latitude(resolveLatitude(location))
                .longitude(resolveLongitude(location))
                .county(location.getCounty())
                .category(CategoryNormalizer.normalizeOptionalCategory(location.getCategory()))
                .imageUrl(resolvePrimaryImageUrl(location))
                .experience(location.getExperience())
                .difficulty(location.getDifficulty())
                .notes(location.getNotes())
                .status(location.getStatus().getCode())
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt())
                .build();
    }

    public LocationStatus toStatus(Integer status) {
        return LocationStatus.fromCode(status);
    }

    public String resolvePrimaryImageUrl(Location location) {
        if (location == null || location.getImages() == null) {
            return null;
        }

        return location.getImages().stream()
                .map(LocationImage::getImageUrl)
                .map(this::normalizeOptional)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private Point createPoint(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }

        return GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
    }

    private Double resolveLatitude(Location location) {
        if (location == null) {
            return null;
        }

        if (location.getLatitude() != null) {
            return location.getLatitude();
        }

        Point point = location.getPoint();
        return point != null ? point.getY() : null;
    }

    private Double resolveLongitude(Location location) {
        if (location == null) {
            return null;
        }

        if (location.getLongitude() != null) {
            return location.getLongitude();
        }

        Point point = location.getPoint();
        return point != null ? point.getX() : null;
    }

    private void replaceImages(Location location, String imageUrl) {
        location.getImages().clear();

        if (imageUrl == null) {
            return;
        }

        location.getImages().add(LocationImage.builder()
                .location(location)
                .imageUrl(imageUrl)
                .sortOrder(0)
                .build());
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





