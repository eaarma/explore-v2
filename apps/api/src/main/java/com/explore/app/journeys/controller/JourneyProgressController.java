package com.explore.app.journeys.controller;

import com.explore.app.journeys.service.JourneyService;
import com.explore.app.journeys.dto.JourneyProgressResponse;
import com.explore.app.journeys.dto.JourneyResponse;
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
@RequestMapping("/api/journeys/users/{userId}")
@RequiredArgsConstructor
public class JourneyProgressController {

    private final JourneyService journeyService;

    @GetMapping("/progress")
    public List<JourneyResponse> getJourneysWithUserProgress(@PathVariable("userId") Long userId) {
        return journeyService.getJourneysWithUserProgress(userId);
    }

    @PostMapping("/complete/{journeyId}")
    @ResponseStatus(HttpStatus.OK)
    public JourneyProgressResponse completeJourneyIfEligible(
            @PathVariable("userId") Long userId,
            @PathVariable("journeyId") Long journeyId) {
        return journeyService.completeJourneyIfEligible(userId, journeyId);
    }
}





