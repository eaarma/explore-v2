package com.explore.app.locations.controller;

import com.explore.app.locations.service.LocationService;
import com.explore.app.locations.dto.LocationProgressResponse;
import com.explore.app.locations.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations/users/{userId}")
@RequiredArgsConstructor
public class LocationProgressController {

    private final LocationService locationService;

    @GetMapping("/progress")
    public List<LocationResponse> getLocationsWithUserProgress(@PathVariable("userId") Long userId) {
        return locationService.getLocationsWithUserProgress(userId);
    }

    @PostMapping("/discover/{locationId}")
    @ResponseStatus(HttpStatus.OK)
    public LocationProgressResponse discoverLocation(
            @PathVariable("userId") Long userId,
            @PathVariable("locationId") Long locationId) {
        return locationService.discoverLocation(userId, locationId);
    }
}





