export type JourneyLocation = {
  id: number;
  journeyId: number;
  locationId: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  county: string;
  category: string;
  imageUrl: string | null;
  experience: number;
  difficulty: number;
  notes: string | null;
  status: number;
  sortOrder: number;
};
