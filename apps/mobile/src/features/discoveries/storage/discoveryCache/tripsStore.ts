import type * as SQLite from "expo-sqlite";
import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";
import {
  Trip,
  TripJourney,
  TripLocation,
} from "@/src/features/trips/types/tripTypes";

type TripRow = Omit<Trip, "isArchived"> & {
  isArchived: number;
};

type TripLocationRow = TripLocation;

type TripJourneyRow = TripJourney;

type SortOrderRow = {
  sortOrder: number | null;
};

export type ActiveTripSelection = {
  userId: string;
  tripId: number;
  updatedAt: string;
};

export type TripItemOrderInput = {
  kind: "location" | "journey";
  relationId: number;
};

export async function getTrips(
  userId: string,
  options?: {
    includeArchived?: boolean;
  },
) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();
  const includeArchived = options?.includeArchived === true;
  const rows = includeArchived
    ? await database.getAllAsync<TripRow>(
        `
          SELECT
            id,
            user_id AS userId,
            name,
            description,
            created_at AS createdAt,
            updated_at AS updatedAt,
            is_archived AS isArchived
          FROM trips
          WHERE user_id = ?
          ORDER BY updated_at DESC, id DESC
        `,
        [userId],
      )
    : await database.getAllAsync<TripRow>(
        `
          SELECT
            id,
            user_id AS userId,
            name,
            description,
            created_at AS createdAt,
            updated_at AS updatedAt,
            is_archived AS isArchived
          FROM trips
          WHERE user_id = ?
            AND is_archived = 0
          ORDER BY updated_at DESC, id DESC
        `,
        [userId],
      );

  return rows.map(mapTripRow);
}

export async function getTrip(userId: string, tripId: number) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const row = await getOwnedTripRow(database, userId, tripId);
  return row ? mapTripRow(row) : null;
}

export async function createTrip({
  userId,
  name,
  description = null,
}: {
  userId: string;
  name: string;
  description?: string | null;
}) {
  if (!userId) {
    return null;
  }

  const normalizedName = normalizeRequiredText(name, "Trip name");
  const now = new Date().toISOString();
  const database = await getDatabase();
  const result = await database.runAsync(
    `
      INSERT INTO trips (
        user_id,
        name,
        description,
        is_archived,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 0, ?, ?)
    `,
    [userId, normalizedName, normalizeOptionalText(description), now, now],
  );

  const tripId = Number(result.lastInsertRowId ?? 0);
  return tripId > 0 ? getTrip(userId, tripId) : null;
}

export async function getTripLocations(userId: string, tripId: number) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();

  return database.getAllAsync<TripLocationRow>(
    `
      SELECT
        trip_location.id,
        trip_location.trip_id AS tripId,
        trip_location.location_id AS locationId,
        trip_location.sort_order AS sortOrder,
        trip_location.created_at AS createdAt
      FROM trip_locations trip_location
      INNER JOIN trips trip ON trip.id = trip_location.trip_id
      WHERE trip.user_id = ?
        AND trip_location.trip_id = ?
      ORDER BY trip_location.sort_order ASC, trip_location.id ASC
    `,
    [userId, tripId],
  );
}

export async function getTripJourneys(userId: string, tripId: number) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();

  return database.getAllAsync<TripJourneyRow>(
    `
      SELECT
        trip_journey.id,
        trip_journey.trip_id AS tripId,
        trip_journey.journey_id AS journeyId,
        trip_journey.sort_order AS sortOrder,
        trip_journey.created_at AS createdAt
      FROM trip_journeys trip_journey
      INNER JOIN trips trip ON trip.id = trip_journey.trip_id
      WHERE trip.user_id = ?
        AND trip_journey.trip_id = ?
      ORDER BY trip_journey.sort_order ASC, trip_journey.id ASC
    `,
    [userId, tripId],
  );
}

export async function addLocationToTrip({
  userId,
  tripId,
  locationId,
}: {
  userId: string;
  tripId: number;
  locationId: number;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const now = new Date().toISOString();
  const sortOrder = await getNextTripItemSortOrder(database, tripId);

  await database.runAsync(
    `
      INSERT INTO trip_locations (
        trip_id,
        location_id,
        sort_order,
        created_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(trip_id, location_id)
      DO NOTHING
    `,
    [tripId, locationId, sortOrder, now],
  );

  await touchTrip(database, tripId, now);

  return database.getFirstAsync<TripLocationRow>(
    `
      SELECT
        trip_location.id,
        trip_location.trip_id AS tripId,
        trip_location.location_id AS locationId,
        trip_location.sort_order AS sortOrder,
        trip_location.created_at AS createdAt
      FROM trip_locations trip_location
      WHERE trip_location.trip_id = ?
        AND trip_location.location_id = ?
    `,
    [tripId, locationId],
  );
}

export async function addJourneyToTrip({
  userId,
  tripId,
  journeyId,
}: {
  userId: string;
  tripId: number;
  journeyId: number;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const now = new Date().toISOString();
  const sortOrder = await getNextTripItemSortOrder(database, tripId);

  await database.runAsync(
    `
      INSERT INTO trip_journeys (
        trip_id,
        journey_id,
        sort_order,
        created_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(trip_id, journey_id)
      DO NOTHING
    `,
    [tripId, journeyId, sortOrder, now],
  );

  await touchTrip(database, tripId, now);

  return database.getFirstAsync<TripJourneyRow>(
    `
      SELECT
        trip_journey.id,
        trip_journey.trip_id AS tripId,
        trip_journey.journey_id AS journeyId,
        trip_journey.sort_order AS sortOrder,
        trip_journey.created_at AS createdAt
      FROM trip_journeys trip_journey
      WHERE trip_journey.trip_id = ?
        AND trip_journey.journey_id = ?
    `,
    [tripId, journeyId],
  );
}

export async function removeLocationFromTrip({
  userId,
  tripId,
  locationId,
}: {
  userId: string;
  tripId: number;
  locationId: number;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const now = new Date().toISOString();

  await database.runAsync(
    `
      DELETE FROM trip_locations
      WHERE trip_id = ?
        AND location_id = ?
    `,
    [tripId, locationId],
  );

  await touchTrip(database, tripId, now);
  return getTrip(userId, tripId);
}

export async function removeJourneyFromTrip({
  userId,
  tripId,
  journeyId,
}: {
  userId: string;
  tripId: number;
  journeyId: number;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const now = new Date().toISOString();

  await database.runAsync(
    `
      DELETE FROM trip_journeys
      WHERE trip_id = ?
        AND journey_id = ?
    `,
    [tripId, journeyId],
  );

  await touchTrip(database, tripId, now);
  return getTrip(userId, tripId);
}

export async function reorderTripItems({
  userId,
  tripId,
  itemOrder,
}: {
  userId: string;
  tripId: number;
  itemOrder: TripItemOrderInput[];
}) {
  if (!userId || itemOrder.length === 0) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const updatedAt = new Date().toISOString();

  await database.withTransactionAsync(async () => {
    for (const [index, item] of itemOrder.entries()) {
      if (item.kind === "location") {
        await database.runAsync(
          `
            UPDATE trip_locations
            SET sort_order = ?
            WHERE id = ?
              AND trip_id = ?
          `,
          [index, item.relationId, tripId],
        );
        continue;
      }

      await database.runAsync(
        `
          UPDATE trip_journeys
          SET sort_order = ?
          WHERE id = ?
            AND trip_id = ?
        `,
        [index, item.relationId, tripId],
      );
    }

    await touchTrip(database, tripId, updatedAt);
  });

  return getTrip(userId, tripId);
}

export async function getActiveTripSelection(userId: string) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();

  return database.getFirstAsync<ActiveTripSelection>(
    `
      SELECT
        user_id AS userId,
        trip_id AS tripId,
        updated_at AS updatedAt
      FROM active_trip_selection
      WHERE user_id = ?
    `,
    [userId],
  );
}

export async function setActiveTripSelection({
  userId,
  tripId,
}: {
  userId: string;
  tripId: number;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();
  const trip = await getOwnedTripRow(database, userId, tripId);

  if (!trip || trip.isArchived === 1) {
    return null;
  }

  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO active_trip_selection (
        user_id,
        trip_id,
        updated_at
      ) VALUES (?, ?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET
        trip_id = excluded.trip_id,
        updated_at = excluded.updated_at
    `,
    [userId, tripId, updatedAt],
  );

  return getActiveTripSelection(userId);
}

export async function clearActiveTripSelection(userId: string) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM active_trip_selection
      WHERE user_id = ?
    `,
    [userId],
  );
}

async function getOwnedTripRow(
  database: SQLite.SQLiteDatabase,
  userId: string,
  tripId: number,
) {
  return database.getFirstAsync<TripRow>(
    `
      SELECT
        id,
        user_id AS userId,
        name,
        description,
        created_at AS createdAt,
        updated_at AS updatedAt,
        is_archived AS isArchived
      FROM trips
      WHERE user_id = ?
        AND id = ?
    `,
    [userId, tripId],
  );
}

async function getNextTripItemSortOrder(
  database: SQLite.SQLiteDatabase,
  tripId: number,
) {
  const [locationRow, journeyRow] = await Promise.all([
    database.getFirstAsync<SortOrderRow>(
      `
        SELECT MAX(sort_order) AS sortOrder
        FROM trip_locations
        WHERE trip_id = ?
      `,
      [tripId],
    ),
    database.getFirstAsync<SortOrderRow>(
      `
        SELECT MAX(sort_order) AS sortOrder
        FROM trip_journeys
        WHERE trip_id = ?
      `,
      [tripId],
    ),
  ]);

  return Math.max(
    Number(locationRow?.sortOrder ?? -1),
    Number(journeyRow?.sortOrder ?? -1),
  ) + 1;
}

async function touchTrip(
  database: SQLite.SQLiteDatabase,
  tripId: number,
  updatedAt: string,
) {
  await database.runAsync(
    `
      UPDATE trips
      SET updated_at = ?
      WHERE id = ?
    `,
    [updatedAt, tripId],
  );
}

function mapTripRow(row: TripRow): Trip {
  return {
    ...row,
    isArchived: row.isArchived === 1,
  };
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    throw new Error(`${label} must not be blank.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
