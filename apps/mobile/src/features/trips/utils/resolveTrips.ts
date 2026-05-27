import {
  getActiveTripSelection,
  getTripJourneys,
  getTripLocations,
  getTrips,
  hydrateJourneysWithProgress,
  hydrateLocationsWithProgress,
} from "@/src/features/discoveries/storage/discoveryCache";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import type {
  ResolvedTrip,
  ResolvedTripItem,
} from "@/src/features/trips/types/tripTypes";
import {
  bootstrapContentCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import {
  getCachedJourneyById,
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";

export async function resolveTrips(userId: string | null | undefined) {
  if (!userId) {
    return [];
  }

  await initializeContentCache();

  try {
    await bootstrapContentCacheIfNeeded();
  } catch {
    // Keep using whatever is already cached locally.
  }

  const [trips, activeTripSelection] = await Promise.all([
    getTrips(userId),
    getActiveTripSelection(userId),
  ]);

  if (trips.length === 0) {
    return [];
  }

  const tripLocationsByTripId = new Map(
    await Promise.all(
      trips.map(async (trip) => [trip.id, await getTripLocations(userId, trip.id)] as const),
    ),
  );
  const tripJourneysByTripId = new Map(
    await Promise.all(
      trips.map(async (trip) => [trip.id, await getTripJourneys(userId, trip.id)] as const),
    ),
  );

  const locationIds = new Set<number>();
  const journeyIds = new Set<number>();

  for (const tripLocations of tripLocationsByTripId.values()) {
    for (const tripLocation of tripLocations) {
      locationIds.add(tripLocation.locationId);
    }
  }

  for (const tripJourneys of tripJourneysByTripId.values()) {
    for (const tripJourney of tripJourneys) {
      journeyIds.add(tripJourney.journeyId);
    }
  }

  const [cachedLocations, cachedJourneys] = await Promise.all([
    Promise.all(
      [...locationIds].map((locationId) => getCachedLocationById(locationId)),
    ),
    Promise.all(
      [...journeyIds].map((journeyId) => getCachedJourneyById(journeyId)),
    ),
  ]);

  const [hydratedLocations, hydratedJourneys] = await Promise.all([
    hydrateLocationsWithProgress(
      userId,
      cachedLocations.filter((location): location is Location => Boolean(location)),
    ),
    hydrateJourneysWithProgress(
      userId,
      cachedJourneys.filter((journey): journey is Journey => Boolean(journey)),
    ),
  ]);

  const locationsById = new Map(
    hydratedLocations.map((location) => [location.id, location] as const),
  );
  const journeysById = new Map(
    hydratedJourneys.map((journey) => [journey.id, journey] as const),
  );

  return trips.map<ResolvedTrip>((trip) => {
    const tripItems = [
      ...(tripLocationsByTripId.get(trip.id) ?? []).flatMap<ResolvedTripItem>(
        (tripLocation) => {
          const location = locationsById.get(tripLocation.locationId);

          if (!location) {
            return [];
          }

          return [
            {
              key: `trip-location:${tripLocation.id}`,
              kind: "location",
              relationId: tripLocation.id,
              sortOrder: tripLocation.sortOrder,
              createdAt: tripLocation.createdAt,
              completed: location.discovered === true,
              title: normalizeLocationTitle(location.title),
              location,
            },
          ];
        },
      ),
      ...(tripJourneysByTripId.get(trip.id) ?? []).flatMap<ResolvedTripItem>(
        (tripJourney) => {
          const journey = journeysById.get(tripJourney.journeyId);

          if (!journey) {
            return [];
          }

          return [
            {
              key: `trip-journey:${tripJourney.id}`,
              kind: "journey",
              relationId: tripJourney.id,
              sortOrder: tripJourney.sortOrder,
              createdAt: tripJourney.createdAt,
              completed: journey.completed === true,
              title: normalizeJourneyTitle(journey.title),
              journey,
            },
          ];
        },
      ),
    ].sort(compareTripItems);

    return buildResolvedTrip(
      {
        ...trip,
        isMapActive: activeTripSelection?.tripId === trip.id,
      },
      tripItems,
    );
  });
}

export function buildResolvedTrip(
  trip: Pick<
    ResolvedTrip,
    | "id"
    | "userId"
    | "name"
    | "description"
    | "createdAt"
    | "updatedAt"
    | "isArchived"
    | "isMapActive"
  >,
  items: ResolvedTripItem[],
): ResolvedTrip {
  const orderedItems = items
    .map((item, index) => ({
      ...item,
      sortOrder: index,
    }))
    .sort(compareTripItems);
  const locations = orderedItems
    .flatMap((item) =>
      item.kind === "location"
        ? [
            {
              key: item.key,
              location: item.location,
              sortOrder: item.sortOrder,
            },
          ]
        : [],
    );
  const journeys = orderedItems
    .flatMap((item) =>
      item.kind === "journey"
        ? [
            {
              key: item.key,
              journey: item.journey,
              sortOrder: item.sortOrder,
            },
          ]
        : [],
    );
  const completedCount = orderedItems.filter((item) => item.completed).length;

  return {
    ...trip,
    completedCount,
    totalCount: orderedItems.length,
    isMapActive: trip.isMapActive === true,
    locationCount: locations.length,
    journeyCount: journeys.length,
    items: orderedItems,
    locations,
    journeys,
  };
}

function compareTripItems(left: ResolvedTripItem, right: ResolvedTripItem) {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  const createdAtDifference =
    Date.parse(left.createdAt) - Date.parse(right.createdAt);

  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return left.key.localeCompare(right.key);
}

function normalizeLocationTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled location";
  }

  return trimmedTitle;
}

function normalizeJourneyTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}
