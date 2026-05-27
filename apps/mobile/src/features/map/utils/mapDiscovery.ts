import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import { calculateDistanceMeters } from "@/src/features/map/utils/mapMath";

const DISCOVERY_CHECK_MIN_DISTANCE_METERS = 25;
const DISCOVERY_CHECK_MIN_INTERVAL_MS = 20_000;
const DISCOVERY_WARNING_COOLDOWN_MS = 60_000;

export function shouldTriggerDiscoveryCheck(
  lastCheck: { latitude: number; longitude: number; at: number } | null,
  latitude: number,
  longitude: number,
) {
  if (!lastCheck) {
    return true;
  }

  const elapsedMs = Date.now() - lastCheck.at;
  if (elapsedMs >= DISCOVERY_WARNING_COOLDOWN_MS) {
    return true;
  }

  if (elapsedMs < DISCOVERY_CHECK_MIN_INTERVAL_MS) {
    return false;
  }

  return (
    calculateDistanceMeters(
      lastCheck.latitude,
      lastCheck.longitude,
      latitude,
      longitude,
    ) >= DISCOVERY_CHECK_MIN_DISTANCE_METERS
  );
}

export function shouldShowDiscoveryFeedback(lastShownAt: number) {
  return Date.now() - lastShownAt >= DISCOVERY_WARNING_COOLDOWN_MS;
}

export function applyDiscoveryResultsToLocations(
  locations: Location[],
  discoveries: {
    locationId: number;
    discoveredAt: string;
  }[],
) {
  if (discoveries.length === 0) {
    return locations;
  }

  const discoveredAtByLocationId = new Map(
    discoveries.map(
      (discovery) => [discovery.locationId, discovery.discoveredAt] as const,
    ),
  );

  return locations.map((location) => {
    const discoveredAt = discoveredAtByLocationId.get(location.id);

    if (!discoveredAt) {
      return location;
    }

    return {
      ...location,
      discovered: true,
      discoveredAt,
    };
  });
}

export function applyDiscoveryResultsToJourneys(
  journeys: Journey[],
  completedJourneys: {
    journeyId: number;
    completedAt: string;
  }[],
) {
  if (completedJourneys.length === 0) {
    return journeys;
  }

  const completedAtByJourneyId = new Map(
    completedJourneys.map(
      (journey) => [journey.journeyId, journey.completedAt] as const,
    ),
  );

  return journeys.map((journey) => {
    const completedAt = completedAtByJourneyId.get(journey.id);

    if (!completedAt) {
      return journey;
    }

    return {
      ...journey,
      completed: true,
      completedAt,
    };
  });
}
