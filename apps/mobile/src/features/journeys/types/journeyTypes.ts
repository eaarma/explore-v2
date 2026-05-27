import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";

export type Journey = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  county: string;
  category: string;
  experience: number;
  distance: number;
  difficulty: number;
  polyline: string | null;
  notes: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  completed?: boolean;
  completedAt?: string | null;
  active?: boolean;
  activeAt?: string | null;
};

export type JourneyDetail = Journey & {
  locations: JourneyLocation[];
};

export type NearbyJourneysParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};
