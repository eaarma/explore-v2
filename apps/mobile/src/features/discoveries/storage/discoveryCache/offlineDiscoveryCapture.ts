import { getCachedJourneyLocations } from "@/src/shared/storage/contentCache";
import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";
import {
  DISCOVERY_RADIUS_METERS,
  REQUIRED_DISCOVERY_ACCURACY_METERS,
} from "@/src/features/discoveries/discoveryConfig";
import type { DiscoveryCheckResponse } from "@/src/features/discoveries/types/discoveryTypes";
import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";

const DEFAULT_MAX_ALLOWED_ACCURACY_METERS = REQUIRED_DISCOVERY_ACCURACY_METERS;
const DEFAULT_DISCOVERY_RADIUS_METERS = DISCOVERY_RADIUS_METERS;

type LocationDiscoveryRow = {
  locationId: number;
  discoveredAt: string;
};

type JourneyCompletionRow = {
  journeyId: number;
  completedAt: string;
};

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

async function getLocationDiscoveriesForIds(
  database: Awaited<ReturnType<typeof getDatabase>>,
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
  database: Awaited<ReturnType<typeof getDatabase>>,
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

function buildPlaceholders(count: number) {
  return new Array(count).fill("?").join(", ");
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
