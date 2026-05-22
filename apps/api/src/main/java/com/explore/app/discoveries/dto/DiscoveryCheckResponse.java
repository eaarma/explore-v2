package com.explore.app.discoveries.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscoveryCheckResponse {

    private Boolean accuracyValid;
    private Double maxAllowedAccuracyMeters;
    private Double discoveryRadiusMeters;
    private Integer discoveredLocationCount;
    private Integer completedJourneyCount;
    private List<DiscoveryLocationResult> discoveredLocations;
    private List<DiscoveryJourneyCompletionResult> completedJourneys;
    private Instant checkedAt;
}
