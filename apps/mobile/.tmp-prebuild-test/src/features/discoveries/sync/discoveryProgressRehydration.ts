import {
  getCurrentUserDiscoveries,
  getCurrentUserJourneyCompletions,
} from "@/src/features/discoveries/api/discoveriesApi";
import {
  initializeDiscoveryCache,
  upsertDiscoveryProgressSnapshot,
} from "@/src/features/discoveries/storage/discoveryCache";

export async function rehydrateDiscoveryProgressFromBackend(userId: string) {
  if (!userId) {
    return;
  }

  await initializeDiscoveryCache();

  const [discoveredLocations, completedJourneys] = await Promise.all([
    getCurrentUserDiscoveries(),
    getCurrentUserJourneyCompletions(),
  ]);

  await upsertDiscoveryProgressSnapshot(userId, {
    discoveredLocations,
    completedJourneys,
  });
}
