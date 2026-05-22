package com.explore.app.discoveries.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class OfflineDiscoverySyncRequest {

    @NotNull
    @Size(max = 200)
    private List<@Valid OfflineDiscoveryCandidateRequest> discoveries;
}
