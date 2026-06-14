import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type ActiveStateColors = ReturnType<typeof getActiveStateColors>;

export type MapSelectionBottomSheetColors = ReturnType<
  typeof getMapSelectionBottomSheetColors
>;
export const mapSelectionBottomSheetStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#020617",
  },
  sheet: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#D6D3D1",
    backgroundColor: "#FFFCF7",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 18,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE7DB",
  },
  handleButton: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  summaryDragArea: {
    flex: 1,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  activeToggleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
  },
  activeToggleButtonPressed: {
    opacity: 0.84,
  },
  activeToggleButtonDisabled: {
    opacity: 0.5,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    paddingBottom: 8,
  },
  expandedScroll: {},
  expandedContent: {
    gap: 18,
    padding: 10,
    paddingTop: 16,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  distanceBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconButton: {
    flexGrow: 0,
    minWidth: 52,
    paddingHorizontal: 0,
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryActionButtonText: {
    color: "#334155",
  },
});
export type MapSelectionBottomSheetStyles =
  typeof mapSelectionBottomSheetStyles;

export function useMapSelectionBottomSheetTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeStateColors = useMemo(
    () => getActiveStateColors(isDark),
    [isDark],
  );
  const colors = useMemo(
    () => getMapSelectionBottomSheetColors(isDark, activeStateColors),
    [activeStateColors, isDark],
  );

  return {
    colors,
    styles: mapSelectionBottomSheetStyles,
  };
}

function getMapSelectionBottomSheetColors(
  isDark: boolean,
  activeStateColors: ActiveStateColors,
) {
  return isDark
    ? {
        backdrop: "#020617",
        sheetBorder: "#1E293B",
        sheetBackground: "#0F172A",
        headerBorder: "#1E293B",
        handle: "#334155",
        activeToggleBorder: "#334155",
        activeToggleBackground: "#111827",
        activeToggleActiveBorder: "#FACC15",
        activeToggleActiveBackground: "#422006",
        activeToggleIcon: "#CBD5E1",
        activeToggleActiveIcon: "#FDE68A",
        summaryLabel: "#18B6A2",
        title: "#F8FAFC",
        metricChipBackground: "#1E293B",
        metricChipBorder: "#334155",
        metricChipText: "#E2E8F0",
        sectionLabel: "#94A3B8",
        description: "#CBD5E1",
        primaryButtonBackground: activeStateColors.buttonBackground,
        primaryButtonText: activeStateColors.text,
        secondaryButtonBorder: "#334155",
        secondaryButtonBackground: "#111827",
        secondaryButtonText: "#E2E8F0",
      }
    : {
        backdrop: "#020617",
        sheetBorder: "#D6D3D1",
        sheetBackground: "#FFFCF7",
        headerBorder: "#EEE7DB",
        handle: "#CBD5E1",
        activeToggleBorder: "#D7E0EA",
        activeToggleBackground: "#FFFFFF",
        activeToggleActiveBorder: "#FACC15",
        activeToggleActiveBackground: "#FEF3C7",
        activeToggleIcon: "#334155",
        activeToggleActiveIcon: "#92400E",
        summaryLabel: "#18B6A2",
        title: "#0F172A",
        metricChipBackground: "#F1F5F9",
        metricChipBorder: "#E2E8F0",
        metricChipText: "#334155",
        sectionLabel: "#475569",
        description: "#334155",
        primaryButtonBackground: activeStateColors.buttonBackground,
        primaryButtonText: activeStateColors.text,
        secondaryButtonBorder: "#CBD5E1",
        secondaryButtonBackground: "#FFFFFF",
        secondaryButtonText: "#334155",
      };
}
