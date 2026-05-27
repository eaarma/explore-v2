import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";

export type Trip = {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
};

export type TripLocation = {
  id: number;
  tripId: number;
  locationId: number;
  sortOrder: number;
  createdAt: string;
};

export type TripJourney = {
  id: number;
  tripId: number;
  journeyId: number;
  sortOrder: number;
  createdAt: string;
};

export type ResolvedTripItem =
  | {
      key: string;
      kind: "location";
      relationId: number;
      sortOrder: number;
      createdAt: string;
      completed: boolean;
      title: string;
      location: Location;
    }
  | {
      key: string;
      kind: "journey";
      relationId: number;
      sortOrder: number;
      createdAt: string;
      completed: boolean;
      title: string;
      journey: Journey;
    };

export type ResolvedTrip = Trip & {
  completedCount: number;
  totalCount: number;
  isMapActive: boolean;
  locationCount: number;
  journeyCount: number;
  items: ResolvedTripItem[];
  locations: {
    key: string;
    location: Location;
    sortOrder: number;
  }[];
  journeys: {
    key: string;
    journey: Journey;
    sortOrder: number;
  }[];
};
