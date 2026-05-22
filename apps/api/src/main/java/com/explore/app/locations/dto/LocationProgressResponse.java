package com.explore.app.locations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationProgressResponse {

    private Long userId;
    private Long locationId;
    private Boolean discovered;
    private Instant discoveredAt;
}


