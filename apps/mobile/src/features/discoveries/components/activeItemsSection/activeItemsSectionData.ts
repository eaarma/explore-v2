import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import {
  getActiveItems,
  hydrateJourneysWithProgress,
  hydrateLocationsWithProgress,
} from "@/src/features/discoveries/storage/discoveryCache";
import type { ActiveListItem } from "@/src/features/discoveries/components/activeItemsSection/activeItemsSectionTypes";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  getCachedJourneyById,
  getCachedJourneyLocationsByJourneyId,
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import type { TripItemPickerCandidate } from "@/src/features/trips/components/TripItemPickerModal";
import type { ResolvedTrip } from "@/src/features/trips/types/tripTypes";

export async function resolveActiveListItems(
  userId: string | null | undefined,
) {
  if (!userId) {
    return [];
  }

  await initializeContentCache();

  try {
    await bootstrapContentCacheIfNeeded();
  } catch {
    // Keep using whatever is already cached locally.
  }

  try {
    await bootstrapJourneyLocationsCacheIfNeeded();
  } catch {
    // Missing journey stop previews should not block the Active tab.
  }

  const activeRows = await getActiveItems(userId);

  if (activeRows.length === 0) {
    return [];
  }

  const locationIds = activeRows
    .filter((row) => row.itemType === "LOCATION")
    .map((row) => row.itemId);
  const journeyIds = activeRows
    .filter((row) => row.itemType === "JOURNEY")
    .map((row) => row.itemId);

  const [cachedLocations, cachedJourneys, journeyLocationRows] =
    await Promise.all([
      Promise.all(
        locationIds.map((locationId) => getCachedLocationById(locationId)),
      ),
      Promise.all(journeyIds.map((journeyId) => getCachedJourneyById(journeyId))),
      Promise.all(
        journeyIds.map(
          async (journeyId) =>
            [
              journeyId,
              await getCachedJourneyLocationsByJourneyId(journeyId),
            ] as const,
        ),
      ),
    ]);

  const [hydratedLocations, hydratedJourneys] = await Promise.all([
    hydrateLocationsWithProgress(
      userId,
      cachedLocations.filter(
        (location): location is Location => Boolean(location),
      ),
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
  const journeyMetaById = new Map(
    journeyLocationRows.map(([journeyId, journeyLocations]) => [
      journeyId,
      buildJourneyMeta(journeyLocations),
    ]),
  );

  return activeRows.flatMap<ActiveListItem>((activeRow) => {
    if (activeRow.itemType === "LOCATION") {
      const location = locationsById.get(activeRow.itemId);

      if (!location) {
        return [];
      }

      return [
        {
          key: `location:${location.id}`,
          kind: "location",
          activeAt: activeRow.createdAt,
          location,
        },
      ];
    }

    const journey = journeysById.get(activeRow.itemId);

    if (!journey) {
      return [];
    }

    const journeyMeta = journeyMetaById.get(journey.id) ?? {
      stopCount: 0,
      previewImageUrl: null,
    };

    return [
      {
        key: `journey:${journey.id}`,
        kind: "journey",
        activeAt: activeRow.createdAt,
        journey,
        stopCount: journeyMeta.stopCount,
        previewImageUrl: journeyMeta.previewImageUrl,
      },
    ];
  });
}

export function buildTripItemPickerCandidates(
  activeItems: ActiveListItem[],
  trip: ResolvedTrip | null,
) {
  if (!trip) {
    return [];
  }

  const locationIdsInTrip = new Set(
    trip.locations.map((tripLocation) => tripLocation.location.id),
  );
  const journeyIdsInTrip = new Set(
    trip.journeys.map((tripJourney) => tripJourney.journey.id),
  );
  const candidatesByKey = new Map<string, TripItemPickerCandidate>();

  for (const tripItem of trip.items) {
    if (tripItem.kind === "location") {
      const location = tripItem.location;

      candidatesByKey.set(`location:${location.id}`, {
        key: `location:${location.id}`,
        kind: "location",
        title: location.title,
        meta: buildTripPickerMeta(location.county, location.category),
        status: buildTripPickerStatus(true, location.active === true),
        isInTrip: true,
        locationId: location.id,
      });
      continue;
    }

    const journey = tripItem.journey;
    candidatesByKey.set(`journey:${journey.id}`, {
      key: `journey:${journey.id}`,
      kind: "journey",
      title: journey.title,
      meta: buildTripPickerMeta(journey.county, journey.category),
      status: buildTripPickerStatus(true, journey.active === true),
      isInTrip: true,
      journeyId: journey.id,
    });
  }

  for (const activeItem of activeItems) {
    if (activeItem.kind === "location") {
      const location = activeItem.location;

      candidatesByKey.set(`location:${location.id}`, {
        key: `location:${location.id}`,
        kind: "location",
        title: location.title,
        meta: buildTripPickerMeta(location.county, location.category),
        status: buildTripPickerStatus(
          locationIdsInTrip.has(location.id),
          true,
        ),
        isInTrip: locationIdsInTrip.has(location.id),
        locationId: location.id,
      });
      continue;
    }

    const journey = activeItem.journey;
    candidatesByKey.set(`journey:${journey.id}`, {
      key: `journey:${journey.id}`,
      kind: "journey",
      title: journey.title,
      meta: buildTripPickerMeta(journey.county, journey.category),
      status: buildTripPickerStatus(journeyIdsInTrip.has(journey.id), true),
      isInTrip: journeyIdsInTrip.has(journey.id),
      journeyId: journey.id,
    });
  }

  return [...candidatesByKey.values()].sort(compareTripItemPickerCandidates);
}

export function formatCount(count: number, label: string) {
  if (count === 1) {
    return `1 ${label}`;
  }

  return `${count} ${label}s`;
}

function buildJourneyMeta(
  journeyLocations: {
    imageUrl: string | null;
  }[],
) {
  let previewImageUrl: string | null = null;

  for (const journeyLocation of journeyLocations) {
    if (!previewImageUrl && journeyLocation.imageUrl) {
      previewImageUrl = journeyLocation.imageUrl;
    }
  }

  return {
    stopCount: journeyLocations.length,
    previewImageUrl,
  };
}

function buildTripPickerMeta(
  county: string | null | undefined,
  category: string,
) {
  const normalizedCounty =
    typeof county === "string" && county.trim().length > 0
      ? county.trim()
      : "County unknown";

  return `${normalizedCounty} | ${category}`;
}

function buildTripPickerStatus(isInTrip: boolean, isActive: boolean) {
  if (isInTrip && isActive) {
    return "In trip | Active";
  }

  if (isInTrip) {
    return "In trip only";
  }

  return "Active only";
}

function compareTripItemPickerCandidates(
  left: TripItemPickerCandidate,
  right: TripItemPickerCandidate,
) {
  if (left.isInTrip !== right.isInTrip) {
    return left.isInTrip ? -1 : 1;
  }

  if (left.kind !== right.kind) {
    return left.kind.localeCompare(right.kind);
  }

  return left.title.localeCompare(right.title);
}
