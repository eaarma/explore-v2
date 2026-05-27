import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_MAP_STYLE_KEY,
  MAP_STYLE_OPTIONS,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import {
  isAppAppearanceSetting,
  type AppAppearanceSetting,
} from "@/src/features/settings/utils/appAppearance";

const APP_SETTINGS_KEY = "appSettings";

export type StoredAppSettings = {
  appearancePreference: AppAppearanceSetting;
  defaultMapStyle: MapStyleKey;
  offlineRoadMapEnabled: boolean;
};

export const DEFAULT_APP_SETTINGS: StoredAppSettings = {
  appearancePreference: "system",
  defaultMapStyle: DEFAULT_MAP_STYLE_KEY,
  offlineRoadMapEnabled: true,
};

export async function getStoredAppSettings(): Promise<StoredAppSettings> {
  const rawSettings = await SecureStore.getItemAsync(APP_SETTINGS_KEY);

  if (!rawSettings) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<StoredAppSettings>;

    return sanitizeStoredAppSettings(parsedSettings);
  } catch {
    await SecureStore.deleteItemAsync(APP_SETTINGS_KEY);
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveStoredAppSettings(settings: StoredAppSettings) {
  await SecureStore.setItemAsync(
    APP_SETTINGS_KEY,
    JSON.stringify(sanitizeStoredAppSettings(settings)),
  );
}

function sanitizeStoredAppSettings(
  settings: Partial<StoredAppSettings>,
): StoredAppSettings {
  return {
    appearancePreference: isAppAppearanceSetting(settings.appearancePreference)
      ? settings.appearancePreference
      : DEFAULT_APP_SETTINGS.appearancePreference,
    defaultMapStyle: isMapStyleKey(settings.defaultMapStyle)
      ? settings.defaultMapStyle
      : DEFAULT_APP_SETTINGS.defaultMapStyle,
    offlineRoadMapEnabled:
      typeof settings.offlineRoadMapEnabled === "boolean"
        ? settings.offlineRoadMapEnabled
        : DEFAULT_APP_SETTINGS.offlineRoadMapEnabled,
  };
}

function isMapStyleKey(value: unknown): value is MapStyleKey {
  return MAP_STYLE_OPTIONS.some((option) => option.key === value);
}
