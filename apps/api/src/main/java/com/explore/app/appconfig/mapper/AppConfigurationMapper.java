package com.explore.app.appconfig.mapper;

import com.explore.app.appconfig.dto.AppConfigurationResponse;
import com.explore.app.appconfig.dto.AppConfigurationUpdateRequest;
import com.explore.app.appconfig.dto.LegalDocumentDto;
import com.explore.app.appconfig.model.AppConfiguration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AppConfigurationMapper {

    public static final String DEFAULT_APP_TITLE = "Explore";
    public static final String DEFAULT_CONTACT_EMAIL = "support@explore.app";
    public static final String DEFAULT_PRIVACY_POLICY_VERSION = "2026-05-31";
    public static final String DEFAULT_TERMS_VERSION = "2026-05-31";

    private final ObjectMapper objectMapper;

    public AppConfiguration createDefaultEntity() {
        return AppConfiguration.builder()
                .id(AppConfiguration.GLOBAL_ID)
                .appTitle(DEFAULT_APP_TITLE)
                .contactEmail(DEFAULT_CONTACT_EMAIL)
                .privacyPolicyVersion(DEFAULT_PRIVACY_POLICY_VERSION)
                .termsVersion(DEFAULT_TERMS_VERSION)
                .privacyPolicyDocument(null)
                .termsDocument(null)
                .build();
    }

    public void updateEntity(AppConfiguration configuration, AppConfigurationUpdateRequest request) {
        configuration.setAppTitle(normalizeRequired(request.getAppTitle(), "appTitle"));
        configuration.setContactEmail(normalizeRequired(request.getContactEmail(), "contactEmail").toLowerCase());
        configuration.setPrivacyPolicyVersion(
                normalizeRequired(request.getPrivacyPolicyVersion(), "privacyPolicyVersion"));
        configuration.setTermsVersion(normalizeRequired(request.getTermsVersion(), "termsVersion"));
        configuration.setPrivacyPolicyDocument(toJsonNode(request.getPrivacyPolicyDocument()));
        configuration.setTermsDocument(toJsonNode(request.getTermsDocument()));
    }

    public AppConfigurationResponse toResponse(AppConfiguration configuration) {
        return AppConfigurationResponse.builder()
                .appTitle(configuration.getAppTitle())
                .contactEmail(configuration.getContactEmail())
                .privacyPolicyVersion(configuration.getPrivacyPolicyVersion())
                .termsVersion(configuration.getTermsVersion())
                .privacyPolicyDocument(toLegalDocument(configuration.getPrivacyPolicyDocument()))
                .termsDocument(toLegalDocument(configuration.getTermsDocument()))
                .updatedByUserId(configuration.getUpdatedByUserId())
                .createdAt(configuration.getCreatedAt())
                .updatedAt(configuration.getUpdatedAt())
                .build();
    }

    private LegalDocumentDto toLegalDocument(JsonNode document) {
        if (document == null || document.isNull()) {
            return null;
        }

        try {
            return objectMapper.treeToValue(document, LegalDocumentDto.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not deserialize stored legal document.", exception);
        }
    }

    private JsonNode toJsonNode(LegalDocumentDto document) {
        return objectMapper.valueToTree(document);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        String trimmedValue = value.trim();

        if (trimmedValue.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        return trimmedValue;
    }
}
