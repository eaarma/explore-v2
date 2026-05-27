import * as SQLite from "expo-sqlite";

import {
  CONTENT_CACHE_SCHEMA_VERSION,
  DATABASE_NAME,
  getCreateJourneyLocationsIndexSql,
  getCreateJourneyLocationsTableSql,
  getCreateJourneysTableSql,
  getCreateLocationsTableSql,
  getCreateSyncMetadataTableSql,
} from "@/src/shared/storage/contentCache/schema";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initializeContentCache() {
  await getDatabase();
}

export async function getDatabase() {
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

    ${getCreateSyncMetadataTableSql("IF NOT EXISTS")}
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
