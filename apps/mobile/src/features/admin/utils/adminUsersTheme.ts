import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export type AdminUsersSectionStyles = ReturnType<typeof createAdminUsersStyles>;

export function useAdminUsersSectionStyles(colors: AdminColors) {
  const colorScheme = useColorScheme();

  return useMemo(
    () => createAdminUsersStyles(colors, colorScheme === "dark"),
    [colorScheme, colors],
  );
}

export function createAdminUsersStyles(colors: AdminColors, isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);
  const neutralText = isDark ? "#CBD5E1" : "#334155";
  const mutedText = isDark ? "#94A3B8" : "#64748B";
  const inactiveBackground = isDark ? "#111827" : "#F8FAFC";
  const inactiveBorder = isDark ? "#334155" : "#CBD5E1";
  const inactiveText = isDark ? "#CBD5E1" : "#475569";
  const overlayBackground = isDark
    ? "rgba(2, 6, 23, 0.78)"
    : "rgba(15, 23, 42, 0.26)";

  return StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    content: {
      paddingTop: 24,
      paddingHorizontal: 15,
      paddingBottom: 18,
      gap: 18,
    },
    listContent: {
      paddingBottom: 32,
    },
    listItemContainer: {
      paddingHorizontal: 15,
    },
    listSpacer: {
      height: 12,
    },
    searchInputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    searchInput: {
      height: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingRight: 52,
      color: colors.title,
      fontSize: 15,
    },
    searchInputClearButton: {
      position: "absolute",
      right: 11,
      width: 30,
      height: 30,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    searchInputClearButtonText: {
      color: neutralText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    controlBlock: {
      gap: 10,
    },
    controlLabel: {
      color: mutedText,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    segmentedRow: {
      flexDirection: "row",
      gap: 10,
    },
    segmentButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingVertical: 12,
    },
    segmentButtonActive: {
      borderColor: activeStateColors.border,
      backgroundColor: isDark
        ? activeStateColors.selectionBackground
        : activeStateColors.background,
    },
    segmentButtonText: {
      color: neutralText,
      fontSize: 15,
      fontWeight: "700",
    },
    segmentButtonTextActive: {
      color: activeStateColors.text,
    },
    chipRow: {
      gap: 10,
      paddingRight: 20,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    filterChipActive: {
      borderColor: activeStateColors.border,
      backgroundColor: isDark
        ? activeStateColors.selectionBackground
        : activeStateColors.background,
    },
    filterChipText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipTextActive: {
      color: activeStateColors.text,
    },
    stateCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 18,
    },
    stateTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    stateCopy: {
      marginTop: 8,
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 2,
    },
    summaryTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
    },
    summaryMeta: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    userCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 16,
      gap: 12,
    },
    userHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    userIdentity: {
      flex: 1,
      gap: 4,
    },
    userName: {
      color: colors.title,
      fontSize: 17,
      fontWeight: "700",
      lineHeight: 22,
    },
    userEmail: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    userMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metaPill: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    metaPillText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.35,
    },
    rolePill: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    rolePillText: {
      color: colors.accent,
    },
    statusPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    statusPillInactive: {
      borderColor: inactiveBorder,
      backgroundColor: inactiveBackground,
    },
    statusPillTextActive: {
      color: colors.accent,
    },
    statusPillTextInactive: {
      color: inactiveText,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    userCreatedAt: {
      flex: 1,
      color: mutedText,
      fontSize: 13,
      fontWeight: "500",
    },
    viewButton: {
      minWidth: 74,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    viewButtonPressed: {
      opacity: 0.84,
    },
    viewButtonText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "700",
    },
    dialogOverlay: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: overlayBackground,
    },
    dialogCard: {
      maxHeight: "86%",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    dialogContent: {
      padding: 20,
      gap: 18,
    },
    dialogHeader: {
      gap: 6,
    },
    dialogEyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    dialogTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
    },
    dialogSubtitle: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    dialogHint: {
      paddingTop: 2,
      color: colors.body,
      fontSize: 14,
      lineHeight: 21,
    },
    dialogSection: {
      gap: 12,
    },
    dialogSectionTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    metadataRow: {
      gap: 8,
    },
    metadataLabel: {
      color: mutedText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    metadataValue: {
      color: colors.title,
      fontSize: 15,
      lineHeight: 22,
    },
    selectButton: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    selectButtonOpen: {
      borderColor: colors.accent,
    },
    selectButtonPressed: {
      opacity: 0.88,
    },
    selectButtonText: {
      flex: 1,
      color: colors.title,
      fontSize: 15,
      fontWeight: "600",
    },
    selectButtonChevron: {
      color: colors.body,
      fontSize: 14,
      fontWeight: "700",
    },
    selectMenu: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      overflow: "hidden",
    },
    selectOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectOptionSelected: {
      backgroundColor: colors.subtleAccent,
    },
    selectOptionPressed: {
      opacity: 0.84,
    },
    selectOptionText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "600",
    },
    selectOptionTextSelected: {
      color: colors.accent,
    },
    dialogButtonRow: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 4,
    },
    dialogButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dialogButtonPrimary: {
      backgroundColor: colors.accent,
    },
    dialogButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    dialogButtonDisabled: {
      opacity: 0.6,
    },
    dialogButtonPressed: {
      opacity: 0.84,
    },
    dialogButtonText: {
      fontSize: 14,
      fontWeight: "700",
    },
    dialogButtonTextPrimary: {
      color: isDark ? "#022C22" : "#FFFFFF",
    },
    dialogButtonTextSecondary: {
      color: neutralText,
    },
  });
}
