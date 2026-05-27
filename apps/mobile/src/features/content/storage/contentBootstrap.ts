import {
  getSyncMetadataValue,
  getTableCount,
  LAST_CONTENT_SYNC_AT_KEY,
  LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY,
} from "@/src/shared/storage/contentCache/metadataStore";
import {
  syncActiveContentCache,
  syncJourneyLocationsCache,
} from "@/src/features/content/storage/contentSync";

export type BootstrapResult = {
  didBootstrap: boolean;
};

export async function bootstrapContentCacheIfNeeded(): Promise<BootstrapResult> {
  const [lastContentSyncAt, locationCount, journeyCount] = await Promise.all([
    getSyncMetadataValue(LAST_CONTENT_SYNC_AT_KEY),
    getTableCount("locations"),
    getTableCount("journeys"),
  ]);

  const shouldBootstrap =
    !lastContentSyncAt || locationCount === 0 || journeyCount === 0;

  if (!shouldBootstrap) {
    return {
      didBootstrap: false,
    };
  }

  await syncActiveContentCache();

  return {
    didBootstrap: true,
  };
}

export async function bootstrapJourneyLocationsCacheIfNeeded(): Promise<BootstrapResult> {
  const [lastJourneyLocationsSyncAt, journeyCount, journeyLocationCount] =
    await Promise.all([
      getSyncMetadataValue(LAST_JOURNEY_LOCATIONS_SYNC_AT_KEY),
      getTableCount("journeys"),
      getTableCount("journey_locations"),
    ]);

  const shouldBootstrapJourneyLocations =
    !lastJourneyLocationsSyncAt ||
    (journeyCount > 0 && journeyLocationCount === 0);

  if (!shouldBootstrapJourneyLocations) {
    return {
      didBootstrap: false,
    };
  }

  await syncJourneyLocationsCache();

  return {
    didBootstrap: true,
  };
}
