import type { ColorSchemeName } from "react-native";

export const APP_APPEARANCE_OPTIONS = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const;

export type AppAppearanceSetting =
  (typeof APP_APPEARANCE_OPTIONS)[number]["key"];

export type ResolvedAppColorScheme = "light" | "dark";

export function isAppAppearanceSetting(
  value: unknown,
): value is AppAppearanceSetting {
  return APP_APPEARANCE_OPTIONS.some((option) => option.key === value);
}

export function resolveAppColorScheme(
  preference: AppAppearanceSetting,
  systemColorScheme: ColorSchemeName,
): ResolvedAppColorScheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemColorScheme === "dark" ? "dark" : "light";
}
