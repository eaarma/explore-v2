package com.explore.app.locations.controller;

import com.explore.app.locations.service.LocationService;
import com.explore.app.locations.dto.LocationCreateRequest;
import com.explore.app.locations.dto.LocationResponse;
import com.explore.app.locations.dto.LocationUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/manager/locations")
@RequiredArgsConstructor
public class ManagerLocationController {

    private final LocationService locationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LocationResponse createLocation(
            Authentication authentication,
            @Valid @RequestBody LocationCreateRequest request) {
        return locationService.createLocation(authentication.getName(), request);
    }

    @PatchMapping("/{id}")
    public LocationResponse updateLocation(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody LocationUpdateRequest request) {
        return locationService.updateLocation(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocationStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") @Min(0) @Max(2) Integer status) {
        locationService.updateLocationStatus(id, status);
    }
}





