package com.explore.app.locations.service;

import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationImageRequest;
import com.explore.app.locations.dto.LocationImageUploadResponse;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import com.explore.app.locations.mapper.LocationMapper;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationImage;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.shared.BadRequestException;
import com.explore.app.shared.CategoryNormalizer;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocationService.class);

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;
    private final LocationImageStorageService locationImageStorageService;
    private final UserRepository userRepository;

    public List<LocationResponse> getPublicLocations() {
        return getActiveLocations();
    }

    public LocationResponse getPublicLocationById(Long id) {
        return locationMapper.toResponse(findActiveLocation(id));
    }

    public List<LocationResponse> getPublicLocationsByCategory(String category) {
        return locationRepository.findByCategoryIgnoreCaseAndStatus(
                        normalizeCategoryFilter(category),
                        LocationStatus.ACTIVE)
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public List<LocationResponse> getPublicLocationsByCounty(String county) {
        return locationRepository.findByCountyIgnoreCaseAndStatus(
                        normalizeFilter(county, "county"),
                        LocationStatus.ACTIVE)
                .stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public List<LocationResponse> getPublicNearbyLocations(double latitude, double longitude, double radiusMeters) {
        validateRadius(radiusMeters);

        return locationRepository.findByStatus(LocationStatus.ACTIVE)
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
    public LocationResponse createLocation(String currentUserEmail, LocationCreateRequest request) {
        Location location = locationMapper.toEntity(request);

        if (request.getImages() != null) {
            User actingUser = resolveRequiredAdminUser(currentUserEmail);
            applyRequestedImages(location, request.getImages(), actingUser);
        }

        Location savedLocation = locationRepository.save(location);
        return locationMapper.toResponse(savedLocation);
    }

    @Transactional
    public LocationResponse updateLocation(String currentUserEmail, Long id, LocationUpdateRequest request) {
        Location location = findLocation(id);
        locationMapper.updateEntity(location, request);

        if (request.getImages() != null) {
            User actingUser = resolveRequiredAdminUser(currentUserEmail);
            List<String> removedStoragePaths = applyRequestedImages(location, request.getImages(), actingUser);
            scheduleLocationImageDeletion(location.getId(), removedStoragePaths);
        }

        Location savedLocation = locationRepository.save(location);
        return locationMapper.toResponse(savedLocation);
    }

    @Transactional
    public LocationImageUploadResponse uploadLocationImage(
            String currentUserEmail,
            Long locationId,
            MultipartFile file) {
        resolveRequiredAdminUser(currentUserEmail);
        findLocation(locationId);

        LocationImageStorageService.UploadedLocationImage uploadedImage =
                locationImageStorageService.uploadLocationImage(locationId, file);

        return LocationImageUploadResponse.builder()
                .url(uploadedImage.url())
                .storagePath(uploadedImage.storagePath())
                .fileName(uploadedImage.fileName())
                .build();
    }

    @Transactional
    public void deletePendingLocationImage(String currentUserEmail, Long locationId, String storagePath) {
        resolveRequiredAdminUser(currentUserEmail);
        findLocation(locationId);
        locationImageStorageService.deleteLocationImage(locationId, storagePath);
    }

    @Transactional
    public void updateLocationStatus(Long id, Integer status) {
        Location location = findLocation(id);
        location.setStatus(locationMapper.toStatus(status));
    }

    private List<String> applyRequestedImages(
            Location location,
            List<LocationImageRequest> requestImages,
            User actingUser) {
        List<LocationImage> remainingExistingImages = new ArrayList<>(location.getImages());
        List<NormalizedLocationImage> normalizedImages = normalizeRequestedImages(requestImages);
        List<LocationImage> nextImages = new ArrayList<>();

        for (int index = 0; index < normalizedImages.size(); index++) {
            NormalizedLocationImage requestedImage = normalizedImages.get(index);
            LocationImage matchedImage = takeMatchingExistingImage(remainingExistingImages, requestedImage);
            String storagePath = resolveStoragePath(location, requestedImage, matchedImage);

            nextImages.add(LocationImage.builder()
                    .location(location)
                    .imageUrl(requestedImage.url())
                    .storagePath(storagePath)
                    .isCover(index == 0)
                    .sortOrder(index)
                    .uploadedBy(matchedImage != null && matchedImage.getUploadedBy() != null
                            ? matchedImage.getUploadedBy()
                            : actingUser)
                    .build());
        }

        List<String> removedStoragePaths = remainingExistingImages.stream()
                .map(LocationImage::getStoragePath)
                .map(this::normalizeOptional)
                .filter(storagePath -> storagePath != null)
                .toList();

        location.getImages().clear();
        location.getImages().addAll(nextImages);
        return removedStoragePaths;
    }

    private LocationImage takeMatchingExistingImage(
            List<LocationImage> remainingExistingImages,
            NormalizedLocationImage requestedImage) {
        if (requestedImage.storagePath() != null) {
            for (int index = 0; index < remainingExistingImages.size(); index++) {
                LocationImage candidate = remainingExistingImages.get(index);

                if (requestedImage.storagePath().equals(normalizeOptional(candidate.getStoragePath()))) {
                    return remainingExistingImages.remove(index);
                }
            }
        }

        for (int index = 0; index < remainingExistingImages.size(); index++) {
            LocationImage candidate = remainingExistingImages.get(index);

            if (requestedImage.url().equals(normalizeOptional(candidate.getImageUrl()))) {
                return remainingExistingImages.remove(index);
            }
        }

        return null;
    }

    private List<NormalizedLocationImage> normalizeRequestedImages(List<LocationImageRequest> requestImages) {
        if (requestImages == null || requestImages.isEmpty()) {
            return List.of();
        }

        List<NormalizedLocationImage> normalizedImages = new ArrayList<>();

        for (LocationImageRequest requestImage : requestImages) {
            if (requestImage == null) {
                continue;
            }

            String normalizedUrl = normalizeOptional(requestImage.getUrl());

            if (normalizedUrl == null) {
                continue;
            }

            normalizedImages.add(new NormalizedLocationImage(
                    normalizedUrl,
                    normalizeOptional(requestImage.getStoragePath())));
        }

        return normalizedImages;
    }

    private void scheduleLocationImageDeletion(Long locationId, List<String> storagePaths) {
        if (storagePaths == null || storagePaths.isEmpty()) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            locationImageStorageService.deleteLocationImages(locationId, storagePaths);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    locationImageStorageService.deleteLocationImages(locationId, storagePaths);
                } catch (RuntimeException exception) {
                    LOGGER.warn("Could not delete removed Firebase location images after location save", exception);
                }
            }
        });
    }

    private String resolveStoragePath(
            Location location,
            NormalizedLocationImage requestedImage,
            LocationImage matchedImage) {
        String requestedStoragePath = requestedImage.storagePath();

        if (matchedImage != null) {
            String matchedStoragePath = normalizeOptional(matchedImage.getStoragePath());

            if (requestedStoragePath != null && !requestedStoragePath.equals(matchedStoragePath)) {
                throw new BadRequestException("Image storagePath does not match the existing location image");
            }

            return matchedStoragePath;
        }

        if (requestedStoragePath == null) {
            return null;
        }

        if (location.getId() == null) {
            throw new BadRequestException("Image storagePath can only be used when updating an existing location");
        }

        return locationImageStorageService.validateLocationStoragePath(location.getId(), requestedStoragePath);
    }

    private User resolveRequiredAdminUser(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(normalizeRequiredEmail(currentUserEmail))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (currentUser.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admins can manage location images");
        }

        return currentUser;
    }

    private String normalizeRequiredEmail(String value) {
        String normalizedValue = normalizeOptional(value);

        if (normalizedValue == null) {
            throw new IllegalArgumentException("User email is required");
        }

        return normalizedValue.toLowerCase(Locale.ROOT);
    }

    private Location findLocation(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));
    }

    private Location findActiveLocation(Long id) {
        return locationRepository.findByIdAndStatus(id, LocationStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found"));
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

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
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

    private record NormalizedLocationImage(String url, String storagePath) {
    }
}
