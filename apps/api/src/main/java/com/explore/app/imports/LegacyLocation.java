package com.explore.app.imports;

public record LegacyLocation(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        Integer status,
        String county,
        String category,
        String image,
        Integer experience,
        Integer difficulty,
        Integer notes,
        Integer active) {
}