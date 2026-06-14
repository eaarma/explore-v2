import { create } from "zustand";

import { getPublicAppConfiguration } from "@/src/features/appConfig/appConfigApi";
import type { AppConfiguration } from "@/src/features/appConfig/appConfigTypes";

type AppConfigurationState = {
  configuration: AppConfiguration | null;
  isHydrated: boolean;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setConfiguration: (configuration: AppConfiguration) => void;
};

let hydrateConfigurationPromise: Promise<void> | null = null;

export const useAppConfigurationStore = create<AppConfigurationState>(
  (set, get) => ({
    configuration: null,
    isHydrated: false,
    isLoading: false,

    hydrate: async () => {
      if (get().isHydrated) {
        return;
      }

      if (hydrateConfigurationPromise) {
        return hydrateConfigurationPromise;
      }

      hydrateConfigurationPromise = get()
        .refresh()
        .finally(() => {
          hydrateConfigurationPromise = null;
        });

      return hydrateConfigurationPromise;
    },

    refresh: async () => {
      set({
        isLoading: true,
      });

      try {
        const configuration = await getPublicAppConfiguration();

        set({
          configuration,
          isHydrated: true,
          isLoading: false,
        });
      } catch {
        set((state) => ({
          configuration: state.configuration,
          isHydrated: true,
          isLoading: false,
        }));
      }
    },

    setConfiguration: (configuration) => {
      set({
        configuration,
        isHydrated: true,
        isLoading: false,
      });
    },
  }),
);
