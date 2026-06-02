package com.explore.app.locations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationImageUploadResponse {

    private String url;
    private String storagePath;
    private String fileName;
}
