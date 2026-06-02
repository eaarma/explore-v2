package com.explore.app.locations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationImageRequest {

    @NotBlank
    @Size(max = 1000)
    private String url;

    @Size(max = 1000)
    @Pattern(
            regexp = "^(?!.*\\.\\.)(?!.*\\\\).*$",
            message = "storagePath must not contain traversal or backslash characters")
    private String storagePath;
}
