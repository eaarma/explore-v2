import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import { getDatabase } from "@/src/shared/storage/contentCache/db";
import {
  LAST_CONTENT_SYNC_AT_KEY,
  LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY,
  upsertSyncMetadata,
} from "@/src/shared/storage/contentCache/metadataStore";

export async function cacheActiveContent({
  locations,
  journeys,
}: {
  locations: Location[];
  journeys: Journey[];
}) {
  await replaceActiveContent({
    locations,
    journeys,
  });
}

export async function cacheJourneyLocations(journeyLocations: JourneyLocation[]) {
  await replaceJourneyLocations(journeyLocations);
}

async function replaceActiveContent({
  locations,
  journeys,
}: {
  locations: Location[];
  journeys: Journey[];
}) {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      DELETE FROM locations;
      DELETE FROM journeys;
    `);

    for (const location of locations) {
      await database.runAsync(
        `
          INSERT OR REPLACE INTO locations (
            id,
            title,
            description,
            latitude,
            longitude,
            county,
            category,
            imageUrl,
            experience,
            difficulty,
            notes,
            status,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          location.id,
          location.title ?? null,
          location.description ?? null,
          location.latitude ?? null,
          location.longitude ?? null,
          location.county ?? null,
          location.category ?? null,
          location.imageUrl ?? null,
          location.experience ?? null,
          location.difficulty ?? null,
          location.notes ?? null,
          location.status ?? null,
          location.createdAt ?? null,
          location.updatedAt ?? null,
        ],
      );
    }

    for (const journey of journeys) {
      await database.runAsync(
        `
          INSERT OR REPLACE INTO journeys (
            id,
            title,
            description,
            latitude,
            longitude,
            county,
            category,
            experience,
            distance,
            difficulty,
            polyline,
            notes,
            status,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          journey.id,
          journey.title ?? null,
          journey.description ?? null,
          journey.latitude ?? null,
          journey.longitude ?? null,
          journey.county ?? null,
          journey.category ?? null,
          journey.experience ?? null,
          journey.distance ?? null,
          journey.difficulty ?? null,
          journey.polyline ?? null,
          journey.notes ?? null,
          journey.status ?? null,
          journey.createdAt ?? null,
          journey.updatedAt ?? null,
        ],
      );
    }

    await upsertSyncMetadata(
      database,
      LAST_CONTENT_SYNC_AT_KEY,
      new Date().toISOString(),
    );
  });
}

async function replaceJourneyLocations(journeyLocations: JourneyLocation[]) {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.execAsync("DELETE FROM journey_locations;");

    for (const journeyLocation of journeyLocations) {
      await database.runAsync(
        `
          INSERT OR REPLACE INTO journey_locations (
            id,
            journeyId,
            locationId,
            title,
            description,
            latitude,
            longitude,
            county,
            category,
            imageUrl,
            experience,
            difficulty,
            notes,
            status,
            sortOrder
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          journeyLocation.id,
          journeyLocation.journeyId,
          journeyLocation.locationId,
          journeyLocation.title ?? null,
          journeyLocation.description ?? null,
          journeyLocation.latitude ?? null,
          journeyLocation.longitude ?? null,
          journeyLocation.county ?? null,
          journeyLocation.category ?? null,
          journeyLocation.imageUrl ?? null,
          journeyLocation.experience ?? null,
          journeyLocation.difficulty ?? null,
          journeyLocation.notes ?? null,
          journeyLocation.status ?? null,
          journeyLocation.sortOrder ?? null,
        ],
      );
    }

    await upsertSyncMetadata(
      database,
      LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY,
      new Date().toISOString(),
    );
  });
}
