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
  return {
    background: isDark ? "#020617" : "#F8FAFC",
    card: isDark ? "#0F172A" : "#FFFFFF",
    cardBorder: isDark ? "#1E293B" : "#E2E8F0",
    title: isDark ? "#F8FAFC" : "#0F172A",
    body: isDark ? "#CBD5E1" : "#475569",
    accent: isDark ? "#5EEAD4" : "#0F766E",
    subtleAccent: isDark ? "#0B2530" : "#ECFDF5",
    menuBackground: isDark ? "#111827" : "#FFFFFF",
    menuText: isDark ? "#CBD5E1" : "#334155",
  };
}
