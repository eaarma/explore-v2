package com.explore.app.imports;

public record LegacyJourney(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        Integer status,
        String county,
        Integer location1,
        Integer location2,
        Integer location3,
        Integer location4,
        Integer location5,
        Integer location6,
        Integer location7,
        Integer location8,
        Integer experience,
        Double distance,
        Integer difficulty,
        String category,
        String polyline,
        Integer notes,
        Integer active) {
}