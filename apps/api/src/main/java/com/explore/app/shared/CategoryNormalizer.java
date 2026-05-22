package com.explore.app.shared;

import java.util.Locale;

public final class CategoryNormalizer {

    private static final String URBEX_CATEGORY = "Urbex";

    private CategoryNormalizer() {
    }

    public static String normalizeOptionalCategory(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        String normalized = trimmed.toLowerCase(Locale.ROOT);
        if (normalized.startsWith("aband") || normalized.startsWith("urbex")) {
            return URBEX_CATEGORY;
        }

        return trimmed;
    }
}
