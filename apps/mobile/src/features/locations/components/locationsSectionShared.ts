import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { Location } from "@/src/features/locations/types/locationTypes";

export type NearbyMode = "radius" | "browse";

export type LocationPermissionState =
  | "loading"
  | "granted"
  | "denied"
  | "unavailable";

export type NearbyLocationItem = {
  location: Location;
  distanceKm: number | null;
};

export type RegionGroup = {
  county: string;
  locations: Location[];
};

export type LocationSectionColors = ReturnType<typeof getLocationSectionColors>;

export const VISIT_STATUS_PLACEHOLDER = "Visit status undefined";

export function normalizeCategory(category: string | null | undefined) {
  const trimmedCategory = typeof category === "string" ? category.trim() : "";

  if (!trimmedCategory) {
    return "Unknown";
  }

  const normalizedCategory = trimmedCategory.toLowerCase();

  if (
    normalizedCategory.startsWith("aband") ||
    normalizedCategory.startsWith("urbex")
  ) {
    return "Urbex";
  }

  if (normalizedCategory.startsWith("sightsee")) {
    return "Sightseeing";
  }

  if (normalizedCategory.startsWith("camp")) {
    return "Camping";
  }

  if (normalizedCategory.startsWith("natur")) {
    return "Nature";
  }

  if (normalizedCategory.startsWith("advent")) {
    return "Adventure";
  }

  return trimmedCategory;
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
}

export function useLocationSectionColors() {
  const colorScheme = useColorScheme();

  return useMemo(
    () => getLocationSectionColors(colorScheme === "dark"),
    [colorScheme],
  );
}

export function useLocationSectionStyles() {
  const colors = useLocationSectionColors();

  return useMemo(() => createStyles(colors), [colors]);
}

function getLocationSectionColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      searchInputBorder: "#334155",
      searchInputBackground: "#0F172A",
      searchInputText: "#F8FAFC",
      searchClearBorder: "#334155",
      searchClearBackground: "#111827",
      searchClearText: "#CBD5E1",
      controlLabel: "#94A3B8",
      segmentedBorder: "#334155",
      segmentedBackground: "#0F172A",
      segmentedActiveBorder: activeStateColors.border,
      segmentedActiveBackground: activeStateColors.selectionBackground,
      segmentedText: "#E2E8F0",
      segmentedActiveText: activeStateColors.text,
      chipBorder: "#334155",
      chipBackground: "#0F172A",
      chipActiveBorder: activeStateColors.border,
      chipActiveBackground: activeStateColors.selectionBackground,
      chipText: "#E2E8F0",
      chipActiveText: activeStateColors.text,
      primaryActionBackground: activeStateColors.buttonBackground,
      primaryActionText: activeStateColors.text,
      stateBorder: "#1E293B",
      stateBackground: "#0F172A",
      stateTitle: "#F8FAFC",
      stateCopy: "#CBD5E1",
      sectionBackground: "#0F172A",
      sectionTitle: "#F8FAFC",
      sectionMeta: activeStateColors.tint,
      sectionHint: "#94A3B8",
      emptyCopy: "#CBD5E1",
      cardBackground: "#0F172A",
      cardBorder: "#1E293B",
      title: "#F8FAFC",
      activeToggleBorder: "#334155",
      activeToggleBackground: "#111827",
      activeToggleActiveBorder: "#FACC15",
      activeToggleActiveBackground: "#422006",
      activeToggleIcon: "#CBD5E1",
      activeToggleActiveIcon: "#FDE68A",
      statusPositiveBackground: "#134E4A",
      statusPositiveBorder: "#2DD4BF",
      statusPositiveText: "#CCFBF1",
      statusPendingBackground: "#1E293B",
      statusPendingBorder: "#334155",
      statusPendingText: "#CBD5E1",
      badgeBackground: "#1E293B",
      badgeText: "#E2E8F0",
      metaText: "#94A3B8",
      bodyText: "#E2E8F0",
      tertiaryText: "#CBD5E1",
      thumbnailBackground: "#1E293B",
      imagePlaceholderBackground: activeStateColors.softBackground,
      imagePlaceholderText: activeStateColors.tint,
      dividerBorder: "#1E293B",
      categoryBadgeBackground: activeStateColors.softBackground,
      categoryBadgeText: activeStateColors.tint,
      metricChipBackground: "#111827",
      metricChipText: "#E2E8F0",
      secondaryButtonBorder: "#334155",
      secondaryButtonBackground: "#111827",
      secondaryButtonText: "#E2E8F0",
      regionCardBackground: "#0F172A",
      regionCardBorder: "#1E293B",
      regionToggle: activeStateColors.tint,
      regionRowBackground: "#111827",
    };
  }

  return {
    searchInputBorder: "#D5D0C5",
    searchInputBackground: "#FEFCF8",
    searchInputText: "#0F172A",
    searchClearBorder: "#D7E0EA",
    searchClearBackground: "#FFFFFF",
    searchClearText: "#64748B",
    controlLabel: "#475569",
    segmentedBorder: "#D5D0C5",
    segmentedBackground: "#FEFCF8",
    segmentedActiveBorder: activeStateColors.border,
    segmentedActiveBackground: activeStateColors.background,
    segmentedText: "#334155",
    segmentedActiveText: activeStateColors.text,
    chipBorder: "#D5D0C5",
    chipBackground: "#FEFCF8",
    chipActiveBorder: activeStateColors.border,
    chipActiveBackground: activeStateColors.background,
    chipText: "#334155",
    chipActiveText: activeStateColors.text,
    primaryActionBackground: activeStateColors.background,
    primaryActionText: activeStateColors.text,
    stateBorder: "#CFE6E2",
    stateBackground: "#FEFCF8",
    stateTitle: "#0F172A",
    stateCopy: "#475569",
    sectionBackground: "#FEFCF8",
    sectionTitle: "#0F172A",
    sectionMeta: activeStateColors.tint,
    sectionHint: "#64748B",
    emptyCopy: "#475569",
    cardBackground: "#FFFFFF",
    cardBorder: "#E7E1D7",
    title: "#0F172A",
    activeToggleBorder: "#D7E0EA",
    activeToggleBackground: "#FFFFFF",
    activeToggleActiveBorder: "#FACC15",
    activeToggleActiveBackground: "#FEF3C7",
    activeToggleIcon: "#334155",
    activeToggleActiveIcon: "#92400E",
    statusPositiveBackground: "#ECFDF5",
    statusPositiveBorder: "#6EE7B7",
    statusPositiveText: "#065F46",
    statusPendingBackground: "#F8FAFC",
    statusPendingBorder: "#CBD5E1",
    statusPendingText: "#475569",
    badgeBackground: "#F1F5F9",
    badgeText: "#334155",
    metaText: "#64748B",
    bodyText: "#334155",
    tertiaryText: "#475569",
    thumbnailBackground: "#E2E8F0",
    imagePlaceholderBackground: activeStateColors.softBackground,
    imagePlaceholderText: activeStateColors.tint,
    dividerBorder: "#E7E1D7",
    categoryBadgeBackground: activeStateColors.softBackground,
    categoryBadgeText: activeStateColors.tint,
    metricChipBackground: "#F1F5F9",
    metricChipText: "#334155",
    secondaryButtonBorder: "#CBD5E1",
    secondaryButtonBackground: "#FFFFFF",
    secondaryButtonText: "#334155",
    regionCardBackground: "#FFFFFF",
    regionCardBorder: "#E7E1D7",
    regionToggle: activeStateColors.tint,
    regionRowBackground: "#FAF7F1",
  };
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 15,
      paddingBottom: 24,
      gap: 18,
    },
    listContent: {
      paddingBottom: 32,
    },
    listItemContainer: {
      paddingHorizontal: 15,
    },
    listSpacer: {
      height: 14,
    },
    searchInputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    searchInput: {
      height: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.searchInputBorder,
      backgroundColor: colors.searchInputBackground,
      paddingHorizontal: 16,
      paddingRight: 52,
      color: colors.searchInputText,
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
      borderColor: colors.searchClearBorder,
      backgroundColor: colors.searchClearBackground,
      shadowColor: "#94A3B8",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 2,
    },
    searchInputClearButtonText: {
      color: colors.searchClearText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    controlBlock: {
      gap: 10,
    },
    controlLabel: {
      color: colors.controlLabel,
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
      borderColor: colors.segmentedBorder,
      backgroundColor: colors.segmentedBackground,
      paddingVertical: 12,
    },
    segmentButtonActive: {
      borderColor: colors.segmentedActiveBorder,
      backgroundColor: colors.segmentedActiveBackground,
    },
    segmentButtonText: {
      color: colors.segmentedText,
      fontSize: 15,
      fontWeight: "700",
    },
    segmentButtonTextActive: {
      color: colors.segmentedActiveText,
    },
    chipRow: {
      gap: 10,
      paddingRight: 20,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    filterChipActive: {
      borderColor: colors.chipActiveBorder,
      backgroundColor: colors.chipActiveBackground,
    },
    filterChipText: {
      color: colors.chipText,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipTextActive: {
      color: colors.chipActiveText,
    },
    stateCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.stateBorder,
      backgroundColor: colors.stateBackground,
      padding: 20,
    },
    stateTitle: {
      color: colors.stateTitle,
      fontSize: 18,
      fontWeight: "700",
    },
    stateCopy: {
      marginTop: 8,
      color: colors.stateCopy,
      fontSize: 15,
      lineHeight: 22,
    },
    sectionCard: {
      borderRadius: 28,
      backgroundColor: colors.sectionBackground,
      padding: 20,
      shadowColor: "#1E293B",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.07,
      shadowRadius: 22,
      elevation: 5,
      gap: 14,
    },
    sectionHeader: {
      gap: 6,
    },
    sectionTitle: {
      color: colors.sectionTitle,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    sectionMeta: {
      color: colors.sectionMeta,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    sectionHint: {
      color: colors.sectionHint,
      fontSize: 15,
      lineHeight: 22,
    },
    emptyCopy: {
      color: colors.emptyCopy,
      fontSize: 15,
      lineHeight: 22,
    },
    locationCard: {
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 18,
      gap: 12,
    },
    locationCardPressable: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 14,
    },
    locationSummary: {
      flex: 1,
      gap: 6,
    },
    locationTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    locationTitle: {
      flex: 1,
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 24,
    },
    locationActiveToggleButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.activeToggleBorder,
      backgroundColor: colors.activeToggleBackground,
    },
    locationActiveToggleButtonActive: {
      borderColor: colors.activeToggleActiveBorder,
      backgroundColor: colors.activeToggleActiveBackground,
    },
    locationActiveToggleButtonPressed: {
      opacity: 0.84,
    },
    locationActiveToggleButtonDisabled: {
      opacity: 0.5,
    },
    locationExpandBadge: {
      borderRadius: 999,
      backgroundColor: colors.badgeBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    locationExpandBadgeText: {
      color: colors.badgeText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    locationCounty: {
      color: colors.metaText,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    locationDecisionLine: {
      color: colors.bodyText,
      fontSize: 14,
      fontWeight: "600",
    },
    locationVisitStatus: {
      color: colors.tertiaryText,
      fontSize: 13,
      fontWeight: "600",
    },
    locationHeaderAside: {
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    locationStatusPill: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    locationStatusPillPositive: {
      backgroundColor: colors.statusPositiveBackground,
      borderColor: colors.statusPositiveBorder,
    },
    locationStatusPillPending: {
      backgroundColor: colors.statusPendingBackground,
      borderColor: colors.statusPendingBorder,
    },
    locationStatusPillText: {
      fontSize: 12,
      fontWeight: "700",
    },
    locationStatusPillTextPositive: {
      color: colors.statusPositiveText,
    },
    locationStatusPillTextPending: {
      color: colors.statusPendingText,
    },
    locationThumbnailSmall: {
      width: 88,
      height: 88,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.thumbnailBackground,
    },
    locationThumbnailLarge: {
      width: "100%",
      height: 176,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: colors.thumbnailBackground,
    },
    locationImage: {
      width: "100%",
      height: "100%",
    },
    locationImagePlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.imagePlaceholderBackground,
    },
    locationImagePlaceholderText: {
      color: colors.imagePlaceholderText,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      textTransform: "uppercase",
      paddingHorizontal: 10,
    },
    locationExpandedContent: {
      borderTopWidth: 1,
      borderTopColor: colors.dividerBorder,
      paddingTop: 16,
      gap: 14,
    },
    categoryBadge: {
      borderRadius: 999,
      backgroundColor: colors.categoryBadgeBackground,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    categoryBadgeText: {
      color: colors.categoryBadgeText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    locationDescription: {
      color: colors.bodyText,
      fontSize: 15,
      lineHeight: 22,
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metricChip: {
      borderRadius: 999,
      backgroundColor: colors.metricChipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    metricChipText: {
      color: colors.metricChipText,
      fontSize: 13,
      fontWeight: "600",
    },
    locationActionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    locationActionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    locationActionButtonPrimary: {
      backgroundColor: colors.primaryActionBackground,
    },
    locationActionButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
    },
    locationActionButtonDisabled: {
      opacity: 0.55,
    },
    locationActionButtonText: {
      fontSize: 14,
      fontWeight: "700",
    },
    locationActionButtonTextPrimary: {
      color: colors.primaryActionText,
    },
    locationActionButtonTextSecondary: {
      color: colors.secondaryButtonText,
    },
    regionGroupCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.regionCardBorder,
      backgroundColor: colors.regionCardBackground,
      padding: 16,
      gap: 12,
    },
    regionGroupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    regionGroupTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    regionGroupMeta: {
      marginTop: 4,
      color: colors.metaText,
      fontSize: 14,
      fontWeight: "600",
    },
    regionToggle: {
      color: colors.regionToggle,
      fontSize: 26,
      fontWeight: "500",
      lineHeight: 26,
    },
    regionLocationRowContainer: {
      paddingLeft: 15,
      paddingRight: 15,
    },
    regionLocationCard: {
      borderRadius: 18,
      backgroundColor: colors.regionRowBackground,
      padding: 3,
    },
  });
}
