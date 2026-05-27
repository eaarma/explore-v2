import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";
import type {
  DiscoveryCheckResponse,
  DiscoveryJourneyCompletionResult,
  DiscoveryLocationResult,
  DiscoveryProgressSummary,
} from "@/src/features/discoveries/types/discoveryTypes";

const RECENT_ACTIVITY_LIMIT = 5;

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

function normalizeTitle(title: string | null, kind: "location" | "journey") {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return kind === "location" ? "Untitled location" : "Untitled journey";
}
