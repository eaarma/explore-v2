package com.explore.app.trips.controller;

import com.explore.app.trips.dto.TripCreateRequest;
import com.explore.app.trips.dto.TripJourneyAddRequest;
import com.explore.app.trips.dto.TripLocationAddRequest;
import com.explore.app.trips.dto.TripReorderRequest;
import com.explore.app.trips.dto.TripResponse;
import com.explore.app.trips.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/trips")
@RequiredArgsConstructor
public class CurrentUserTripController {

    private final TripService tripService;

    @GetMapping
    public List<TripResponse> getCurrentUserTrips(Authentication authentication) {
        return tripService.getCurrentUserTrips(authentication.getName());
    }

    @PostMapping
    public TripResponse createTrip(
            Authentication authentication,
            @Valid @RequestBody TripCreateRequest request) {
        return tripService.createTrip(authentication.getName(), request);
    }

    @PostMapping("/{tripId}/locations")
    public TripResponse addLocationToTrip(
            Authentication authentication,
            @PathVariable Long tripId,
            @Valid @RequestBody TripLocationAddRequest request) {
        return tripService.addLocationToTrip(authentication.getName(), tripId, request.getLocationId());
    }

    @PostMapping("/{tripId}/journeys")
    public TripResponse addJourneyToTrip(
            Authentication authentication,
            @PathVariable Long tripId,
            @Valid @RequestBody TripJourneyAddRequest request) {
        return tripService.addJourneyToTrip(authentication.getName(), tripId, request.getJourneyId());
    }

    @DeleteMapping("/{tripId}/locations/{locationId}")
    public TripResponse removeLocationFromTrip(
            Authentication authentication,
            @PathVariable Long tripId,
            @PathVariable Long locationId) {
        return tripService.removeLocationFromTrip(authentication.getName(), tripId, locationId);
    }

    @DeleteMapping("/{tripId}/journeys/{journeyId}")
    public TripResponse removeJourneyFromTrip(
            Authentication authentication,
            @PathVariable Long tripId,
            @PathVariable Long journeyId) {
        return tripService.removeJourneyFromTrip(authentication.getName(), tripId, journeyId);
    }

    @PutMapping("/{tripId}/order")
    public TripResponse reorderTripItems(
            Authentication authentication,
            @PathVariable Long tripId,
            @Valid @RequestBody TripReorderRequest request) {
        return tripService.reorderTripItems(authentication.getName(), tripId, request);
    }
}
