import { apiClient } from "@/src/shared/api/apiClient";
import {
  DiscoveryCheckRequest,
  DiscoveryCheckResponse,
  DiscoveryJourneyCompletionResult,
  DiscoveryLocationResult,
  OfflineDiscoverySyncRequest,
} from "@/src/features/discoveries/types/discoveryTypes";

const DISCOVERIES_BASE_PATH = "/discoveries";

export async function checkDiscoveries(
  request: DiscoveryCheckRequest,
): Promise<DiscoveryCheckResponse> {
  const response = await apiClient.post<DiscoveryCheckResponse>(
    `${DISCOVERIES_BASE_PATH}/check`,
    request,
  );

  return response.data;
}

export async function syncOfflineDiscoveries(
  request: OfflineDiscoverySyncRequest,
): Promise<DiscoveryCheckResponse> {
  const response = await apiClient.post<DiscoveryCheckResponse>(
    `${DISCOVERIES_BASE_PATH}/sync-offline`,
    request,
  );

  return response.data;
}

export async function getCurrentUserDiscoveries(): Promise<
  DiscoveryLocationResult[]
> {
  const response = await apiClient.get<DiscoveryLocationResult[]>(
    "/users/me/discoveries",
  );

  return response.data;
}

export async function getCurrentUserJourneyCompletions(): Promise<
  DiscoveryJourneyCompletionResult[]
> {
  const response = await apiClient.get<DiscoveryJourneyCompletionResult[]>(
    "/users/me/journey-completions",
  );

  return response.data;
}
