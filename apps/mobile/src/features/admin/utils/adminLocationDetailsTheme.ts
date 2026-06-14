import { StyleSheet } from "react-native";

import { ACTIVE_STATE_ACCENT } from "@/src/shared/constants/activeStateColors";

export type AdminLocationDetailsColors = ReturnType<
  typeof getAdminLocationDetailsColors
>;
export type AdminLocationDetailsStyles = ReturnType<
  typeof createAdminLocationDetailsStyles
>;

export function getAdminLocationDetailsColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      border: "#1E293B",
      title: "#F8FAFC",
      body: "#CBD5E1",
      accent: ACTIVE_STATE_ACCENT,
      muted: "#94A3B8",
      inputBackground: "#111827",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#94A3B8",
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      primaryActionBackground: "#115E59",
      primaryActionText: "#FFFFFF",
      secondaryActionBorder: "#334155",
      secondaryActionBackground: "#111827",
      secondaryActionText: "#E2E8F0",
      secondaryPillBackground: "#111827",
      secondaryPillBorder: "#334155",
      secondaryPillText: "#E2E8F0",
      editButtonBackground: "#111827",
      editButtonBorder: "#334155",
      editButtonText: "#E2E8F0",
      modalBackground: "#020617",
      mapFrameBackground: "#0B1220",
    };
  }

  return {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    title: "#0F172A",
    body: "#475569",
    accent: ACTIVE_STATE_ACCENT,
    muted: "#64748B",
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    inputText: "#0F172A",
    inputPlaceholder: "#94A3B8",
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    primaryActionBackground: "#0F766E",
    primaryActionText: "#FFFFFF",
    secondaryActionBorder: "#CBD5E1",
    secondaryActionBackground: "#FFFFFF",
    secondaryActionText: "#334155",
    secondaryPillBackground: "#FFFFFF",
    secondaryPillBorder: "#CBD5E1",
    secondaryPillText: "#334155",
    editButtonBackground: "#FFFFFF",
    editButtonBorder: "#CBD5E1",
    editButtonText: "#334155",
    modalBackground: "#F8FAFC",
    mapFrameBackground: "#E2E8F0",
  };
}

export function createAdminLocationDetailsStyles(
  colors: AdminLocationDetailsColors,
) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 20,
    },
    heroCopy: {
      gap: 10,
    },
    heroHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    editButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.editButtonBorder,
      backgroundColor: colors.editButtonBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    editButtonPressed: {
      opacity: 0.82,
    },
    editButtonDisabled: {
      opacity: 0.58,
    },
    editButtonText: {
      color: colors.editButtonText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    locationTitle: {
      color: colors.title,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    titleInput: {
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 32,
    },
    locationMeta: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    locationStatus: {
      color: colors.body,
      fontSize: 14,
      fontWeight: "600",
    },
    editingHint: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    locationDescription: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    detailsCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 14,
    },
    sectionTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricChip: {
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    metricChipText: {
      color: colors.chipText,
      fontSize: 13,
      fontWeight: "600",
    },
    metadataRow: {
      gap: 6,
    },
    metadataLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metadataValue: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    metadataValueMultiline: {
      flexShrink: 1,
    },
    emptyStateCopy: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    textInput: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    multilineInput: {
      minHeight: 104,
      lineHeight: 22,
      paddingTop: 12,
      paddingBottom: 12,
    },
    traitsEditorGroup: {
      gap: 12,
    },
    traitInputRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    traitInput: {
      flex: 1,
    },
    traitsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    traitChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingLeft: 12,
      paddingRight: 8,
      paddingVertical: 8,
    },
    traitChipText: {
      color: colors.chipText,
      fontSize: 14,
      fontWeight: "600",
    },
    traitRemoveButton: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
    },
    traitRemoveButtonPressed: {
      opacity: 0.84,
    },
    traitRemoveButtonDisabled: {
      opacity: 0.52,
    },
    traitRemoveButtonText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 15,
      textTransform: "uppercase",
    },
    traitAddButton: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.primaryActionBackground,
      paddingHorizontal: 16,
    },
    traitAddButtonPressed: {
      opacity: 0.88,
    },
    traitAddButtonDisabled: {
      opacity: 0.56,
    },
    traitAddButtonText: {
      color: colors.primaryActionText,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    selectButton: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
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
      opacity: 0.86,
    },
    selectButtonText: {
      flex: 1,
      color: colors.inputText,
      fontSize: 15,
    },
    selectButtonChevron: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
    },
    selectMenu: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      overflow: "hidden",
    },
    selectOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectOptionSelected: {
      backgroundColor: colors.chipBackground,
    },
    selectOptionPressed: {
      opacity: 0.86,
    },
    selectOptionText: {
      color: colors.inputText,
      fontSize: 15,
      fontWeight: "500",
    },
    selectOptionTextSelected: {
      color: colors.accent,
      fontWeight: "700",
    },
    coordinateSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    coordinateSummaryText: {
      flex: 1,
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    inlineButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    inlineButtonPressed: {
      opacity: 0.86,
    },
    inlineButtonText: {
      color: colors.secondaryActionText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    secondaryPillButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondaryPillBorder,
      backgroundColor: colors.secondaryPillBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    secondaryPillButtonPressed: {
      opacity: 0.82,
    },
    secondaryPillButtonText: {
      color: colors.secondaryPillText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      paddingBottom: 12,
    },
    actionButton: {
      flexGrow: 1,
      minWidth: 120,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    actionIconButton: {
      flexGrow: 0,
      minWidth: 52,
      paddingHorizontal: 0,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primaryActionBackground,
    },
    actionButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
    },
    actionButtonTextPrimary: {
      color: colors.primaryActionText,
    },
    actionButtonTextSecondary: {
      color: colors.secondaryActionText,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.modalBackground,
      padding: 20,
      gap: 14,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 20,
    },
    modalTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
    },
    modalCopy: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    mapFrame: {
      flex: 1,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.mapFrameBackground,
      minHeight: 320,
    },
    map: {
      flex: 1,
    },
    modalFooter: {
      gap: 14,
      paddingBottom: 12,
    },
  });
}
