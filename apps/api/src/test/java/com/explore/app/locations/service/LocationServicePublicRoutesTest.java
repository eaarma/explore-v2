package com.explore.app.locations.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.mapper.LocationMapper;
import com.explore.app.locations.model.Location;
import com.explore.app.locations.model.LocationStatus;
import com.explore.app.locations.repository.LocationRepository;
import com.explore.app.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class LocationServicePublicRoutesTest {

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
    void getPublicLocationsUsesActiveLocationsOnly() {
        Location activeLocation = Location.builder()
                .id(1L)
                .title("Active location")
                .latitude(59.0)
                .longitude(24.0)
                .status(LocationStatus.ACTIVE)
                .build();
        LocationResponse response = LocationResponse.builder()
                .id(1L)
                .title("Active location")
                .build();

        when(locationRepository.findByStatus(LocationStatus.ACTIVE)).thenReturn(List.of(activeLocation));
        when(locationMapper.toResponse(activeLocation)).thenReturn(response);

        List<LocationResponse> locations = locationService.getPublicLocations();

        assertEquals(List.of(response), locations);
        verify(locationRepository).findByStatus(LocationStatus.ACTIVE);
        verify(locationRepository, never()).findAll();
    }

    @Test
    void getPublicLocationByIdRejectsInactiveOrMissingLocations() {
        when(locationRepository.findByIdAndStatus(42L, LocationStatus.ACTIVE)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> locationService.getPublicLocationById(42L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(locationRepository).findByIdAndStatus(42L, LocationStatus.ACTIVE);
    }
}
