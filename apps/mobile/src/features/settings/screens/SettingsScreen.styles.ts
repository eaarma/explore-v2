import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export type SettingsScreenColors = ReturnType<typeof getSettingsScreenColors>;
export type SettingsScreenStyles = ReturnType<typeof createStyles>;

export function useSettingsScreenStyles() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getSettingsScreenColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return {
    colors,
    styles,
  };
}

function getSettingsScreenColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      card: "#0F172A",
      cardBorder: "#1E293B",
      title: "#F8FAFC",
      body: "#CBD5E1",
      strongBody: "#E2E8F0",
      accent: "#5EEAD4",
      chipText: "#E2E8F0",
      chipBackground: "#111827",
      chipBorder: "#334155",
      activeChipBackground: "#134E4A",
      activeChipText: "#FFFFFF",
      divider: "#1E293B",
      destructive: "#B91C1C",
      destructiveBackground: "#3F1D1D",
      mutedBackground: "#0B1220",
      positiveBackground: "#0F3A33",
      positiveText: "#99F6E4",
      warningBackground: "#3B2F12",
      warningText: "#FDE68A",
    };
  }

  return {
    background: "#F8FAFC",
    card: "#FFFFFF",
    cardBorder: "#E2E8F0",
    title: "#0F172A",
    body: "#475569",
    strongBody: "#334155",
    accent: "#0F766E",
    chipText: "#334155",
    chipBackground: "#FEFCF8",
    chipBorder: "#D5D0C5",
    activeChipBackground: "#0F766E",
    activeChipText: "#FFFFFF",
    divider: "#E2E8F0",
    destructive: "#B91C1C",
    destructiveBackground: "#FEE2E2",
    mutedBackground: "#F8FAFC",
    positiveBackground: "#CCFBF1",
    positiveText: "#115E59",
    warningBackground: "#FEF3C7",
    warningText: "#92400E",
  };
}

function createStyles(colors: SettingsScreenColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      gap: 18,
      paddingBottom: 28,
    },
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 22,
      gap: 10,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    heroTitle: {
      color: colors.title,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 38,
    },
    heroCopy: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    sectionCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 20,
      gap: 14,
    },
    sectionTitle: {
      color: colors.title,
      fontSize: 21,
      fontWeight: "700",
    },
    sectionDescription: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    optionWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    optionChip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    optionChipText: {
      fontSize: 14,
      fontWeight: "700",
    },
    helperText: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    statusCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.mutedBackground,
      overflow: "hidden",
    },
    settingRow: {
      borderBottomWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 4,
    },
    settingLabel: {
      color: colors.body,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    settingValue: {
      color: colors.strongBody,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 22,
    },
    inlineStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inlineStatusText: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    feedbackCard: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    feedbackText: {
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    actionColumn: {
      gap: 10,
    },
    actionButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    destructiveButton: {
      borderWidth: 1,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonPrimaryText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    actionButtonSecondaryText: {
      fontSize: 14,
      fontWeight: "700",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: colors.divider,
      paddingVertical: 14,
    },
    linkRowLabel: {
      color: colors.strongBody,
      fontSize: 15,
      fontWeight: "600",
    },
    linkRowChevron: {
      color: colors.body,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 20,
    },
  });
}
