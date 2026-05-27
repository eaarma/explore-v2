import * as SQLite from "expo-sqlite";

import {
  getActiveJourneys,
  getJourneyLocations,
} from "@/src/features/journeys/api/journeysApi";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import { getActiveLocations } from "@/src/features/locations/api/locationsApi";
import { Location } from "@/src/features/locations/types/locationTypes";

const DATABASE_NAME = "explore-content.db";
const LAST_CONTENT_SYNC_AT_KEY = "last_content_sync_at";
const LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY = "last_journey_locations_sync_at";
const CONTENT_CACHE_SCHEMA_VERSION = 3;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export type CachedContentSummary = {
  totalLocations: number;
  totalJourneys: number;
  lastContentSyncAt: string | null;
};

type BootstrapResult = {
  didBootstrap: boolean;
};

export async function initializeContentCache() {
  await getDatabase();
}

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

export async function getSyncMetadataValue(key: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = ?",
    [key],
  );

  return row?.value ?? null;
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

export async function bootstrapContentCacheIfNeeded(): Promise<BootstrapResult> {
  const [lastContentSyncAt, locationCount, journeyCount] = await Promise.all([
    getSyncMetadataValue(LAST_CONTENT_SYNC_AT_KEY),
    getTableCount("locations"),
    getTableCount("journeys"),
  ]);

  const shouldBootstrap =
    !lastContentSyncAt || locationCount === 0 || journeyCount === 0;

  if (!shouldBootstrap) {
    return {
      didBootstrap: false,
    };
  }

  await syncActiveContentCache();

  return {
    didBootstrap: true,
  };
}

export async function bootstrapJourneyLocationsCacheIfNeeded() {
  const [lastJourneyLocationsSyncAt, journeyCount, journeyLocationCount] =
    await Promise.all([
      getSyncMetadataValue(LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY),
      getTableCount("journeys"),
      getTableCount("journey_locations"),
    ]);

  const shouldBootstrapJourneyLocations =
    !lastJourneyLocationsSyncAt ||
    (journeyCount > 0 && journeyLocationCount === 0);

  if (!shouldBootstrapJourneyLocations) {
    return {
      didBootstrap: false,
    };
  }

  await syncJourneyLocationsCache();

  return {
    didBootstrap: true,
  };
}

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

export async function syncActiveContentCache() {
  const [locations, journeys] = await Promise.all([
    getActiveLocations(),
    getActiveJourneys(),
  ]);

  await cacheActiveContent({
    locations,
    journeys,
  });

  return {
    locations,
    journeys,
  };
}

export async function syncAllContentCaches() {
  const syncedContent = await syncActiveContentCache();
  let journeyLocations: JourneyLocation[] = [];

  try {
    journeyLocations = await syncJourneyLocationsCache(syncedContent.journeys);
  } catch {
    // Keep newly synced locations and journeys available even if the
    // journey-location backfill fails for one of the routes.
    try {
      journeyLocations = await getCachedJourneyLocations();
    } catch {
      journeyLocations = [];
    }
  }

  return {
    ...syncedContent,
    journeyLocations,
  };
}

export async function cacheJourneyLocations(journeyLocations: JourneyLocation[]) {
  await replaceJourneyLocations(journeyLocations);
}

export async function syncJourneyLocationsCache(journeys?: Journey[]) {
  const sourceJourneys = journeys ?? (await getCachedJourneys());
  const journeyLocationsByJourney = await Promise.all(
    sourceJourneys.map((journey) => getJourneyLocations(journey.id)),
  );
  const journeyLocations = journeyLocationsByJourney.flat();

  await cacheJourneyLocations(journeyLocations);

  return journeyLocations;
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAndPrepareDatabase();
  }

  return databasePromise;
}

async function openAndPrepareDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentSchemaVersion = Number(versionRow?.user_version ?? 0);

  if (currentSchemaVersion < CONTENT_CACHE_SCHEMA_VERSION) {
    await database.execAsync(`
      DROP INDEX IF EXISTS idx_journey_locations_journeyId_sortOrder;
      DROP TABLE IF EXISTS journey_locations;
      DROP TABLE IF EXISTS locations;
      DROP TABLE IF EXISTS journeys;

      ${getCreateLocationsTableSql()}
      ${getCreateJourneysTableSql()}
      ${getCreateJourneyLocationsTableSql()}
      ${getCreateJourneyLocationsIndexSql("IF NOT EXISTS")}

      PRAGMA user_version = ${CONTENT_CACHE_SCHEMA_VERSION};
    `);
  } else {
    await database.execAsync(`
      ${getCreateLocationsTableSql("IF NOT EXISTS")}
      ${getCreateJourneysTableSql("IF NOT EXISTS")}
      ${getCreateJourneyLocationsTableSql("IF NOT EXISTS")}
      ${getCreateJourneyLocationsIndexSql("IF NOT EXISTS")}
    `);
  }

  await database.execAsync("PRAGMA foreign_keys = ON;");

  return database;
}

async function getTableCount(
  tableName: "locations" | "journeys" | "journey_locations",
) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${tableName}`,
  );

  return Number(row?.count ?? 0);
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
 
    await database.runAsync(
      `
        INSERT INTO sync_metadata (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      [LAST_CONTENT_SYNC_AT_KEY, new Date().toISOString()],
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

    await database.runAsync(
      `
        INSERT INTO sync_metadata (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      [LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY, new Date().toISOString()],
    );
  });
}

function getCreateLocationsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} locations (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      imageUrl TEXT,
      experience INTEGER,
      difficulty INTEGER,
      notes INTEGER,
      status INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;
}

function getCreateJourneysTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journeys (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      experience INTEGER,
      distance REAL,
      difficulty INTEGER,
      polyline TEXT,
      notes INTEGER,
      status INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;
}

function getCreateJourneyLocationsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journey_locations (
      id INTEGER PRIMARY KEY NOT NULL,
      journeyId INTEGER NOT NULL,
      locationId INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      imageUrl TEXT,
      experience INTEGER,
      difficulty INTEGER,
      notes INTEGER,
      status INTEGER,
      sortOrder INTEGER,
      FOREIGN KEY (journeyId) REFERENCES journeys(id) ON DELETE CASCADE
    );
  `;
}

function getCreateJourneyLocationsIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_journey_locations_journeyId_sortOrder
      ON journey_locations (journeyId, sortOrder);
  `;
}
