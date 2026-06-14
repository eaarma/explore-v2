package com.explore.app.appconfig.service;

import com.explore.app.appconfig.dto.AppConfigurationResponse;
import com.explore.app.appconfig.dto.AppConfigurationUpdateRequest;
import com.explore.app.appconfig.mapper.AppConfigurationMapper;
import com.explore.app.appconfig.model.AppConfiguration;
import com.explore.app.appconfig.repository.AppConfigurationRepository;
import com.explore.app.shared.NotFoundException;
import com.explore.app.user.model.User;
import com.explore.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AppConfigurationService {

    private final AppConfigurationRepository appConfigurationRepository;
    private final AppConfigurationMapper appConfigurationMapper;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AppConfigurationResponse getAppConfiguration() {
        AppConfiguration configuration = appConfigurationRepository.findGlobal()
                .orElseGet(appConfigurationMapper::createDefaultEntity);

        return appConfigurationMapper.toResponse(configuration);
    }

    public AppConfigurationResponse updateAppConfiguration(
            String updatedByEmail,
            AppConfigurationUpdateRequest request) {
        AppConfiguration configuration = appConfigurationRepository.findGlobal()
                .orElseGet(appConfigurationMapper::createDefaultEntity);
        User user = findUserByEmail(updatedByEmail);

        appConfigurationMapper.updateEntity(configuration, request);
        configuration.setUpdatedByUserId(user.getId());

        AppConfiguration savedConfiguration = appConfigurationRepository.save(configuration);
        return appConfigurationMapper.toResponse(savedConfiguration);
    }

    private User findUserByEmail(String email) {
        String normalizedEmail = normalizeRequiredEmail(email);

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String normalizeRequiredEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("User email is required");
        }

        return email.trim().toLowerCase();
    }
}
