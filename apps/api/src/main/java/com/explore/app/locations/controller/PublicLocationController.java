package com.explore.app.locations.controller;

import com.explore.app.locations.service.LocationService;
import com.explore.app.locations.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/locations")
@RequiredArgsConstructor
public class PublicLocationController {

    private final LocationService locationService;

    @GetMapping
    public List<LocationResponse> getAllLocations() {
        return locationService.getPublicLocations();
    }

    @GetMapping("/{id}")
    public LocationResponse getLocationById(@PathVariable("id") Long id) {
        return locationService.getPublicLocationById(id);
    }

    @GetMapping("/active")
    public List<LocationResponse> getActiveLocations() {
        return locationService.getActiveLocations();
    }

    @GetMapping("/category/{category}")
    public List<LocationResponse> getLocationsByCategory(@PathVariable("category") String category) {
        return locationService.getPublicLocationsByCategory(category);
    }

    @GetMapping("/county/{county}")
    public List<LocationResponse> getLocationsByCounty(@PathVariable("county") String county) {
        return locationService.getPublicLocationsByCounty(county);
    }

    @GetMapping("/nearby")
    public List<LocationResponse> getNearbyLocations(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("radiusMeters") double radiusMeters) {
        return locationService.getPublicNearbyLocations(latitude, longitude, radiusMeters);
    }
}





