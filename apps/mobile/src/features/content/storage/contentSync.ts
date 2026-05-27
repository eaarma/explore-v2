import { getActiveJourneys, getJourneyLocations } from "@/src/features/journeys/api/journeysApi";
import type { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { getActiveLocations } from "@/src/features/locations/api/locationsApi";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  getCachedJourneyLocations,
  getCachedJourneys,
} from "@/src/shared/storage/contentCache/contentReadStore";
import {
  cacheActiveContent,
  cacheJourneyLocations,
} from "@/src/shared/storage/contentCache/contentWriteStore";

export type SyncedActiveContent = {
  locations: Location[];
  journeys: Journey[];
};

export async function syncActiveContentCache(): Promise<SyncedActiveContent> {
  const [locations, journeys] = await Promise.all([
    getActiveLocations(),
    getActiveJourneys(),
  ]);

  await cacheActiveContent({
    locations,
    journeys,
  });

  return {
    locations,
    journeys,
  };
}

export async function syncJourneyLocationsCache(journeys?: Journey[]) {
  const sourceJourneys = journeys ?? (await getCachedJourneys());
  const journeyLocationsByJourney = await Promise.all(
    sourceJourneys.map((journey) => getJourneyLocations(journey.id)),
  );
  const journeyLocations = journeyLocationsByJourney.flat();

  await cacheJourneyLocations(journeyLocations);

  return journeyLocations;
}

export async function syncAllContentCaches() {
  const syncedContent = await syncActiveContentCache();
  let journeyLocations: JourneyLocation[] = [];

  try {
    journeyLocations = await syncJourneyLocationsCache(syncedContent.journeys);
  } catch {
    // Keep newly synced locations and journeys available even if the
    // journey-location backfill fails for one of the routes.
    try {
      journeyLocations = await getCachedJourneyLocations();
    } catch {
      journeyLocations = [];
    }
  }

  return {
    ...syncedContent,
    journeyLocations,
  };
}
