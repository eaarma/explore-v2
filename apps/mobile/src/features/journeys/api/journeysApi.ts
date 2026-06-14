import { apiClient } from "@/src/shared/api/apiClient";
import {
  Journey,
  JourneyDetail,
  NearbyJourneysParams,
} from "@/src/features/journeys/types/journeyTypes";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";

const JOURNEYS_BASE_PATH = "/public/journeys";
const PAGE_SIZE = 100;

async function fetchAllJourneyPages(
  path: string,
  params?: Record<string, string | number>,
): Promise<Journey[]> {
  const results: Journey[] = [];

  for (let page = 0; ; page += 1) {
    const response = await apiClient.get<Journey[]>(path, {
      params: { ...params, page, size: PAGE_SIZE },
    });
    results.push(...response.data);

    if (response.data.length < PAGE_SIZE) {
      return results;
    }
  }
}

export async function getAllJourneys(): Promise<Journey[]> {
  return fetchAllJourneyPages(JOURNEYS_BASE_PATH);
}

export async function getJourneyById(id: number): Promise<Journey> {
  const response = await apiClient.get<Journey>(`${JOURNEYS_BASE_PATH}/${id}`);
  return response.data;
}

export async function getActiveJourneys(): Promise<Journey[]> {
  return fetchAllJourneyPages(`${JOURNEYS_BASE_PATH}/active`);
}

export async function getJourneysByCategory(
  category: string,
): Promise<Journey[]> {
  return fetchAllJourneyPages(`${JOURNEYS_BASE_PATH}/category/${category}`);
}

export async function getJourneysByCounty(county: string): Promise<Journey[]> {
  return fetchAllJourneyPages(`${JOURNEYS_BASE_PATH}/county/${county}`);
}

export async function getNearbyJourneys(
  params: NearbyJourneysParams,
): Promise<Journey[]> {
  return fetchAllJourneyPages(`${JOURNEYS_BASE_PATH}/nearby`, params);
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
