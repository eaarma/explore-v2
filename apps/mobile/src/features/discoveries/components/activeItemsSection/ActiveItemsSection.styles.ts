import { useMemo } from "react";
import { StyleSheet } from "react-native";

import {
  useLocationSectionColors,
  useLocationSectionStyles,
  type LocationSectionColors,
} from "@/src/features/locations/components/locationsSectionShared";

export type ActiveItemsSectionStyles = ReturnType<typeof createStyles>;
export type SharedLocationSectionStyles = ReturnType<
  typeof useLocationSectionStyles
>;

export function useActiveItemsSectionStyles() {
  const colors = useLocationSectionColors();

  return useMemo(() => createStyles(colors), [colors]);
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    itemStack: {
      gap: 8,
    },
    kindBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      backgroundColor: colors.badgeBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    kindBadgeText: {
      color: colors.badgeText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
    },
    sectionActionButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.segmentedActiveBorder,
      backgroundColor: colors.segmentedActiveBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    sectionActionButtonPressed: {
      opacity: 0.88,
    },
    sectionActionButtonText: {
      color: colors.segmentedActiveText,
      fontSize: 14,
      fontWeight: "700",
    },
    tripStack: {
      gap: 14,
    },
    disabledAction: {
      opacity: 0.58,
    },
  });
}
