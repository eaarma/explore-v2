import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { resolveAppColorScheme } from "@/src/features/settings/utils/appAppearance";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const appearancePreference = useAppSettingsStore(
    (state) => state.appearancePreference,
  );

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useSystemColorScheme();

  if (hasHydrated) {
    return resolveAppColorScheme(appearancePreference, systemColorScheme);
  }

  return "light";
}
