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
public class DiscoveryLocationResult {

    private Long locationId;
    private String title;
    private Double distanceMeters;
    private Instant discoveredAt;
}
