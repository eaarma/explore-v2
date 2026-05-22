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
public class LocationResponse {

    private Long id;
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
    private Instant createdAt;
    private Instant updatedAt;
}


