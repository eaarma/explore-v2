export type DiscoveryBannerTone = "success" | "warning" | "error";

export type DiscoveryBanner = {
  tone: DiscoveryBannerTone;
  text: string;
};

export type ActiveTripMapContext = {
  tripId: number;
  tripName: string;
  locationIds: Set<number>;
  journeyIds: Set<number>;
  totalCount: number;
};

export type SelectedJourneyMapContext = {
  bounds: [number, number, number, number] | null;
  journeyId: number;
  locationIds: Set<number>;
};
