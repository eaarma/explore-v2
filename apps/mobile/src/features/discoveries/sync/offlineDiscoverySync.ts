import { syncOfflineDiscoveries } from "@/src/features/discoveries/api/discoveriesApi";
import {
  DISCOVERY_RADIUS_METERS,
  REQUIRED_DISCOVERY_ACCURACY_METERS,
} from "@/src/features/discoveries/discoveryConfig";
import {
  cacheDiscoveryCheckResult,
  clearPendingOfflineDiscoveries,
  getPendingOfflineDiscoveries,
} from "@/src/features/discoveries/storage/discoveryCache";
import { DiscoveryCheckResponse } from "@/src/features/discoveries/types/discoveryTypes";

export async function syncPendingOfflineDiscoveries(
  userId: string,
): Promise<DiscoveryCheckResponse> {
  const pendingDiscoveries = await getPendingOfflineDiscoveries(userId);

  if (pendingDiscoveries.length === 0) {
    return {
      accuracyValid: true,
      maxAllowedAccuracyMeters: REQUIRED_DISCOVERY_ACCURACY_METERS,
      discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
      discoveredLocationCount: 0,
      completedJourneyCount: 0,
      discoveredLocations: [],
      completedJourneys: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const result = await syncOfflineDiscoveries({
    discoveries: pendingDiscoveries.map((discovery) => ({
      locationId: discovery.locationId,
      discoveredAt: discovery.discoveredAt,
      latitude: discovery.latitude,
      longitude: discovery.longitude,
      accuracyMeters: discovery.accuracyMeters,
    })),
  });

  await cacheDiscoveryCheckResult(userId, result);
  await clearPendingOfflineDiscoveries(
    userId,
    pendingDiscoveries.map((discovery) => discovery.locationId),
  );

  return result;
}
