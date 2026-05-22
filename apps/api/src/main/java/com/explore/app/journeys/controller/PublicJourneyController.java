package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyService;
import com.explore.app.journeys.dto.JourneyDetailResponse;
import com.explore.app.journeys.dto.JourneyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/journeys")
@RequiredArgsConstructor
public class PublicJourneyController {

    private final JourneyService journeyService;

    @GetMapping
    public List<JourneyResponse> getAllJourneys() {
        return journeyService.getAllJourneys();
    }

    @GetMapping("/{id}")
    public JourneyResponse getJourneyById(@PathVariable("id") Long id) {
        return journeyService.getJourneyById(id);
    }

    @GetMapping("/active")
    public List<JourneyResponse> getActiveJourneys() {
        return journeyService.getActiveJourneys();
    }

    @GetMapping("/category/{category}")
    public List<JourneyResponse> getJourneysByCategory(@PathVariable("category") String category) {
        return journeyService.getJourneysByCategory(category);
    }

    @GetMapping("/county/{county}")
    public List<JourneyResponse> getJourneysByCounty(@PathVariable("county") String county) {
        return journeyService.getJourneysByCounty(county);
    }

    @GetMapping("/nearby")
    public List<JourneyResponse> getNearbyJourneys(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("radiusMeters") double radiusMeters) {
        return journeyService.getNearbyJourneys(latitude, longitude, radiusMeters);
    }

    @GetMapping("/{journeyId}/detail")
    public JourneyDetailResponse getJourneyWithLocations(@PathVariable("journeyId") Long journeyId) {
        return journeyService.getJourneyWithLocations(journeyId);
    }
}





