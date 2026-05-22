package com.explore.app.discoveries.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscoveryJourneyCompletionResult {

    private Long journeyId;
    private String title;
    private Integer totalLocations;
    private Instant completedAt;
}
