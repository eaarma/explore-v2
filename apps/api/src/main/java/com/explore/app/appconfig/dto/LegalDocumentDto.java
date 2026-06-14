package com.explore.app.appconfig.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocumentDto {

    @NotBlank
    private String eyebrow;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotEmpty
    @Valid
    @Builder.Default
    private List<LegalDocumentSectionDto> sections = new ArrayList<>();
}
