import { create } from "zustand";

import {
  DEFAULT_APP_SETTINGS,
  type StoredAppSettings,
  getStoredAppSettings,
  saveStoredAppSettings,
} from "@/src/features/settings/storage/appSettingsStorage";
import { type MapStyleKey } from "@/src/features/map/mapConfig";
import { type AppAppearanceSetting } from "@/src/features/settings/utils/appAppearance";

type AppSettingsState = StoredAppSettings & {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setAppearancePreference: (preference: AppAppearanceSetting) => Promise<void>;
  setDefaultMapStyle: (mapStyle: MapStyleKey) => Promise<void>;
  setOfflineRoadMapEnabled: (enabled: boolean) => Promise<void>;
};

let hydrateSettingsPromise: Promise<void> | null = null;

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  ...DEFAULT_APP_SETTINGS,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    if (hydrateSettingsPromise) {
      return hydrateSettingsPromise;
    }

    hydrateSettingsPromise = (async () => {
      const storedSettings = await getStoredAppSettings();

      set({
        ...storedSettings,
        isHydrated: true,
      });
    })().finally(() => {
      hydrateSettingsPromise = null;
    });

    return hydrateSettingsPromise;
  },

  setAppearancePreference: async (appearancePreference) => {
    set({
      appearancePreference,
      isHydrated: true,
    });

    await saveStoredAppSettings(getPersistedSettings(get()));
  },

  setDefaultMapStyle: async (defaultMapStyle) => {
    set({
      defaultMapStyle,
      isHydrated: true,
    });

    await saveStoredAppSettings(getPersistedSettings(get()));
  },

  setOfflineRoadMapEnabled: async (offlineRoadMapEnabled) => {
    set({
      offlineRoadMapEnabled,
      isHydrated: true,
    });

    await saveStoredAppSettings(getPersistedSettings(get()));
  },
}));

function getPersistedSettings(
  settings: Pick<
    AppSettingsState,
    "appearancePreference" | "defaultMapStyle" | "offlineRoadMapEnabled"
  >,
): StoredAppSettings {
  return {
    appearancePreference: settings.appearancePreference,
    defaultMapStyle: settings.defaultMapStyle,
    offlineRoadMapEnabled: settings.offlineRoadMapEnabled,
  };
}
