import { apiClient } from "@/src/shared/api/apiClient";
import {
  Journey,
  JourneyDetail,
  NearbyJourneysParams,
} from "@/src/features/journeys/types/journeyTypes";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";

const JOURNEYS_BASE_PATH = "/public/journeys";

export async function getAllJourneys(): Promise<Journey[]> {
  const response = await apiClient.get<Journey[]>(JOURNEYS_BASE_PATH);
  return response.data;
}

export async function getJourneyById(id: number): Promise<Journey> {
  const response = await apiClient.get<Journey>(`${JOURNEYS_BASE_PATH}/${id}`);
  return response.data;
}

export async function getActiveJourneys(): Promise<Journey[]> {
  const response = await apiClient.get<Journey[]>(
    `${JOURNEYS_BASE_PATH}/active`,
  );
  return response.data;
}

export async function getJourneysByCategory(
  category: string,
): Promise<Journey[]> {
  const response = await apiClient.get<Journey[]>(
    `${JOURNEYS_BASE_PATH}/category/${category}`,
  );
  return response.data;
}

export async function getJourneysByCounty(county: string): Promise<Journey[]> {
  const response = await apiClient.get<Journey[]>(
    `${JOURNEYS_BASE_PATH}/county/${county}`,
  );
  return response.data;
}

export async function getNearbyJourneys(
  params: NearbyJourneysParams,
): Promise<Journey[]> {
  const response = await apiClient.get<Journey[]>(
    `${JOURNEYS_BASE_PATH}/nearby`,
    { params },
  );
  return response.data;
}

export async function getJourneyDetail(
  journeyId: number,
): Promise<JourneyDetail> {
  const response = await apiClient.get<JourneyDetail>(
    `${JOURNEYS_BASE_PATH}/${journeyId}/detail`,
  );
  return response.data;
}

export async function getJourneyLocations(
  journeyId: number,
): Promise<JourneyLocation[]> {
  const response = await apiClient.get<JourneyLocation[]>(
    `${JOURNEYS_BASE_PATH}/${journeyId}/locations`,
  );
  return response.data;
}
