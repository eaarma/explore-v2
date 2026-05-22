package com.explore.app.journeys.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyUpdateRequest {

    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    private Double latitude;
    private Double longitude;

    @Size(max = 255)
    private String county;

    @Size(max = 255)
    private String category;

    private Integer experience;
    private Double distance;
    private Integer difficulty;

    @Size(max = 10000)
    private String polyline;

    private Integer notes;
    private Integer status;
}


