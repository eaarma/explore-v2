import {
  ACTIVE_STATE_ACCENT,
  getActiveStateColors,
} from "@/src/shared/constants/activeStateColors";

export type AdminColors = {
  background: string;
  card: string;
  cardBorder: string;
  title: string;
  body: string;
  accent: string;
  subtleAccent: string;
  menuBackground: string;
  menuText: string;
};

export function getAdminScreenColors(isDark: boolean): AdminColors {
  const activeStateColors = getActiveStateColors(isDark);

  return {
    background: isDark ? "#020617" : "#F8FAFC",
    card: isDark ? "#0F172A" : "#FFFFFF",
    cardBorder: isDark ? "#1E293B" : "#E2E8F0",
    title: isDark ? "#F8FAFC" : "#0F172A",
    body: isDark ? "#CBD5E1" : "#475569",
    accent: ACTIVE_STATE_ACCENT,
    subtleAccent: activeStateColors.softBackground,
    menuBackground: isDark ? "#111827" : "#FFFFFF",
    menuText: isDark ? "#CBD5E1" : "#334155",
  };
}
