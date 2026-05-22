package com.explore.app.user.controller;

import com.explore.app.discoveries.dto.DiscoveryJourneyCompletionResult;
import com.explore.app.discoveries.dto.DiscoveryLocationResult;
import com.explore.app.discoveries.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class CurrentUserProgressController {

    private final DiscoveryService discoveryService;

    @GetMapping("/discoveries")
    public List<DiscoveryLocationResult> getCurrentUserDiscoveries(Authentication authentication) {
        return discoveryService.getUserDiscoveries(authentication.getName());
    }

    @GetMapping("/journey-completions")
    public List<DiscoveryJourneyCompletionResult> getCurrentUserJourneyCompletions(
            Authentication authentication) {
        return discoveryService.getUserJourneyCompletions(authentication.getName());
    }
}
