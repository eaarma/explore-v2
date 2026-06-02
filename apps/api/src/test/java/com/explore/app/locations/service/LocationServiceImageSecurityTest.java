package com.explore.app.locations.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.explore.app.locations.dto.LocationImageRequest;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import com.explore.app.locations.mapper.LocationMapper;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationImage;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.shared.BadRequestException;
import com.explore.app.user.model.Role;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LocationServiceImageSecurityTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private LocationMapper locationMapper;

    @Mock
    private LocationImageStorageService locationImageStorageService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LocationService locationService;

    @Test
    void updateLocationRejectsNewImageStoragePathThatBelongsToAnotherLocation() {
        Location location = Location.builder()
                .id(5L)
                .title("Harbor")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        User adminUser = buildAdminUser();
        LocationUpdateRequest request = LocationUpdateRequest.builder()
                .images(List.of(LocationImageRequest.builder()
                        .url("https://example.com/harbor.jpg")
                        .storagePath("locations/99/foreign.jpg")
                        .build()))
                .build();

        when(locationRepository.findById(5L)).thenReturn(Optional.of(location));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(locationImageStorageService.validateLocationStoragePath(5L, "locations/99/foreign.jpg"))
                .thenThrow(new BadRequestException("Storage path does not belong to this location"));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationService.updateLocation("admin@example.com", 5L, request));

        assertEquals("Storage path does not belong to this location", exception.getMessage());
        verify(locationRepository, never()).save(location);
    }

    @Test
    void updateLocationRejectsClientOverrideOfExistingImageStoragePath() {
        Location location = Location.builder()
                .id(5L)
                .title("Harbor")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        location.getImages().add(LocationImage.builder()
                .location(location)
                .imageUrl("https://cdn.example.com/existing.jpg")
                .storagePath("locations/5/existing.jpg")
                .sortOrder(0)
                .build());
        User adminUser = buildAdminUser();
        LocationUpdateRequest request = LocationUpdateRequest.builder()
                .images(List.of(LocationImageRequest.builder()
                        .url("https://cdn.example.com/existing.jpg")
                        .storagePath("locations/5/overridden.jpg")
                        .build()))
                .build();

        when(locationRepository.findById(5L)).thenReturn(Optional.of(location));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationService.updateLocation("admin@example.com", 5L, request));

        assertEquals("Image storagePath does not match the existing location image", exception.getMessage());
        verify(locationRepository, never()).save(location);
        verify(locationImageStorageService, never()).validateLocationStoragePath(5L, "locations/5/overridden.jpg");
    }

    @Test
    void createLocationRejectsStoragePathBeforeTheLocationExists() {
        Location unsavedLocation = Location.builder()
                .title("New place")
                .latitude(59.1)
                .longitude(24.1)
                .status(LocationStatus.ACTIVE)
                .build();
        User adminUser = buildAdminUser();
        var request = com.explore.app.locations.dto.LocationCreateRequest.builder()
                .title("New place")
                .latitude(59.1)
                .longitude(24.1)
                .images(List.of(LocationImageRequest.builder()
                        .url("https://example.com/new-place.jpg")
                        .storagePath("locations/123/uploaded.jpg")
                        .build()))
                .build();

        when(locationMapper.toEntity(request)).thenReturn(unsavedLocation);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> locationService.createLocation("admin@example.com", request));

        assertEquals("Image storagePath can only be used when updating an existing location", exception.getMessage());
        verify(locationRepository, never()).save(unsavedLocation);
    }

    @Test
    void updateLocationBulkDeleteUsesLocationScopedStorageCleanup() {
        Location location = Location.builder()
                .id(5L)
                .title("Harbor")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        location.getImages().add(LocationImage.builder()
                .location(location)
                .imageUrl("https://cdn.example.com/keep.jpg")
                .storagePath("locations/5/keep.jpg")
                .sortOrder(0)
                .build());
        location.getImages().add(LocationImage.builder()
                .location(location)
                .imageUrl("https://cdn.example.com/remove.jpg")
                .storagePath("locations/5/remove.jpg")
                .sortOrder(1)
                .build());
        User adminUser = buildAdminUser();
        LocationUpdateRequest request = LocationUpdateRequest.builder()
                .images(List.of(LocationImageRequest.builder()
                        .url("https://cdn.example.com/keep.jpg")
                        .storagePath("locations/5/keep.jpg")
                        .build()))
                .build();
        LocationResponse response = LocationResponse.builder().id(5L).build();

        when(locationRepository.findById(5L)).thenReturn(Optional.of(location));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(locationRepository.save(location)).thenReturn(location);
        when(locationMapper.toResponse(location)).thenReturn(response);

        LocationResponse result = locationService.updateLocation("admin@example.com", 5L, request);

        assertEquals(response, result);
        verify(locationImageStorageService).deleteLocationImages(5L, List.of("locations/5/remove.jpg"));
        verify(locationRepository).save(location);
    }

    private User buildAdminUser() {
        return User.builder()
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();
    }
}
