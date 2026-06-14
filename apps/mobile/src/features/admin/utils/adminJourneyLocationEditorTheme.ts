import { StyleSheet } from "react-native";

import {
  ACTIVE_STATE_ACCENT,
  getActiveStateColors,
} from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export type AdminJourneyLocationEditorColors = ReturnType<
  typeof getAdminJourneyLocationEditorColors
>;
export type AdminJourneyLocationEditorStyles = ReturnType<
  typeof createAdminJourneyLocationEditorStyles
>;

export function useAdminJourneyLocationEditorTheme() {
  const colorScheme = useColorScheme();
  const colors = getAdminJourneyLocationEditorColors(colorScheme === "dark");
  const styles = createAdminJourneyLocationEditorStyles(colors);

  return {
    colors,
    styles,
  };
}

export function getAdminJourneyLocationEditorColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      border: "#1E293B",
      card: "#111827",
      surface: "#0F172A",
      elevated: "#111827",
      accent: ACTIVE_STATE_ACCENT,
      accentSoft: activeStateColors.softBackground,
      title: "#F8FAFC",
      body: "#CBD5E1",
      muted: "#94A3B8",
      inputBackground: "#020617",
      inputBorder: "#334155",
      searchPlaceholder: "#94A3B8",
      addButtonBackground: "#111827",
      addButtonBorder: "#334155",
      addButtonText: "#E2E8F0",
      retryButtonBackground: "#111827",
      retryButtonBorder: "#334155",
      retryButtonText: "#E2E8F0",
      indexBadgeBackground: activeStateColors.softBackground,
      indexBadgeText: ACTIVE_STATE_ACCENT,
      removeBackground: "#1E293B",
      removeIcon: "#CBD5E1",
      handleIcon: "#CBD5E1",
      handleIconDisabled: "#64748B",
      divider: "#1E293B",
      dragShadow: "#020617",
    };
  }

  return {
    border: "#E2E8F0",
    card: "#FFFFFF",
    surface: "#FEFCF8",
    elevated: "#FFFFFF",
    accent: ACTIVE_STATE_ACCENT,
    accentSoft: activeStateColors.softBackground,
    title: "#0F172A",
    body: "#475569",
    muted: "#64748B",
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    searchPlaceholder: "#94A3B8",
    addButtonBackground: "#FFFFFF",
    addButtonBorder: "#CBD5E1",
    addButtonText: "#334155",
    retryButtonBackground: "#FFFFFF",
    retryButtonBorder: "#CBD5E1",
    retryButtonText: "#334155",
    indexBadgeBackground: activeStateColors.softBackground,
    indexBadgeText: ACTIVE_STATE_ACCENT,
    removeBackground: "#F8FAFC",
    removeIcon: "#475569",
    handleIcon: "#64748B",
    handleIconDisabled: "#94A3B8",
    divider: "#E2E8F0",
    dragShadow: "#0F172A",
  };
}

export function createAdminJourneyLocationEditorStyles(
  colors: AdminJourneyLocationEditorColors,
) {
  return StyleSheet.create({
    root: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    label: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.addButtonBorder,
      backgroundColor: colors.addButtonBackground,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    addButtonPressed: {
      opacity: 0.82,
    },
    addButtonDisabled: {
      opacity: 0.58,
    },
    addButtonText: {
      color: colors.addButtonText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    searchCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    },
    searchInput: {
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      color: colors.title,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchStateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    searchStateText: {
      flex: 1,
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    retryButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.retryButtonBorder,
      backgroundColor: colors.retryButtonBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    retryButtonText: {
      color: colors.retryButtonText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    searchResults: {
      gap: 8,
    },
    searchResultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchResultCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    searchResultTitle: {
      color: colors.title,
      fontSize: 14,
      fontWeight: "700",
    },
    searchResultMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    searchResultAction: {
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchResultActionPressed: {
      opacity: 0.84,
    },
    searchResultActionText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    listCard: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowSlot: {
      height: 68,
      justifyContent: "center",
    },
    rowSlotPlaceholder: {
      opacity: 0.18,
    },
    dragOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 2,
    },
    row: {
      flex: 1,
      height: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
    },
    rowDragging: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevated,
      shadowColor: colors.dragShadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 8,
    },
    rowHidden: {
      opacity: 0,
    },
    handle: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    handleDisabled: {
      opacity: 0.55,
    },
    indexBadge: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.indexBadgeBackground,
    },
    indexBadgeText: {
      color: colors.indexBadgeText,
      fontSize: 12,
      fontWeight: "700",
    },
    rowCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.title,
      fontSize: 15,
      fontWeight: "700",
    },
    rowMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.removeBackground,
    },
    removeButtonPressed: {
      opacity: 0.82,
    },
    removeButtonGhost: {
      width: 28,
      height: 28,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    emptyStateText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
