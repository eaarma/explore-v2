import {
  hydrateJourneysWithProgress,
  hydrateLocationsWithProgress,
} from "@/src/features/discoveries/storage/discoveryCache";
import { getAllJourneys } from "@/src/features/journeys/api/journeysApi";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { getAllLocations } from "@/src/features/locations/api/locationsApi";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  coerceCoordinate,
  hasValidCoordinates,
} from "@/src/features/map/utils/mapFeatureCollection";
import { cacheActiveContent } from "@/src/shared/storage/contentCache";

export async function loadLiveMapData() {
  const [locationsResult, journeysResult] = await Promise.allSettled([
    getAllLocations(),
    getAllJourneys(),
  ]);

  const locations =
    locationsResult.status === "fulfilled"
      ? normalizeMapPoints(locationsResult.value).filter(hasValidCoordinates)
      : [];
  const journeys =
    journeysResult.status === "fulfilled"
      ? normalizeMapPoints(journeysResult.value).filter(hasValidCoordinates)
      : [];

  if (
    locationsResult.status === "fulfilled" &&
    journeysResult.status === "fulfilled"
  ) {
    try {
      await cacheActiveContent({
        locations: locationsResult.value,
        journeys: journeysResult.value,
      });
    } catch {
      // Keep showing live content even if persisting it fails.
    }
  }

  return {
    locations,
    journeys,
    locationsResult,
    journeysResult,
  };
}

export async function hydrateMapContent(
  locations: Location[],
  journeys: Journey[],
  userId: string | null | undefined,
) {
  const [hydratedLocations, hydratedJourneys] = await Promise.all([
    hydrateLocationsWithProgress(userId, locations),
    hydrateJourneysWithProgress(userId, journeys),
  ]);

  return {
    locations: normalizeMapPoints(hydratedLocations).filter(hasValidCoordinates),
    journeys: normalizeMapPoints(hydratedJourneys).filter(hasValidCoordinates),
  };
}

export function resolveVisibleMapDataError(
  locationsResult: PromiseSettledResult<Location[]>,
  journeysResult: PromiseSettledResult<Journey[]>,
  visibleLocationCount: number,
  visibleJourneyCount: number,
) {
  const locationFailed =
    locationsResult.status === "rejected" && visibleLocationCount === 0;
  const journeyFailed =
    journeysResult.status === "rejected" && visibleJourneyCount === 0;

  if (locationFailed && journeyFailed) {
    return "Could not load locations or journeys.";
  }

  if (locationFailed) {
    return "Could not load locations.";
  }

  if (journeyFailed) {
    return "Could not load journeys.";
  }

  return null;
}

function normalizeMapPoints<
  T extends {
    latitude: number | string | null | undefined;
    longitude: number | string | null | undefined;
  },
>(points: T[]) {
  return points.map((point) => {
    const latitude = coerceCoordinate(point.latitude);
    const longitude = coerceCoordinate(point.longitude);

    return {
      ...point,
      latitude: latitude ?? point.latitude,
      longitude: longitude ?? point.longitude,
    };
  }) as T[];
}
