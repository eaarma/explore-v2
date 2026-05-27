export type DiscoveryCheckRequest = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

export type OfflineDiscoveryCandidate = {
  locationId: number;
  discoveredAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

export type OfflineDiscoverySyncRequest = {
  discoveries: OfflineDiscoveryCandidate[];
};

export type DiscoveryLocationResult = {
  locationId: number;
  title: string;
  distanceMeters: number | null;
  discoveredAt: string;
};

export type DiscoveryJourneyCompletionResult = {
  journeyId: number;
  title: string;
  totalLocations: number;
  completedAt: string;
};

export type DiscoveryCheckResponse = {
  accuracyValid: boolean;
  maxAllowedAccuracyMeters: number;
  discoveryRadiusMeters: number;
  discoveredLocationCount: number;
  completedJourneyCount: number;
  discoveredLocations: DiscoveryLocationResult[];
  completedJourneys: DiscoveryJourneyCompletionResult[];
  checkedAt: string;
};

export type DiscoveryActivityItem = {
  kind: "location" | "journey";
  entityId: number;
  title: string;
  occurredAt: string;
  detail: string;
};

export type DiscoveryProgressSummary = {
  locationsVisited: number;
  journeysCompleted: number;
  recentActivity: DiscoveryActivityItem[];
};
