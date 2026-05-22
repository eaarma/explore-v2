package com.explore.app.locations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Double latitude;

    @NotNull
    private Double longitude;

    @Size(max = 255)
    private String county;

    @Size(max = 255)
    private String category;

    @Size(max = 1000)
    private String imageUrl;

    private Integer experience;
    private Integer difficulty;
    private Integer notes;
    private Integer status;
}


