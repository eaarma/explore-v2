import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";

type CountRow = {
  count: number;
};

type ExistingTableRow = {
  name: string;
};

export type PendingOfflineDiscovery = {
  locationId: number;
  discoveredAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

type PendingOfflineDiscoveryRow = PendingOfflineDiscovery;

export type PendingOfflineProgressSummary = {
  discoveryCount: number;
  journeyCompletionCount: number;
  totalCount: number;
};

export async function getPendingOfflineDiscoveries(userId: string) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();

  return database.getAllAsync<PendingOfflineDiscoveryRow>(
    `
      SELECT
        locationId,
        discoveredAt,
        latitude,
        longitude,
        accuracyMeters
      FROM pending_location_discoveries
      WHERE userId = ?
      ORDER BY discoveredAt ASC, locationId ASC
    `,
    [userId],
  );
}

export async function clearPendingOfflineDiscoveries(
  userId: string,
  locationIds: number[],
) {
  if (!userId || locationIds.length === 0) {
    return;
  }

  const database = await getDatabase();
  const placeholders = buildPlaceholders(locationIds.length);

  await database.runAsync(
    `
      DELETE FROM pending_location_discoveries
      WHERE userId = ?
        AND locationId IN (${placeholders})
    `,
    [userId, ...locationIds],
  );
}

export async function getPendingOfflineProgressSummary(
  userId: string,
): Promise<PendingOfflineProgressSummary> {
  if (!userId) {
    return {
      discoveryCount: 0,
      journeyCompletionCount: 0,
      totalCount: 0,
    };
  }

  const database = await getDatabase();
  const [discoveryCountRow, journeyCompletionCount] = await Promise.all([
    database.getFirstAsync<CountRow>(
      `
        SELECT COUNT(*) AS count
        FROM pending_location_discoveries
        WHERE userId = ?
      `,
      [userId],
    ),
    getOptionalPendingQueueCount(
      database,
      "pending_journey_completions",
      userId,
    ),
  ]);

  const discoveryCount = Number(discoveryCountRow?.count ?? 0);

  return {
    discoveryCount,
    journeyCompletionCount,
    totalCount: discoveryCount + journeyCompletionCount,
  };
}

async function getOptionalPendingQueueCount(
  database: Awaited<ReturnType<typeof getDatabase>>,
  tableName: "pending_journey_completions",
  userId: string,
) {
  const tableExists = await doesTableExist(database, tableName);

  if (!tableExists) {
    return 0;
  }

  const row = await database.getFirstAsync<CountRow>(
    `
      SELECT COUNT(*) AS count
      FROM ${tableName}
      WHERE userId = ?
    `,
    [userId],
  );

  return Number(row?.count ?? 0);
}

async function doesTableExist(
  database: Awaited<ReturnType<typeof getDatabase>>,
  tableName: string,
) {
  const row = await database.getFirstAsync<ExistingTableRow>(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `,
    [tableName],
  );

  return Boolean(row?.name);
}

function buildPlaceholders(count: number) {
  return new Array(count).fill("?").join(", ");
}
