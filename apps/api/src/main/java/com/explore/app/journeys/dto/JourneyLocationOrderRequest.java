package com.explore.app.journeys.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyLocationOrderRequest {

    @NotNull
    private Long locationId;

    @NotNull
    private Integer sortOrder;
}


