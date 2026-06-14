package com.explore.app.appconfig.dto;

import jakarta.validation.constraints.NotBlank;
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
public class LegalDocumentSectionDto {

    @NotBlank
    private String title;

    private String body;

    @Builder.Default
    private List<@NotBlank String> items = new ArrayList<>();
}
