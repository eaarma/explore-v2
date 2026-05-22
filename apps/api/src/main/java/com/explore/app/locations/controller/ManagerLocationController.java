package com.explore.app.locations.controller;

import com.explore.app.locations.service.LocationService;
import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/locations")
@RequiredArgsConstructor
public class ManagerLocationController {

    private final LocationService locationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LocationResponse createLocation(@Valid @RequestBody LocationCreateRequest request) {
        return locationService.createLocation(request);
    }

    @PatchMapping("/{id}")
    public LocationResponse updateLocation(
            @PathVariable("id") Long id,
            @Valid @RequestBody LocationUpdateRequest request) {
        return locationService.updateLocation(id, request);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocationStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") Integer status) {
        locationService.updateLocationStatus(id, status);
    }
}





