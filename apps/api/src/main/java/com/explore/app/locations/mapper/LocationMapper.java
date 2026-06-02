package com.explore.app.locations.mapper;

import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationImageRequest;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationTraitRequest;
import com.explore.app.locations.dto.LocationTraitResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationImage;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.model.LocationTrait;
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
import java.util.Objects;
import java.util.Set;

@Component
public class LocationMapper {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    public Location toEntity(LocationCreateRequest request) {
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
                .notes(normalizeOptional(request.getNotes()))
                .status(toStatus(request.getStatus()))
                .build();

        replaceTraits(location, normalizeTraitNames(request.getTraits()));

        if (request.getImages() != null) {
            replaceImages(location, resolveImageUrls(request.getImages()));
        } else {
            replaceImages(location, resolveImageUrls(request.getImageUrls(), request.getImageUrl()));
        }

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

        if (request.getImages() == null) {
            if (request.getImageUrls() != null) {
                replaceImages(location, normalizeImageUrls(request.getImageUrls()));
            } else if (request.getImageUrl() != null) {
                replaceImages(location, resolveImageUrls(null, request.getImageUrl()));
            }
        }

        if (request.getTraits() != null) {
            replaceTraits(location, normalizeTraitNames(request.getTraits()));
        }

        if (request.getExperience() != null) {
            location.setExperience(request.getExperience());
        }

        if (request.getDifficulty() != null) {
            location.setDifficulty(request.getDifficulty());
        }

        if (request.getNotes() != null) {
            location.setNotes(normalizeOptional(request.getNotes()));
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
                .imageUrls(resolveImageUrls(location))
                .traits(resolveTraits(location))
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
        List<String> imageUrls = resolveImageUrls(location);

        if (imageUrls.isEmpty()) {
            return null;
        }

        return imageUrls.get(0);
    }

    public List<String> resolveImageUrls(Location location) {
        if (location == null || location.getImages() == null) {
            return List.of();
        }

        return location.getImages().stream()
                .map(LocationImage::getImageUrl)
                .map(this::normalizeOptional)
                .filter(Objects::nonNull)
                .toList();
    }

    private List<LocationTraitResponse> resolveTraits(Location location) {
        if (location == null || location.getTraits() == null) {
            return List.of();
        }

        return location.getTraits().stream()
                .map(locationTrait -> LocationTraitResponse.builder()
                        .id(locationTrait.getId())
                        .name(locationTrait.getName())
                        .sortOrder(locationTrait.getSortOrder())
                        .build())
                .toList();
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

    private void replaceTraits(Location location, List<String> traitNames) {
        location.getTraits().clear();

        if (traitNames == null || traitNames.isEmpty()) {
            return;
        }

        for (int index = 0; index < traitNames.size(); index++) {
            location.getTraits().add(LocationTrait.builder()
                    .location(location)
                    .name(traitNames.get(index))
                    .sortOrder(index)
                    .build());
        }
    }

    private void replaceImages(Location location, List<String> imageUrls) {
        location.getImages().clear();

        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        for (int index = 0; index < imageUrls.size(); index++) {
            location.getImages().add(LocationImage.builder()
                    .location(location)
                    .imageUrl(imageUrls.get(index))
                    .sortOrder(index)
                    .build());
        }
    }

    private List<String> resolveImageUrls(List<String> imageUrls, String imageUrl) {
        if (imageUrls != null) {
            return normalizeImageUrls(imageUrls);
        }

        String normalizedImageUrl = normalizeOptional(imageUrl);
        if (normalizedImageUrl == null) {
            return List.of();
        }

        return List.of(normalizedImageUrl);
    }

    private List<String> resolveImageUrls(List<LocationImageRequest> images) {
        if (images == null) {
            return List.of();
        }

        return images.stream()
                .map(LocationImageRequest::getUrl)
                .map(this::normalizeOptional)
                .filter(Objects::nonNull)
                .toList();
    }

    private List<String> normalizeImageUrls(List<String> imageUrls) {
        if (imageUrls == null) {
            return List.of();
        }

        List<String> normalizedImageUrls = new ArrayList<>();

        for (String imageUrl : imageUrls) {
            String normalizedImageUrl = normalizeOptional(imageUrl);

            if (normalizedImageUrl != null) {
                normalizedImageUrls.add(normalizedImageUrl);
            }
        }

        return normalizedImageUrls;
    }

    private List<String> normalizeTraitNames(List<LocationTraitRequest> requestTraits) {
        if (requestTraits == null) {
            return List.of();
        }

        List<String> normalizedTraitNames = new ArrayList<>();
        Set<String> seenTraitNames = new LinkedHashSet<>();

        for (LocationTraitRequest requestTrait : requestTraits) {
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





