package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyService;
import com.explore.app.journeys.dto.JourneyCreateRequest;
import com.explore.app.journeys.dto.JourneyResponse;
import com.explore.app.journeys.dto.JourneyUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/manager/journeys")
@RequiredArgsConstructor
public class ManagerJourneyController {

    private final JourneyService journeyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JourneyResponse createJourney(@Valid @RequestBody JourneyCreateRequest request) {
        return journeyService.createJourney(request);
    }

    @PatchMapping("/{id}")
    public JourneyResponse updateJourney(
            @PathVariable("id") Long id,
            @Valid @RequestBody JourneyUpdateRequest request) {
        return journeyService.updateJourney(id, request);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateJourneyStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") @Min(0) @Max(1) Integer status) {
        journeyService.updateJourneyStatus(id, status);
    }
}





