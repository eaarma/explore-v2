package com.explore.app.appconfig.controller;

import com.explore.app.appconfig.dto.AppConfigurationResponse;
import com.explore.app.appconfig.dto.AppConfigurationUpdateRequest;
import com.explore.app.appconfig.service.AppConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/admin/app-configuration")
@RequiredArgsConstructor
public class AdminAppConfigurationController {

    private final AppConfigurationService appConfigurationService;

    @GetMapping
    public AppConfigurationResponse getAppConfiguration() {
        return appConfigurationService.getAppConfiguration();
    }

    @PutMapping
    public AppConfigurationResponse updateAppConfiguration(
            Authentication authentication,
            @Valid @RequestBody AppConfigurationUpdateRequest request) {
        return appConfigurationService.updateAppConfiguration(authentication.getName(), request);
    }
}
