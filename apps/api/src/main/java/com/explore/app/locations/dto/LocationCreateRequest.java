package com.explore.app.locations.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class LocationCreateRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    @NotNull
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @NotNull
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    @Size(max = 255)
    private String county;

    @Size(max = 255)
    private String category;

    @Size(max = 1000)
    private String imageUrl;

    private List<@Size(max = 1000) String> imageUrls;
    private List<@Valid LocationImageRequest> images;
    private List<@Valid LocationTraitRequest> traits;

    @PositiveOrZero
    private Integer experience;

    @PositiveOrZero
    private Integer difficulty;

    @Size(max = 5000)
    private String notes;

    @DecimalMin(value = "0")
    @DecimalMax(value = "2")
    private Integer status;
}


