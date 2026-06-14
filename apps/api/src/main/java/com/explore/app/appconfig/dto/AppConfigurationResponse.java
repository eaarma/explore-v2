package com.explore.app.appconfig.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfigurationResponse {

    private String appTitle;

    private String contactEmail;

    private String privacyPolicyVersion;

    private String termsVersion;

    private LegalDocumentDto privacyPolicyDocument;

    private LegalDocumentDto termsDocument;

    private UUID updatedByUserId;

    private Instant createdAt;

    private Instant updatedAt;
}
