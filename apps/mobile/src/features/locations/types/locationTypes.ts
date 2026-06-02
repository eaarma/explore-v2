export type LocationTrait = {
  id: number;
  name: string;
  sortOrder: number;
};

export type Location = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  county: string;
  category: string;
  imageUrl: string | null;
  imageUrls?: string[];
  traits?: LocationTrait[];
  experience: number;
  difficulty: number;
  notes: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  discovered?: boolean;
  discoveredAt?: string | null;
  active?: boolean;
  activeAt?: string | null;
};

export type NearbyLocationsParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};
