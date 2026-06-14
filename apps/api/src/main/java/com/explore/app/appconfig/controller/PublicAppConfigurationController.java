package com.explore.app.appconfig.controller;

import com.explore.app.appconfig.dto.AppConfigurationResponse;
import com.explore.app.appconfig.service.AppConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/app-configuration")
@RequiredArgsConstructor
public class PublicAppConfigurationController {

    private final AppConfigurationService appConfigurationService;

    @GetMapping
    public AppConfigurationResponse getAppConfiguration() {
        return appConfigurationService.getAppConfiguration();
    }
}
