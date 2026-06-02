package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyLocationService;
import com.explore.app.journeys.dto.JourneyLocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/journeys/{journeyId}/locations")
@RequiredArgsConstructor
public class PublicJourneyLocationController {

    private final JourneyLocationService journeyLocationService;

    @GetMapping
    public List<JourneyLocationResponse> getLocationsForJourney(@PathVariable("journeyId") Long journeyId) {
        return journeyLocationService.getPublicLocationsForJourney(journeyId);
    }
}





