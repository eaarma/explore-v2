import { apiClient } from "@/src/shared/api/apiClient";
import { Location } from "@/src/features/locations/types/locationTypes";

export type CreateAdminLocationRequest = {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  county?: string;
  category?: string;
  imageUrl?: string;
  experience?: number;
  difficulty?: number;
  notes?: number;
  status?: number;
};

export type UpdateAdminLocationRequest = {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  county?: string;
  category?: string;
  imageUrl?: string;
  experience?: number;
  difficulty?: number;
  notes?: number;
  status?: number;
};

const ADMIN_LOCATIONS_BASE_PATH = "/manager/locations";

export async function createAdminLocation(
  payload: CreateAdminLocationRequest,
): Promise<Location> {
  const response = await apiClient.post<Location>(
    ADMIN_LOCATIONS_BASE_PATH,
    payload,
  );
  return response.data;
}

export async function updateAdminLocation(
  id: number,
  payload: UpdateAdminLocationRequest,
): Promise<Location> {
  const response = await apiClient.patch<Location>(
    `${ADMIN_LOCATIONS_BASE_PATH}/${id}`,
    payload,
  );
  return response.data;
}
