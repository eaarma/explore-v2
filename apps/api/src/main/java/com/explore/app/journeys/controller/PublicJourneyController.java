package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyService;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyResponse;
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
@RequestMapping("/api/public/journeys")
@RequiredArgsConstructor
public class PublicJourneyController {

    private static final int MAX_PAGE_SIZE = 100;

    private final JourneyService journeyService;

    @GetMapping
    public List<JourneyResponse> getAllJourneys(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return journeyService.getPublicJourneys(page, size);
    }

    @GetMapping("/{id}")
    public JourneyResponse getJourneyById(@PathVariable("id") Long id) {
        return journeyService.getPublicJourneyById(id);
    }

    @GetMapping("/active")
    public List<JourneyResponse> getActiveJourneys(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return journeyService.getActiveJourneys(page, size);
    }

    @GetMapping("/category/{category}")
    public List<JourneyResponse> getJourneysByCategory(
            @PathVariable("category") String category,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return journeyService.getPublicJourneysByCategory(category, page, size);
    }

    @GetMapping("/county/{county}")
    public List<JourneyResponse> getJourneysByCounty(
            @PathVariable("county") String county,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return journeyService.getPublicJourneysByCounty(county, page, size);
    }

    @GetMapping("/nearby")
    public List<JourneyResponse> getNearbyJourneys(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("radiusMeters") double radiusMeters,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "100") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return journeyService.getPublicNearbyJourneys(latitude, longitude, radiusMeters, page, size);
    }

    @GetMapping("/{journeyId}/detail")
    public JourneyDetailResponse getJourneyWithLocations(@PathVariable("journeyId") Long journeyId) {
        return journeyService.getPublicJourneyWithLocations(journeyId);
    }
}





