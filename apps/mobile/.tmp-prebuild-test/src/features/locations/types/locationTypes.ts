export type Location = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  county: string;
  category: string;
  imageUrl: string | null;
  experience: number;
  difficulty: number;
  notes: number;
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
