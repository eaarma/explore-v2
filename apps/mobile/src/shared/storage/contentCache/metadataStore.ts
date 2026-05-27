import type * as SQLite from "expo-sqlite";

import { getDatabase } from "@/src/shared/storage/contentCache/db";

export const LAST_CONTENT_SYNC_AT_KEY = "last_content_sync_at";
export const LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY =
  "last_journey_locations_sync_at";

export type ContentCacheTableName =
  | "locations"
  | "journeys"
  | "journey_locations";

export async function getSyncMetadataValue(key: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = ?",
    [key],
  );

  return row?.value ?? null;
}

export async function getTableCount(tableName: ContentCacheTableName) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${tableName}`,
  );

  return Number(row?.count ?? 0);
}

export async function upsertSyncMetadata(
  database: SQLite.SQLiteDatabase,
  key: string,
  value: string,
) {
  await database.runAsync(
    `
      INSERT INTO sync_metadata (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [key, value],
  );
}
