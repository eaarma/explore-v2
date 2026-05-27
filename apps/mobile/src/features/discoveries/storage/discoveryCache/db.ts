import * as SQLite from "expo-sqlite";
import {
  getCreateActiveItemsCreatedAtIndexSql,
  getCreateActiveItemsTableSql,
  getCreateActiveTripSelectionTableSql,
  getCreateJourneyCompletionsIndexSql,
  getCreateJourneyCompletionsTableSql,
  getCreateLocationDiscoveriesIndexSql,
  getCreateLocationDiscoveriesTableSql,
  getCreatePendingOfflineDiscoveriesIndexSql,
  getCreatePendingOfflineDiscoveriesTableSql,
  getCreateTripJourneysSortOrderIndexSql,
  getCreateTripJourneysTableSql,
  getCreateTripLocationsSortOrderIndexSql,
  getCreateTripLocationsTableSql,
  getCreateTripsTableSql,
  getCreateTripsUpdatedAtIndexSql,
} from "@/src/features/discoveries/storage/discoveryCache/schema";

const DATABASE_NAME = "explore-progress.db";
const DISCOVERY_CACHE_SCHEMA_VERSION = 5;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initializeDiscoveryCache() {
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
  `);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let currentSchemaVersion = Number(versionRow?.user_version ?? 0);

  if (currentSchemaVersion < 1) {
    await database.execAsync(`
      DROP INDEX IF EXISTS idx_location_discoveries_user_discoveredAt;
      DROP INDEX IF EXISTS idx_journey_completions_user_completedAt;
      DROP TABLE IF EXISTS location_discoveries;
      DROP TABLE IF EXISTS journey_completions;

      ${getCreateLocationDiscoveriesTableSql()}
      ${getCreateJourneyCompletionsTableSql()}
      ${getCreateLocationDiscoveriesIndexSql()}
      ${getCreateJourneyCompletionsIndexSql()}

      PRAGMA user_version = 1;
    `);
    currentSchemaVersion = 1;
  }

  if (currentSchemaVersion < 2) {
    await database.execAsync(`
      ${getCreatePendingOfflineDiscoveriesTableSql()}
      ${getCreatePendingOfflineDiscoveriesIndexSql()}

      PRAGMA user_version = 2;
    `);
    currentSchemaVersion = 2;
  }

  if (currentSchemaVersion < 3) {
    await database.execAsync(`
      ${getCreateActiveItemsTableSql()}
      ${getCreateActiveItemsCreatedAtIndexSql()}

      PRAGMA user_version = 3;
    `);
    currentSchemaVersion = 3;
  }

  if (currentSchemaVersion < 4) {
    await database.execAsync(`
      ${getCreateTripsTableSql()}
      ${getCreateTripsUpdatedAtIndexSql()}
      ${getCreateTripLocationsTableSql()}
      ${getCreateTripLocationsSortOrderIndexSql()}
      ${getCreateTripJourneysTableSql()}
      ${getCreateTripJourneysSortOrderIndexSql()}

      PRAGMA user_version = 4;
    `);
    currentSchemaVersion = 4;
  }

  if (currentSchemaVersion < 5) {
    await database.execAsync(`
      ${getCreateActiveTripSelectionTableSql()}

      PRAGMA user_version = 5;
    `);
    currentSchemaVersion = 5;
  }

  if (currentSchemaVersion >= DISCOVERY_CACHE_SCHEMA_VERSION) {
    await database.execAsync(`
      ${getCreateLocationDiscoveriesTableSql("IF NOT EXISTS")}
      ${getCreateJourneyCompletionsTableSql("IF NOT EXISTS")}
      ${getCreateLocationDiscoveriesIndexSql("IF NOT EXISTS")}
      ${getCreateJourneyCompletionsIndexSql("IF NOT EXISTS")}
      ${getCreatePendingOfflineDiscoveriesTableSql("IF NOT EXISTS")}
      ${getCreatePendingOfflineDiscoveriesIndexSql("IF NOT EXISTS")}
      ${getCreateActiveItemsTableSql("IF NOT EXISTS")}
      ${getCreateActiveItemsCreatedAtIndexSql("IF NOT EXISTS")}
      ${getCreateTripsTableSql("IF NOT EXISTS")}
      ${getCreateTripsUpdatedAtIndexSql("IF NOT EXISTS")}
      ${getCreateTripLocationsTableSql("IF NOT EXISTS")}
      ${getCreateTripLocationsSortOrderIndexSql("IF NOT EXISTS")}
      ${getCreateTripJourneysTableSql("IF NOT EXISTS")}
      ${getCreateTripJourneysSortOrderIndexSql("IF NOT EXISTS")}
      ${getCreateActiveTripSelectionTableSql("IF NOT EXISTS")}
    `);
  }

  return database;
}
