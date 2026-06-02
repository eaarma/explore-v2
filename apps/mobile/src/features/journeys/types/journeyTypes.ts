import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";

export type JourneyTrait = {
  id: number;
  name: string;
  sortOrder: number;
};

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
  traits?: JourneyTrait[];
  notes: string | null;
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
