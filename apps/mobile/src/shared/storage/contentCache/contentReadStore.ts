import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
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

export async function getCachedLocations() {
  const database = await getDatabase();

  return database.getAllAsync<Location>(
    "SELECT * FROM locations ORDER BY title COLLATE NOCASE ASC",
  );
}

export async function getCachedLocationById(locationId: number) {
  const database = await getDatabase();

  return database.getFirstAsync<Location>(
    "SELECT * FROM locations WHERE id = ?",
    [locationId],
  );
}

export async function getCachedJourneys() {
  const database = await getDatabase();

  return database.getAllAsync<Journey>(
    "SELECT * FROM journeys ORDER BY title COLLATE NOCASE ASC",
  );
}

export async function getCachedJourneyById(journeyId: number) {
  const database = await getDatabase();

  return database.getFirstAsync<Journey>(
    "SELECT * FROM journeys WHERE id = ?",
    [journeyId],
  );
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
