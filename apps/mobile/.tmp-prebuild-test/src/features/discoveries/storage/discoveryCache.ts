import * as SQLite from "expo-sqlite";

import {
  DiscoveryCheckResponse,
  DiscoveryJourneyCompletionResult,
  DiscoveryLocationResult,
  DiscoveryProgressSummary,
} from "@/src/features/discoveries/types/discoveryTypes";
import { getCachedJourneyLocations } from "@/src/shared/storage/contentCache";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import { Location } from "@/src/features/locations/types/locationTypes";

const DATABASE_NAME = "explore-progress.db";
const DISCOVERY_CACHE_SCHEMA_VERSION = 3;
const RECENT_ACTIVITY_LIMIT = 5;
const DEFAULT_MAX_ALLOWED_ACCURACY_METERS = 100;
const DEFAULT_DISCOVERY_RADIUS_METERS = 50;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

type LocationDiscoveryRow = {
  locationId: number;
  discoveredAt: string;
};

type JourneyCompletionRow = {
  journeyId: number;
  completedAt: string;
};

type CountRow = {
  count: number;
};

type ActivityRow = {
  entityId: number;
  title: string | null;
  occurredAt: string;
  detail: string | null;
  kind: "location" | "journey";
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

export type ActiveItemType = "LOCATION" | "JOURNEY";

export type ActiveItem = {
  id: number;
  userId: string;
  itemType: ActiveItemType;
  itemId: number;
  createdAt: string;
};

type ActiveItemRow = ActiveItem;

type ActiveItemLookupRow = {
  itemId: number;
  createdAt: string;
};

export async function initializeDiscoveryCache() {
  await getDatabase();
}

export async function cacheDiscoveryCheckResult(
  userId: string,
  result: DiscoveryCheckResponse,
) {
  await upsertDiscoveryProgressSnapshot(userId, {
    discoveredLocations: result.discoveredLocations,
    completedJourneys: result.completedJourneys,
  });
}

export async function upsertDiscoveryProgressSnapshot(
  userId: string,
  progress: {
    discoveredLocations: DiscoveryLocationResult[];
    completedJourneys: DiscoveryJourneyCompletionResult[];
  },
) {
  if (!userId) {
    return;
  }

  if (
    progress.discoveredLocations.length === 0 &&
    progress.completedJourneys.length === 0
  ) {
    return;
  }

  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    for (const discovery of progress.discoveredLocations) {
      await database.runAsync(
        `
          INSERT OR REPLACE INTO location_discoveries (
            userId,
            locationId,
            title,
            discoveredAt,
            distanceMeters
          ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          discovery.locationId,
          discovery.title ?? null,
          discovery.discoveredAt,
          discovery.distanceMeters ?? null,
        ],
      );
    }

    for (const completion of progress.completedJourneys) {
      await database.runAsync(
        `
          INSERT OR REPLACE INTO journey_completions (
            userId,
            journeyId,
            title,
            totalLocations,
            completedAt
          ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          completion.journeyId,
          completion.title ?? null,
          completion.totalLocations ?? null,
          completion.completedAt,
        ],
      );
    }
  });
}

export async function captureOfflineDiscoveryCheck({
  userId,
  latitude,
  longitude,
  accuracyMeters,
  locations,
  journeys,
  maxAllowedAccuracyMeters = DEFAULT_MAX_ALLOWED_ACCURACY_METERS,
  discoveryRadiusMeters = DEFAULT_DISCOVERY_RADIUS_METERS,
}: {
  userId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  locations: Location[];
  journeys: Journey[];
  maxAllowedAccuracyMeters?: number;
  discoveryRadiusMeters?: number;
}): Promise<DiscoveryCheckResponse> {
  const checkedAt = new Date().toISOString();

  if (!userId) {
    return buildDiscoveryCheckResponse({
      accuracyValid: true,
      checkedAt,
      maxAllowedAccuracyMeters,
      discoveryRadiusMeters,
      discoveredLocations: [],
      completedJourneys: [],
    });
  }

  if (accuracyMeters > maxAllowedAccuracyMeters) {
    return buildDiscoveryCheckResponse({
      accuracyValid: false,
      checkedAt,
      maxAllowedAccuracyMeters,
      discoveryRadiusMeters,
      discoveredLocations: [],
      completedJourneys: [],
    });
  }

  const candidateLocations = locations
    .filter(hasValidCoordinates)
    .map((location) => ({
      location,
      distanceMeters: calculateDistanceMeters(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
      ),
    }))
    .filter((candidate) => candidate.distanceMeters <= discoveryRadiusMeters)
    .sort((left, right) => {
      if (left.distanceMeters !== right.distanceMeters) {
        return left.distanceMeters - right.distanceMeters;
      }

      return left.location.id - right.location.id;
    });

  if (candidateLocations.length === 0) {
    return buildDiscoveryCheckResponse({
      accuracyValid: true,
      checkedAt,
      maxAllowedAccuracyMeters,
      discoveryRadiusMeters,
      discoveredLocations: [],
      completedJourneys: [],
    });
  }

  const database = await getDatabase();
  const candidateLocationIds = candidateLocations.map(
    (candidate) => candidate.location.id,
  );
  const existingCandidateDiscoveries = await getLocationDiscoveriesForIds(
    database,
    userId,
    candidateLocationIds,
  );
  const existingCandidateDiscoveryIds = new Set(
    existingCandidateDiscoveries.map((discovery) => discovery.locationId),
  );

  const discoveredLocations = candidateLocations
    .filter((candidate) => !existingCandidateDiscoveryIds.has(candidate.location.id))
    .map((candidate) => ({
      locationId: candidate.location.id,
      title: normalizeLocationTitle(candidate.location.title),
      distanceMeters: roundDistanceMeters(candidate.distanceMeters),
      discoveredAt: checkedAt,
    }));

  if (discoveredLocations.length === 0) {
    return buildDiscoveryCheckResponse({
      accuracyValid: true,
      checkedAt,
      maxAllowedAccuracyMeters,
      discoveryRadiusMeters,
      discoveredLocations: [],
      completedJourneys: [],
    });
  }

  let cachedJourneyLocations: JourneyLocation[] = [];

  try {
    cachedJourneyLocations = await getCachedJourneyLocations();
  } catch {
    cachedJourneyLocations = [];
  }

  const newlyDiscoveredLocationIds = new Set(
    discoveredLocations.map((discovery) => discovery.locationId),
  );
  const candidateJourneyIds = new Set(
    cachedJourneyLocations
      .filter((journeyLocation) =>
        newlyDiscoveredLocationIds.has(journeyLocation.locationId))
      .map((journeyLocation) => journeyLocation.journeyId),
  );
  const journeyLocationsByJourneyId = new Map<number, JourneyLocation[]>();

  for (const journeyLocation of cachedJourneyLocations) {
    if (!candidateJourneyIds.has(journeyLocation.journeyId)) {
      continue;
    }

    const journeyLocationsForJourney =
      journeyLocationsByJourneyId.get(journeyLocation.journeyId) ?? [];
    journeyLocationsForJourney.push(journeyLocation);
    journeyLocationsByJourneyId.set(
      journeyLocation.journeyId,
      journeyLocationsForJourney,
    );
  }

  const relevantJourneyLocationIds = [...journeyLocationsByJourneyId.values()]
    .flat()
    .map((journeyLocation) => journeyLocation.locationId);
  const existingRelevantDiscoveries = await getLocationDiscoveriesForIds(
    database,
    userId,
    relevantJourneyLocationIds,
  );
  const discoveredAtByLocationId = new Map(
    existingRelevantDiscoveries.map((discovery) => [
      discovery.locationId,
      discovery.discoveredAt,
    ] as const),
  );

  for (const discovery of discoveredLocations) {
    discoveredAtByLocationId.set(discovery.locationId, discovery.discoveredAt);
  }

  const existingJourneyCompletions = await getJourneyCompletionsForIds(
    database,
    userId,
    Array.from(candidateJourneyIds),
  );
  const existingJourneyCompletionIds = new Set(
    existingJourneyCompletions.map((journey) => journey.journeyId),
  );
  const journeysById = new Map(journeys.map((journey) => [journey.id, journey]));
  const completedJourneys = [...candidateJourneyIds]
    .filter((journeyId) => !existingJourneyCompletionIds.has(journeyId))
    .map((journeyId) => {
      const journeyLocationsForJourney =
        journeyLocationsByJourneyId.get(journeyId) ?? [];

      if (
        journeyLocationsForJourney.length === 0 ||
        !journeyLocationsForJourney.every((journeyLocation) =>
          discoveredAtByLocationId.has(journeyLocation.locationId))
      ) {
        return null;
      }

      const completedAt = getLatestDiscoveredAt(
        journeyLocationsForJourney.map((journeyLocation) =>
          discoveredAtByLocationId.get(journeyLocation.locationId) ?? checkedAt),
      );
      const journey = journeysById.get(journeyId);

      return {
        journeyId,
        title: normalizeJourneyTitle(journey?.title),
        totalLocations: journeyLocationsForJourney.length,
        completedAt,
      };
    })
    .filter((journey): journey is NonNullable<typeof journey> => journey !== null)
    .sort((left, right) => {
      const leftTime = Date.parse(left.completedAt);
      const rightTime = Date.parse(right.completedAt);

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.journeyId - right.journeyId;
    });

  await database.withTransactionAsync(async () => {
    for (const discovery of discoveredLocations) {
      const matchingCandidate = candidateLocations.find(
        (candidate) => candidate.location.id === discovery.locationId,
      );

      await database.runAsync(
        `
          INSERT OR IGNORE INTO location_discoveries (
            userId,
            locationId,
            title,
            discoveredAt,
            distanceMeters
          ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          discovery.locationId,
          discovery.title ?? null,
          discovery.discoveredAt,
          matchingCandidate
            ? roundDistanceMeters(matchingCandidate.distanceMeters)
            : null,
        ],
      );

      await database.runAsync(
        `
          INSERT OR IGNORE INTO pending_location_discoveries (
            userId,
            locationId,
            discoveredAt,
            latitude,
            longitude,
            accuracyMeters
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          discovery.locationId,
          discovery.discoveredAt,
          latitude,
          longitude,
          accuracyMeters,
        ],
      );
    }

    for (const completion of completedJourneys) {
      await database.runAsync(
        `
          INSERT OR IGNORE INTO journey_completions (
            userId,
            journeyId,
            title,
            totalLocations,
            completedAt
          ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          completion.journeyId,
          completion.title ?? null,
          completion.totalLocations ?? null,
          completion.completedAt,
        ],
      );
    }
  });

  return buildDiscoveryCheckResponse({
    accuracyValid: true,
    checkedAt,
    maxAllowedAccuracyMeters,
    discoveryRadiusMeters,
    discoveredLocations,
    completedJourneys,
  });
}

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

export async function getActiveItems(userId: string) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();

  return database.getAllAsync<ActiveItemRow>(
    `
      SELECT
        id,
        user_id AS userId,
        item_type AS itemType,
        item_id AS itemId,
        created_at AS createdAt
      FROM active_items
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );
}

export async function getActiveItem(
  userId: string,
  itemType: ActiveItemType,
  itemId: number,
) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();

  return database.getFirstAsync<ActiveItemRow>(
    `
      SELECT
        id,
        user_id AS userId,
        item_type AS itemType,
        item_id AS itemId,
        created_at AS createdAt
      FROM active_items
      WHERE user_id = ?
        AND item_type = ?
        AND item_id = ?
    `,
    [userId, itemType, itemId],
  );
}

export async function markActiveItem({
  userId,
  itemType,
  itemId,
  createdAt = new Date().toISOString(),
}: {
  userId: string;
  itemType: ActiveItemType;
  itemId: number;
  createdAt?: string;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO active_items (
        user_id,
        item_type,
        item_id,
        created_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, item_type, item_id)
      DO UPDATE SET created_at = excluded.created_at
    `,
    [userId, itemType, itemId, createdAt],
  );

  return getActiveItem(userId, itemType, itemId);
}

export async function clearActiveItem(
  userId: string,
  itemType: ActiveItemType,
  itemId: number,
) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM active_items
      WHERE user_id = ?
        AND item_type = ?
        AND item_id = ?
    `,
    [userId, itemType, itemId],
  );
}

export async function clearActiveItems(userId: string) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM active_items
      WHERE user_id = ?
    `,
    [userId],
  );
}

export async function clearHydratedUserProgress(userId: string) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    // Profile totals and recent activity are derived from these hydrated
    // progress tables, and active_items is also user-scoped local state.
    await database.runAsync(
      `
        DELETE FROM location_discoveries
        WHERE userId = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM journey_completions
        WHERE userId = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM active_items
        WHERE user_id = ?
      `,
      [userId],
    );
  });
}

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

export async function getCachedDiscoveryProgressSummary(
  userId: string | null | undefined,
): Promise<DiscoveryProgressSummary> {
  if (!userId) {
    return {
      locationsVisited: 0,
      journeysCompleted: 0,
      recentActivity: [],
    };
  }

  const database = await getDatabase();
  const [locationCountRow, journeyCountRow, recentActivityRows] =
    await Promise.all([
      database.getFirstAsync<CountRow>(
        `
          SELECT COUNT(*) AS count
          FROM location_discoveries
          WHERE userId = ?
        `,
        [userId],
      ),
      database.getFirstAsync<CountRow>(
        `
          SELECT COUNT(*) AS count
          FROM journey_completions
          WHERE userId = ?
        `,
        [userId],
      ),
      database.getAllAsync<ActivityRow>(
        `
          SELECT
            locationId AS entityId,
            title,
            discoveredAt AS occurredAt,
            NULL AS detail,
            'location' AS kind
          FROM location_discoveries
          WHERE userId = ?

          UNION ALL

          SELECT
            journeyId AS entityId,
            title,
            completedAt AS occurredAt,
            CASE
              WHEN totalLocations IS NOT NULL AND totalLocations > 0
                THEN totalLocations || ' stops completed'
              ELSE 'Journey completed'
            END AS detail,
            'journey' AS kind
          FROM journey_completions
          WHERE userId = ?

          ORDER BY occurredAt DESC
          LIMIT ${RECENT_ACTIVITY_LIMIT}
        `,
        [userId, userId],
      ),
    ]);

  return {
    locationsVisited: Number(locationCountRow?.count ?? 0),
    journeysCompleted: Number(journeyCountRow?.count ?? 0),
    recentActivity: recentActivityRows.map((row) => ({
      kind: row.kind,
      entityId: row.entityId,
      title: normalizeTitle(row.title, row.kind),
      occurredAt: row.occurredAt,
      detail:
        row.detail ??
        (row.kind === "location" ? "Location discovered" : "Journey completed"),
    })),
  };
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
    `);
  }

  return database;
}

async function getLocationDiscoveriesForIds(
  database: SQLite.SQLiteDatabase,
  userId: string,
  locationIds: number[],
) {
  if (locationIds.length === 0) {
    return [];
  }

  const placeholders = buildPlaceholders(locationIds.length);

  return database.getAllAsync<LocationDiscoveryRow>(
    `
      SELECT locationId, discoveredAt
      FROM location_discoveries
      WHERE userId = ?
        AND locationId IN (${placeholders})
    `,
    [userId, ...locationIds],
  );
}

async function getJourneyCompletionsForIds(
  database: SQLite.SQLiteDatabase,
  userId: string,
  journeyIds: number[],
) {
  if (journeyIds.length === 0) {
    return [];
  }

  const placeholders = buildPlaceholders(journeyIds.length);

  return database.getAllAsync<JourneyCompletionRow>(
    `
      SELECT journeyId, completedAt
      FROM journey_completions
      WHERE userId = ?
        AND journeyId IN (${placeholders})
    `,
    [userId, ...journeyIds],
  );
}

async function getOptionalPendingQueueCount(
  database: SQLite.SQLiteDatabase,
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
  database: SQLite.SQLiteDatabase,
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

function normalizeTitle(title: string | null, kind: "location" | "journey") {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return kind === "location" ? "Untitled location" : "Untitled journey";
}

function normalizeLocationTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return "Untitled location";
}

function normalizeJourneyTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return "Untitled journey";
}

function getLatestDiscoveredAt(discoveredAts: string[]) {
  let latestDiscoveredAt = discoveredAts[0] ?? new Date().toISOString();

  for (const discoveredAt of discoveredAts) {
    if (Date.parse(discoveredAt) > Date.parse(latestDiscoveredAt)) {
      latestDiscoveredAt = discoveredAt;
    }
  }

  return latestDiscoveredAt;
}

function roundDistanceMeters(distanceMeters: number) {
  return Math.round(distanceMeters * 100) / 100;
}

function hasValidCoordinates(point: {
  latitude: number;
  longitude: number;
}) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function calculateDistanceMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * arc;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function buildDiscoveryCheckResponse({
  accuracyValid,
  checkedAt,
  maxAllowedAccuracyMeters,
  discoveryRadiusMeters,
  discoveredLocations,
  completedJourneys,
}: {
  accuracyValid: boolean;
  checkedAt: string;
  maxAllowedAccuracyMeters: number;
  discoveryRadiusMeters: number;
  discoveredLocations: DiscoveryCheckResponse["discoveredLocations"];
  completedJourneys: DiscoveryCheckResponse["completedJourneys"];
}): DiscoveryCheckResponse {
  return {
    accuracyValid,
    maxAllowedAccuracyMeters,
    discoveryRadiusMeters,
    discoveredLocationCount: discoveredLocations.length,
    completedJourneyCount: completedJourneys.length,
    discoveredLocations,
    completedJourneys,
    checkedAt,
  };
}

function getCreateLocationDiscoveriesTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} location_discoveries (
      userId TEXT NOT NULL,
      locationId INTEGER NOT NULL,
      title TEXT,
      discoveredAt TEXT NOT NULL,
      distanceMeters REAL,
      PRIMARY KEY (userId, locationId)
    );
  `;
}

function getCreateJourneyCompletionsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journey_completions (
      userId TEXT NOT NULL,
      journeyId INTEGER NOT NULL,
      title TEXT,
      totalLocations INTEGER,
      completedAt TEXT NOT NULL,
      PRIMARY KEY (userId, journeyId)
    );
  `;
}

function getCreatePendingOfflineDiscoveriesTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} pending_location_discoveries (
      userId TEXT NOT NULL,
      locationId INTEGER NOT NULL,
      discoveredAt TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracyMeters REAL NOT NULL,
      PRIMARY KEY (userId, locationId)
    );
  `;
}

function getCreateActiveItemsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} active_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('LOCATION', 'JOURNEY')),
      item_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, item_type, item_id)
    );
  `;
}

function getCreateLocationDiscoveriesIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_location_discoveries_user_discoveredAt
      ON location_discoveries (userId, discoveredAt DESC);
  `;
}

function getCreateJourneyCompletionsIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_journey_completions_user_completedAt
      ON journey_completions (userId, completedAt DESC);
  `;
}

function getCreatePendingOfflineDiscoveriesIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_pending_location_discoveries_user_discoveredAt
      ON pending_location_discoveries (userId, discoveredAt ASC);
  `;
}

function getCreateActiveItemsCreatedAtIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_active_items_user_created_at
      ON active_items (user_id, created_at DESC);
  `;
}
