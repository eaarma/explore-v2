package com.explore.app.trips.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripReorderItemRequest {

    @NotBlank
    @Pattern(regexp = "(?i)location|journey", message = "kind must be location or journey")
    private String kind;

    @NotNull
    @Positive
    private Long relationId;
}
