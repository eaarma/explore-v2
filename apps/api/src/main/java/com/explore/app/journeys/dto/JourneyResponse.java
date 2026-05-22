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
public class JourneyResponse {

    private Long id;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private String county;
    private String category;
    private Integer experience;
    private Double distance;
    private Integer difficulty;
    private String polyline;
    private Integer notes;
    private Integer status;
    private Instant createdAt;
    private Instant updatedAt;
}


