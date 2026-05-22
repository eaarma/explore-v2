package com.explore.app.journeys.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyLocationResponse {

    private Long id;
    private Long journeyId;
    private Long locationId;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private String county;
    private String category;
    private String imageUrl;
    private Integer experience;
    private Integer difficulty;
    private Integer notes;
    private Integer status;
    private Integer sortOrder;
}


