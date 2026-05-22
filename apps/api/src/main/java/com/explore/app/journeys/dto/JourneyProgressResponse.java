package com.explore.app.journeys.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyProgressResponse {

    private Long userId;
    private Long journeyId;
    private Boolean eligible;
    private Boolean completed;
    private Integer discoveredLocations;
    private Integer totalLocations;
    private Instant completedAt;
}


