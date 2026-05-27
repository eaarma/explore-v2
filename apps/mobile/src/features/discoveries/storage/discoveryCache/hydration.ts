import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";

type LocationDiscoveryRow = {
  locationId: number;
  discoveredAt: string;
};

type JourneyCompletionRow = {
  journeyId: number;
  completedAt: string;
};

type ActiveItemLookupRow = {
  itemId: number;
  createdAt: string;
};

export async function hydrateLocationsWithProgress(
  userId: string | null | undefined,
  locations: Location[],
) {
  if (!userId || locations.length === 0) {
    return locations;
  }

  const database = await getDatabase();
  const locationIds = locations.map((location) => location.id);
  const placeholders = buildPlaceholders(locationIds.length);
  const [rows, activeRows] = await Promise.all([
    database.getAllAsync<LocationDiscoveryRow>(
      `
        SELECT locationId, discoveredAt
        FROM location_discoveries
        WHERE userId = ?
          AND locationId IN (${placeholders})
      `,
      [userId, ...locationIds],
    ),
    database.getAllAsync<ActiveItemLookupRow>(
      `
        SELECT item_id AS itemId, created_at AS createdAt
        FROM active_items
        WHERE user_id = ?
          AND item_type = 'LOCATION'
          AND item_id IN (${placeholders})
      `,
      [userId, ...locationIds],
    ),
  ]);
  const discoveredByLocationId = new Map(
    rows.map((row) => [row.locationId, row.discoveredAt] as const),
  );
  const activeByLocationId = new Map(
    activeRows.map((row) => [row.itemId, row.createdAt] as const),
  );

  return locations.map((location) => ({
    ...location,
    discovered: discoveredByLocationId.has(location.id),
    discoveredAt: discoveredByLocationId.get(location.id) ?? null,
    active: activeByLocationId.has(location.id),
    activeAt: activeByLocationId.get(location.id) ?? null,
  }));
}

export async function hydrateLocationWithProgress(
  userId: string | null | undefined,
  location: Location | null,
) {
  if (!location) {
    return null;
  }

  const [hydratedLocation] = await hydrateLocationsWithProgress(userId, [
    location,
  ]);

  return hydratedLocation ?? location;
}

export async function hydrateJourneysWithProgress(
  userId: string | null | undefined,
  journeys: Journey[],
) {
  if (!userId || journeys.length === 0) {
    return journeys;
  }

  const database = await getDatabase();
  const journeyIds = journeys.map((journey) => journey.id);
  const placeholders = buildPlaceholders(journeyIds.length);
  const [rows, activeRows] = await Promise.all([
    database.getAllAsync<JourneyCompletionRow>(
      `
        SELECT journeyId, completedAt
        FROM journey_completions
        WHERE userId = ?
          AND journeyId IN (${placeholders})
      `,
      [userId, ...journeyIds],
    ),
    database.getAllAsync<ActiveItemLookupRow>(
      `
        SELECT item_id AS itemId, created_at AS createdAt
        FROM active_items
        WHERE user_id = ?
          AND item_type = 'JOURNEY'
          AND item_id IN (${placeholders})
      `,
      [userId, ...journeyIds],
    ),
  ]);
  const completedByJourneyId = new Map(
    rows.map((row) => [row.journeyId, row.completedAt] as const),
  );
  const activeByJourneyId = new Map(
    activeRows.map((row) => [row.itemId, row.createdAt] as const),
  );

  return journeys.map((journey) => ({
    ...journey,
    completed: completedByJourneyId.has(journey.id),
    completedAt: completedByJourneyId.get(journey.id) ?? null,
    active: activeByJourneyId.has(journey.id),
    activeAt: activeByJourneyId.get(journey.id) ?? null,
  }));
}

export async function hydrateJourneyWithProgress(
  userId: string | null | undefined,
  journey: Journey | null,
) {
  if (!journey) {
    return null;
  }

  const [hydratedJourney] = await hydrateJourneysWithProgress(userId, [journey]);
  return hydratedJourney ?? journey;
}

function buildPlaceholders(count: number) {
  return new Array(count).fill("?").join(", ");
}
