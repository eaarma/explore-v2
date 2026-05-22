package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyLocationService;
import com.explore.app.journeys.dto.JourneyLocationOrderRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager/journeys/{journeyId}/locations")
@RequiredArgsConstructor
public class ManagerJourneyLocationController {

    private final JourneyLocationService journeyLocationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void addLocationToJourney(
            @PathVariable("journeyId") Long journeyId,
            @Valid @RequestBody JourneyLocationOrderRequest request) {
        journeyLocationService.addLocationToJourney(journeyId, request.getLocationId(), request.getSortOrder());
    }

    @DeleteMapping("/{locationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeLocationFromJourney(
            @PathVariable("journeyId") Long journeyId,
            @PathVariable("locationId") Long locationId) {
        journeyLocationService.removeLocationFromJourney(journeyId, locationId);
    }

    @PatchMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderJourneyLocations(
            @PathVariable("journeyId") Long journeyId,
            @RequestBody List<@Valid JourneyLocationOrderRequest> order) {
        journeyLocationService.reorderJourneyLocations(journeyId, order);
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replaceJourneyLocations(
            @PathVariable("journeyId") Long journeyId,
            @RequestBody List<@Valid JourneyLocationOrderRequest> locations) {
        journeyLocationService.replaceJourneyLocations(journeyId, locations);
    }
}





