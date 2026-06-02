import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import type { Journey, JourneyTrait } from "@/src/features/journeys/types/journeyTypes";
import type {
  Location,
  LocationTrait,
} from "@/src/features/locations/types/locationTypes";
import { getDatabase } from "@/src/shared/storage/contentCache/db";
import {
  getSyncMetadataValue,
  getTableCount,
  LAST_CONTENT_SYNC_AT_KEY,
} from "@/src/shared/storage/contentCache/metadataStore";

export type CachedContentSummary = {
  totalLocations: number;
  totalJourneys: number;
  lastContentSyncAt: string | null;
};

type CachedLocationRow = Omit<Location, "imageUrls" | "traits"> & {
  imageUrls: string | null;
  traits: string | null;
};

type CachedJourneyRow = Omit<Journey, "traits"> & {
  traits: string | null;
};

export async function getCachedLocations() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CachedLocationRow>(
    "SELECT * FROM locations ORDER BY title COLLATE NOCASE ASC",
  );

  return rows.map(mapCachedLocationRow);
}

export async function getCachedLocationById(locationId: number) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CachedLocationRow>(
    "SELECT * FROM locations WHERE id = ?",
    [locationId],
  );

  return row ? mapCachedLocationRow(row) : null;
}

export async function getCachedJourneys() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CachedJourneyRow>(
    "SELECT * FROM journeys ORDER BY title COLLATE NOCASE ASC",
  );

  return rows.map(mapCachedJourneyRow);
}

export async function getCachedJourneyById(journeyId: number) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CachedJourneyRow>(
    "SELECT * FROM journeys WHERE id = ?",
    [journeyId],
  );

  return row ? mapCachedJourneyRow(row) : null;
}

export async function getCachedJourneyLocations() {
  const database = await getDatabase();

  return database.getAllAsync<JourneyLocation>(
    "SELECT * FROM journey_locations ORDER BY journeyId ASC, sortOrder ASC",
  );
}

export async function getCachedJourneyLocationsByJourneyId(journeyId: number) {
  const database = await getDatabase();

  return database.getAllAsync<JourneyLocation>(
    `
      SELECT * FROM journey_locations
      WHERE journeyId = ?
      ORDER BY sortOrder ASC
    `,
    [journeyId],
  );
}

export async function getCachedContentSummary(): Promise<CachedContentSummary> {
  const [totalLocations, totalJourneys, lastContentSyncAt] = await Promise.all([
    getTableCount("locations"),
    getTableCount("journeys"),
    getSyncMetadataValue(LAST_CONTENT_SYNC_AT_KEY),
  ]);

  return {
    totalLocations,
    totalJourneys,
    lastContentSyncAt,
  };
}

function mapCachedLocationRow(row: CachedLocationRow): Location {
  return {
    ...row,
    imageUrls: parseCachedImageUrls(row.imageUrls, row.imageUrl),
    traits: parseCachedTraits(row.traits),
  };
}

function mapCachedJourneyRow(row: CachedJourneyRow): Journey {
  return {
    ...row,
    traits: parseCachedJourneyTraits(row.traits),
  };
}

function parseCachedImageUrls(
  serializedImageUrls: string | null,
  fallbackImageUrl: string | null,
) {
  if (serializedImageUrls) {
    try {
      const parsedImageUrls = JSON.parse(serializedImageUrls);

      if (Array.isArray(parsedImageUrls)) {
        const normalizedImageUrls = parsedImageUrls
          .map((imageUrl) => (typeof imageUrl === "string" ? imageUrl.trim() : ""))
          .filter((imageUrl) => imageUrl.length > 0);

        if (normalizedImageUrls.length > 0) {
          return normalizedImageUrls;
        }
      }
    } catch {
      // Fall back to the legacy single-image field when cached JSON is invalid.
    }
  }

  const normalizedFallbackImageUrl = fallbackImageUrl?.trim() ?? "";
  return normalizedFallbackImageUrl ? [normalizedFallbackImageUrl] : [];
}

function parseCachedTraits(serializedTraits: string | null) {
  if (!serializedTraits) {
    return [];
  }

  try {
    const parsedTraits = JSON.parse(serializedTraits);

    if (!Array.isArray(parsedTraits)) {
      return [];
    }

    return parsedTraits
      .map((trait, index) => mapCachedTrait(trait, index))
      .filter((trait): trait is LocationTrait => trait !== null);
  } catch {
    return [];
  }
}

function mapCachedTrait(value: unknown, fallbackIndex: number) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<LocationTrait>;
  const normalizedName =
    typeof candidate.name === "string" ? candidate.name.trim() : "";

  if (!normalizedName) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "number" && Number.isFinite(candidate.id)
        ? candidate.id
        : -(fallbackIndex + 1),
    name: normalizedName,
    sortOrder:
      typeof candidate.sortOrder === "number" &&
      Number.isFinite(candidate.sortOrder)
        ? candidate.sortOrder
        : fallbackIndex,
  };
}

function parseCachedJourneyTraits(serializedTraits: string | null) {
  if (!serializedTraits) {
    return [];
  }

  try {
    const parsedTraits = JSON.parse(serializedTraits);

    if (!Array.isArray(parsedTraits)) {
      return [];
    }

    return parsedTraits
      .map((trait, index) => mapCachedJourneyTrait(trait, index))
      .filter((trait): trait is JourneyTrait => trait !== null);
  } catch {
    return [];
  }
}

function mapCachedJourneyTrait(value: unknown, fallbackIndex: number) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<JourneyTrait>;
  const normalizedName =
    typeof candidate.name === "string" ? candidate.name.trim() : "";

  if (!normalizedName) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "number" && Number.isFinite(candidate.id)
        ? candidate.id
        : -(fallbackIndex + 1),
    name: normalizedName,
    sortOrder:
      typeof candidate.sortOrder === "number" &&
      Number.isFinite(candidate.sortOrder)
        ? candidate.sortOrder
        : fallbackIndex,
  };
}
