package com.explore.app.discoveries.controller;

import com.explore.app.discoveries.dto.DiscoveryCheckRequest;
import com.explore.app.discoveries.dto.DiscoveryCheckResponse;
import com.explore.app.discoveries.dto.OfflineDiscoverySyncRequest;
import com.explore.app.discoveries.service.DiscoveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discoveries")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    @PostMapping("/check")
    @ResponseStatus(HttpStatus.OK)
    public DiscoveryCheckResponse checkDiscoveries(
            @Valid @RequestBody DiscoveryCheckRequest request,
            Authentication authentication) {
        return discoveryService.check(authentication.getName(), request);
    }

    @PostMapping("/sync-offline")
    @ResponseStatus(HttpStatus.OK)
    public DiscoveryCheckResponse syncOfflineDiscoveries(
            @Valid @RequestBody OfflineDiscoverySyncRequest request,
            Authentication authentication) {
        return discoveryService.syncOffline(authentication.getName(), request);
    }
}
