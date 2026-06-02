import { Journey } from "@/src/features/journeys/types/journeyTypes";
import { apiClient } from "@/src/shared/api/apiClient";

export type AdminJourneyTraitRequest = {
  name: string;
};

export type CreateAdminJourneyRequest = {
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  county?: string;
  category?: string;
  experience?: number;
  distance?: number;
  difficulty?: number;
  polyline?: string;
  traits?: AdminJourneyTraitRequest[];
  notes?: string;
  status?: number;
};

export type UpdateAdminJourneyRequest = {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  county?: string;
  category?: string;
  experience?: number;
  distance?: number;
  difficulty?: number;
  polyline?: string;
  traits?: AdminJourneyTraitRequest[];
  notes?: string;
  status?: number;
};

export type AdminJourneyLocationOrderRequest = {
  locationId: number;
  sortOrder: number;
};

const ADMIN_JOURNEYS_BASE_PATH = "/manager/journeys";

export async function createAdminJourney(
  payload: CreateAdminJourneyRequest,
): Promise<Journey> {
  const response = await apiClient.post<Journey>(
    ADMIN_JOURNEYS_BASE_PATH,
    payload,
  );
  return response.data;
}

export async function updateAdminJourney(
  id: number,
  payload: UpdateAdminJourneyRequest,
): Promise<Journey> {
  const response = await apiClient.patch<Journey>(
    `${ADMIN_JOURNEYS_BASE_PATH}/${id}`,
    payload,
  );
  return response.data;
}

export async function replaceAdminJourneyLocations(
  journeyId: number,
  locations: AdminJourneyLocationOrderRequest[],
): Promise<void> {
  await apiClient.put(
    `${ADMIN_JOURNEYS_BASE_PATH}/${journeyId}/locations`,
    locations,
  );
}
