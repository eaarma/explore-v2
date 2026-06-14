import { apiClient } from "@/src/shared/api/apiClient";
import {
  Location,
  NearbyLocationsParams,
} from "@/src/features/locations/types/locationTypes";

const LOCATIONS_BASE_PATH = "/public/locations";
const PAGE_SIZE = 100;

async function fetchAllLocationPages(
  path: string,
  params?: Record<string, string | number>,
): Promise<Location[]> {
  const results: Location[] = [];

  for (let page = 0; ; page += 1) {
    const response = await apiClient.get<Location[]>(path, {
      params: { ...params, page, size: PAGE_SIZE },
    });
    results.push(...response.data);

    if (response.data.length < PAGE_SIZE) {
      return results;
    }
  }
}

export async function getAllLocations(): Promise<Location[]> {
  return fetchAllLocationPages(LOCATIONS_BASE_PATH);
}

export async function getLocationById(id: number): Promise<Location> {
  const response = await apiClient.get<Location>(`${LOCATIONS_BASE_PATH}/${id}`);
  return response.data;
}

export async function getActiveLocations(): Promise<Location[]> {
  return fetchAllLocationPages(`${LOCATIONS_BASE_PATH}/active`);
}

export async function getLocationsByCategory(
  category: string,
): Promise<Location[]> {
  return fetchAllLocationPages(`${LOCATIONS_BASE_PATH}/category/${category}`);
}

export async function getLocationsByCounty(county: string): Promise<Location[]> {
  return fetchAllLocationPages(`${LOCATIONS_BASE_PATH}/county/${county}`);
}

export async function getNearbyLocations(
  params: NearbyLocationsParams,
): Promise<Location[]> {
  return fetchAllLocationPages(`${LOCATIONS_BASE_PATH}/nearby`, params);
}
