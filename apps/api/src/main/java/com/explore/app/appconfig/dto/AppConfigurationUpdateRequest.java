package com.explore.app.appconfig.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfigurationUpdateRequest {

    @NotBlank
    private String appTitle;

    @Email
    @NotBlank
    private String contactEmail;

    @NotBlank
    private String privacyPolicyVersion;

    @NotBlank
    private String termsVersion;

    @NotNull
    @Valid
    private LegalDocumentDto privacyPolicyDocument;

    @NotNull
    @Valid
    private LegalDocumentDto termsDocument;
}
