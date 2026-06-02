import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  DISCOVERY_RADIUS_METERS,
  REQUIRED_DISCOVERY_ACCURACY_METERS,
} from "@/src/features/discoveries/discoveryConfig";
import type {
  DiscoveryCheckResponse,
  OfflineDiscoveryCandidate,
  OfflineDiscoverySyncRequest,
} from "@/src/features/discoveries/types/discoveryTypes";

const mockCacheDiscoveryCheckResult = jest.fn(
  async (_userId: string, _result: DiscoveryCheckResponse) => undefined,
);
const mockClearPendingOfflineDiscoveries = jest.fn(
  async (_userId: string, _locationIds: number[]) => undefined,
);
const mockGetPendingOfflineDiscoveries = jest.fn(
  async (_userId: string) => [] as OfflineDiscoveryCandidate[],
);
const mockSyncOfflineDiscoveries = jest.fn(
  async (_request: OfflineDiscoverySyncRequest) =>
    ({
      accuracyValid: true,
      maxAllowedAccuracyMeters: REQUIRED_DISCOVERY_ACCURACY_METERS,
      discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
      discoveredLocationCount: 0,
      completedJourneyCount: 0,
      discoveredLocations: [],
      completedJourneys: [],
      checkedAt: new Date().toISOString(),
    }) as DiscoveryCheckResponse,
);

jest.mock("@/src/features/discoveries/api/discoveriesApi", () => ({
  syncOfflineDiscoveries: mockSyncOfflineDiscoveries,
}));

jest.mock("@/src/features/discoveries/storage/discoveryCache", () => ({
  cacheDiscoveryCheckResult: mockCacheDiscoveryCheckResult,
  clearPendingOfflineDiscoveries: mockClearPendingOfflineDiscoveries,
  getPendingOfflineDiscoveries: mockGetPendingOfflineDiscoveries,
}));

type OfflineDiscoverySyncModule = typeof import("./offlineDiscoverySync");

function loadOfflineDiscoverySync() {
  jest.resetModules();
  const module = jest.requireActual("./offlineDiscoverySync") as OfflineDiscoverySyncModule;
  return module.syncPendingOfflineDiscoveries;
}

beforeEach(() => {
  mockCacheDiscoveryCheckResult.mockImplementation(async () => undefined);
  mockClearPendingOfflineDiscoveries.mockImplementation(async () => undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("syncPendingOfflineDiscoveries", () => {
  it("returns an empty sync result when there is nothing pending", async () => {
    mockGetPendingOfflineDiscoveries.mockResolvedValue([]);
    const syncPendingOfflineDiscoveries = loadOfflineDiscoverySync();

    const result = await syncPendingOfflineDiscoveries("user-1");

    expect(mockSyncOfflineDiscoveries).not.toHaveBeenCalled();
    expect(mockCacheDiscoveryCheckResult).not.toHaveBeenCalled();
    expect(mockClearPendingOfflineDiscoveries).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        accuracyValid: true,
        maxAllowedAccuracyMeters: REQUIRED_DISCOVERY_ACCURACY_METERS,
        discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
        discoveredLocationCount: 0,
        completedJourneyCount: 0,
        discoveredLocations: [],
        completedJourneys: [],
      }),
    );
    expect(typeof result.checkedAt).toBe("string");
  });

  it("syncs pending discoveries, caches the result, and clears synced ids", async () => {
    const apiResult: DiscoveryCheckResponse = {
      accuracyValid: true,
      maxAllowedAccuracyMeters: REQUIRED_DISCOVERY_ACCURACY_METERS,
      discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
      discoveredLocationCount: 1,
      completedJourneyCount: 1,
      discoveredLocations: [
        {
          locationId: 5,
          title: "Waterfall",
          distanceMeters: 12.4,
          discoveredAt: "2026-06-03T00:00:00.000Z",
        },
      ],
      completedJourneys: [
        {
          journeyId: 8,
          title: "Nature Loop",
          totalLocations: 3,
          completedAt: "2026-06-03T00:05:00.000Z",
        },
      ],
      checkedAt: "2026-06-03T00:05:01.000Z",
    };

    mockGetPendingOfflineDiscoveries.mockResolvedValue([
      {
        locationId: 5,
        discoveredAt: "2026-06-03T00:00:00.000Z",
        latitude: 59.437,
        longitude: 24.7536,
        accuracyMeters: 12,
      },
      {
        locationId: 7,
        discoveredAt: "2026-06-03T00:03:00.000Z",
        latitude: 59.438,
        longitude: 24.7546,
        accuracyMeters: 18,
      },
    ]);
    mockSyncOfflineDiscoveries.mockResolvedValue(apiResult);

    const syncPendingOfflineDiscoveries = loadOfflineDiscoverySync();
    const result = await syncPendingOfflineDiscoveries("user-1");

    expect(mockSyncOfflineDiscoveries).toHaveBeenCalledWith({
      discoveries: [
        {
          locationId: 5,
          discoveredAt: "2026-06-03T00:00:00.000Z",
          latitude: 59.437,
          longitude: 24.7536,
          accuracyMeters: 12,
        },
        {
          locationId: 7,
          discoveredAt: "2026-06-03T00:03:00.000Z",
          latitude: 59.438,
          longitude: 24.7546,
          accuracyMeters: 18,
        },
      ],
    });
    expect(mockCacheDiscoveryCheckResult).toHaveBeenCalledWith("user-1", apiResult);
    expect(mockClearPendingOfflineDiscoveries).toHaveBeenCalledWith("user-1", [5, 7]);
    expect(result).toBe(apiResult);
  });
});
