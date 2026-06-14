import { apiClient } from "@/src/shared/api/apiClient";
import type {
  AppConfiguration,
  UpdateAppConfigurationRequest,
} from "@/src/features/appConfig/appConfigTypes";

const PUBLIC_APP_CONFIGURATION_PATH = "/public/app-configuration";
const ADMIN_APP_CONFIGURATION_PATH = "/admin/app-configuration";

export async function getPublicAppConfiguration(): Promise<AppConfiguration> {
  const response = await apiClient.get<AppConfiguration>(
    PUBLIC_APP_CONFIGURATION_PATH,
  );
  return response.data;
}

export async function getAdminAppConfiguration(): Promise<AppConfiguration> {
  const response = await apiClient.get<AppConfiguration>(
    ADMIN_APP_CONFIGURATION_PATH,
  );
  return response.data;
}

export async function updateAdminAppConfiguration(
  payload: UpdateAppConfigurationRequest,
): Promise<AppConfiguration> {
  const response = await apiClient.put<AppConfiguration>(
    ADMIN_APP_CONFIGURATION_PATH,
    payload,
  );
  return response.data;
}
