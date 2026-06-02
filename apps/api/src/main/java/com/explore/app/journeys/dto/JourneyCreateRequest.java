package com.explore.app.journeys.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyCreateRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    @Size(max = 255)
    private String county;

    @Size(max = 255)
    private String category;

    @PositiveOrZero
    private Integer experience;

    @PositiveOrZero
    private Double distance;

    @PositiveOrZero
    private Integer difficulty;

    @Size(max = 10000)
    private String polyline;

    private List<@Valid JourneyTraitRequest> traits;

    @Size(max = 5000)
    private String notes;

    @DecimalMin(value = "0")
    @DecimalMax(value = "1")
    private Integer status;
}


