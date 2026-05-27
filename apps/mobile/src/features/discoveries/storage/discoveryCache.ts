import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";

export { initializeDiscoveryCache } from "@/src/features/discoveries/storage/discoveryCache/db";
export {
  clearActiveItem,
  clearActiveItems,
  getActiveItem,
  getActiveItems,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache/activeItemsStore";
export type {
  ActiveItem,
  ActiveItemType,
} from "@/src/features/discoveries/storage/discoveryCache/activeItemsStore";
export {
  captureOfflineDiscoveryCheck,
} from "@/src/features/discoveries/storage/discoveryCache/offlineDiscoveryCapture";
export {
  clearPendingOfflineDiscoveries,
  getPendingOfflineDiscoveries,
  getPendingOfflineProgressSummary,
} from "@/src/features/discoveries/storage/discoveryCache/offlineDiscoveryStore";
export type {
  PendingOfflineDiscovery,
  PendingOfflineProgressSummary,
} from "@/src/features/discoveries/storage/discoveryCache/offlineDiscoveryStore";
export {
  cacheDiscoveryCheckResult,
  getCachedDiscoveryProgressSummary,
  upsertDiscoveryProgressSnapshot,
} from "@/src/features/discoveries/storage/discoveryCache/progressStore";
export {
  hydrateJourneyWithProgress,
  hydrateJourneysWithProgress,
  hydrateLocationWithProgress,
  hydrateLocationsWithProgress,
} from "@/src/features/discoveries/storage/discoveryCache/hydration";
export {
  addJourneyToTrip,
  addLocationToTrip,
  clearActiveTripSelection,
  createTrip,
  getActiveTripSelection,
  getTrip,
  getTripJourneys,
  getTripLocations,
  getTrips,
  removeJourneyFromTrip,
  removeLocationFromTrip,
  reorderTripItems,
  setActiveTripSelection,
} from "@/src/features/discoveries/storage/discoveryCache/tripsStore";
export type {
  ActiveTripSelection,
  TripItemOrderInput,
} from "@/src/features/discoveries/storage/discoveryCache/tripsStore";

export async function clearHydratedUserProgress(userId: string) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    // Profile totals and recent activity are derived from these hydrated
    // progress tables. Active items and trips are also user-scoped local state.
    await database.runAsync(
      `
        DELETE FROM location_discoveries
        WHERE userId = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM journey_completions
        WHERE userId = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM active_items
        WHERE user_id = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM trip_locations
        WHERE trip_id IN (
          SELECT id
          FROM trips
          WHERE user_id = ?
        )
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM trip_journeys
        WHERE trip_id IN (
          SELECT id
          FROM trips
          WHERE user_id = ?
        )
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM trips
        WHERE user_id = ?
      `,
      [userId],
    );

    await database.runAsync(
      `
        DELETE FROM active_trip_selection
        WHERE user_id = ?
      `,
      [userId],
    );
  });
}
