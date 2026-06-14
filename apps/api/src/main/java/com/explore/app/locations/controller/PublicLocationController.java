package com.explore.app.locations.controller;

import com.explore.app.locations.service.LocationService;
import com.explore.app.locations.dto.LocationResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/public/locations")
@RequiredArgsConstructor
public class PublicLocationController {

    private static final int MAX_PAGE_SIZE = 100;

    private final LocationService locationService;

    @GetMapping
    public List<LocationResponse> getAllLocations(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return locationService.getPublicLocations(page, size);
    }

    @GetMapping("/{id}")
    public LocationResponse getLocationById(@PathVariable("id") Long id) {
        return locationService.getPublicLocationById(id);
    }

    @GetMapping("/active")
    public List<LocationResponse> getActiveLocations(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return locationService.getActiveLocations(page, size);
    }

    @GetMapping("/category/{category}")
    public List<LocationResponse> getLocationsByCategory(
            @PathVariable("category") String category,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return locationService.getPublicLocationsByCategory(category, page, size);
    }

    @GetMapping("/county/{county}")
    public List<LocationResponse> getLocationsByCounty(
            @PathVariable("county") String county,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return locationService.getPublicLocationsByCounty(county, page, size);
    }

    @GetMapping("/nearby")
    public List<LocationResponse> getNearbyLocations(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("radiusMeters") double radiusMeters,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return locationService.getPublicNearbyLocations(latitude, longitude, radiusMeters, page, size);
    }
}





