package com.explore.app.locations.service;

import com.explore.app.locations.mapper.LocationMapper;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationProgressResponse;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import com.explore.app.shared.CategoryNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {

    private static final String LOCATION_PROGRESS_NOT_IMPLEMENTED =
            "Location discovery is not implemented yet. Persistence tables are in place, but the service logic will be added in a later step.";

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;

    public List<LocationResponse> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public LocationResponse getLocationById(Long id) {
        return locationMapper.toResponse(findLocation(id));
    }

    public List<LocationResponse> getActiveLocations() {
        return locationRepository.findByStatus(LocationStatus.ACTIVE)
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public List<LocationResponse> getLocationsByCategory(String category) {
        return locationRepository.findByCategoryIgnoreCase(normalizeCategoryFilter(category))
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public List<LocationResponse> getLocationsByCounty(String county) {
        return locationRepository.findByCountyIgnoreCase(normalizeFilter(county, "county"))
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public List<LocationResponse> getNearbyLocations(double latitude, double longitude, double radiusMeters) {
        validateRadius(radiusMeters);

        return locationRepository.findAll()
                .stream()
                .filter(location -> location.getLatitude() != null && location.getLongitude() != null)
                .filter(location -> haversineMeters(
                        latitude,
                        longitude,
                        location.getLatitude(),
                        location.getLongitude()) <= radiusMeters)
                .map(locationMapper::toResponse)
                .toList();
    }

    @Transactional
    public LocationResponse createLocation(LocationCreateRequest request) {
        Location savedLocation = locationRepository.save(locationMapper.toEntity(request));
        return locationMapper.toResponse(savedLocation);
    }

    @Transactional
    public LocationResponse updateLocation(Long id, LocationUpdateRequest request) {
        Location location = findLocation(id);
        locationMapper.updateEntity(location, request);
        return locationMapper.toResponse(location);
    }

    @Transactional
    public void updateLocationStatus(Long id, Integer status) {
        Location location = findLocation(id);
        location.setStatus(locationMapper.toStatus(status));
    }

    public List<LocationResponse> getLocationsWithUserProgress(Long userId) {
        throw new UnsupportedOperationException(LOCATION_PROGRESS_NOT_IMPLEMENTED);
    }

    @Transactional
    public LocationProgressResponse discoverLocation(Long userId, Long locationId) {
        throw new UnsupportedOperationException(LOCATION_PROGRESS_NOT_IMPLEMENTED);
    }

    private Location findLocation(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));
    }

    private String normalizeFilter(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }

        return value.trim();
    }

    private String normalizeCategoryFilter(String value) {
        return CategoryNormalizer.normalizeOptionalCategory(normalizeFilter(value, "category"));
    }

    private void validateRadius(double radiusMeters) {
        if (radiusMeters < 0) {
            throw new IllegalArgumentException("Radius must be zero or greater");
        }
    }

    private double haversineMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
        double earthRadiusMeters = 6_371_000d;
        double latitudeDelta = Math.toRadians(latitude2 - latitude1);
        double longitudeDelta = Math.toRadians(longitude2 - longitude1);

        double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }
}





