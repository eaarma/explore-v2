import { apiClient } from "@/src/shared/api/apiClient";
import {
  Location,
  NearbyLocationsParams,
} from "@/src/features/locations/types/locationTypes";

const LOCATIONS_BASE_PATH = "/public/locations";

export async function getAllLocations(): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(LOCATIONS_BASE_PATH);
  return response.data;
}

export async function getLocationById(id: number): Promise<Location> {
  const response = await apiClient.get<Location>(`${LOCATIONS_BASE_PATH}/${id}`);
  return response.data;
}

export async function getActiveLocations(): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `${LOCATIONS_BASE_PATH}/active`,
  );
  return response.data;
}

export async function getLocationsByCategory(
  category: string,
): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `${LOCATIONS_BASE_PATH}/category/${category}`,
  );
  return response.data;
}

export async function getLocationsByCounty(county: string): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `${LOCATIONS_BASE_PATH}/county/${county}`,
  );
  return response.data;
}

export async function getNearbyLocations(
  params: NearbyLocationsParams,
): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `${LOCATIONS_BASE_PATH}/nearby`,
    { params },
  );
  return response.data;
}
