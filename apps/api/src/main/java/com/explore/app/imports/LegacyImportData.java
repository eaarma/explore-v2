package com.explore.app.imports;

import java.util.List;

public record LegacyImportData(
        List<LegacyLocation> locations,
        List<LegacyJourney> journeys) {
}