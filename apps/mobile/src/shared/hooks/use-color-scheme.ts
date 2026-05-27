import { useColorScheme as useSystemColorScheme } from "react-native";

import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { resolveAppColorScheme } from "@/src/features/settings/utils/appAppearance";

export function useColorScheme() {
  const appearancePreference = useAppSettingsStore(
    (state) => state.appearancePreference,
  );
  const systemColorScheme = useSystemColorScheme();

  return resolveAppColorScheme(appearancePreference, systemColorScheme);
}
