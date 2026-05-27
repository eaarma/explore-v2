import { StyleSheet } from "react-native";

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

export const VISIT_STATUS_PLACEHOLDER = "Visit status undefined";

export function normalizeCategory(category: string | null | undefined) {
  const trimmedCategory =
    typeof category === "string" ? category.trim() : "";

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

  if (normalizedCategory.startsWith("hist")) {
    return "Historic";
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

export const styles = StyleSheet.create({
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
    borderColor: "#D5D0C5",
    backgroundColor: "#FEFCF8",
    paddingHorizontal: 16,
    paddingRight: 52,
    color: "#0F172A",
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
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
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
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  controlBlock: {
    gap: 10,
  },
  controlLabel: {
    color: "#475569",
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
    borderColor: "#D5D0C5",
    backgroundColor: "#FEFCF8",
    paddingVertical: 12,
  },
  segmentButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#CCFBF1",
  },
  segmentButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
  segmentButtonTextActive: {
    color: "#115E59",
  },
  chipRow: {
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D5D0C5",
    backgroundColor: "#FEFCF8",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },
  filterChipText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#CFE6E2",
    backgroundColor: "#FEFCF8",
    padding: 20,
  },
  stateTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  stateCopy: {
    marginTop: 8,
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: "#FEFCF8",
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
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  sectionMeta: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sectionHint: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
  },
  emptyCopy: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  locationCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E1D7",
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
    color: "#0F172A",
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
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
  },
  locationActiveToggleButtonActive: {
    borderColor: "#FACC15",
    backgroundColor: "#FEF3C7",
  },
  locationActiveToggleButtonPressed: {
    opacity: 0.84,
  },
  locationActiveToggleButtonDisabled: {
    opacity: 0.5,
  },
  locationExpandBadge: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationExpandBadgeText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  locationCounty: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  locationDecisionLine: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  locationVisitStatus: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  locationThumbnailSmall: {
    width: 88,
    height: 88,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  locationThumbnailLarge: {
    width: "100%",
    height: 176,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  locationImage: {
    width: "100%",
    height: "100%",
  },
  locationImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7EFEA",
  },
  locationImagePlaceholderText: {
    color: "#115E59",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    paddingHorizontal: 10,
  },
  locationExpandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#E7E1D7",
    paddingTop: 16,
    gap: 14,
  },
  categoryBadge: {
    borderRadius: 999,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryBadgeText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  locationDescription: {
    color: "#334155",
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
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  locationActionRow: {
    flexDirection: "row",
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
    backgroundColor: "#0F766E",
  },
  locationActionButtonSecondary: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  locationActionButtonDisabled: {
    opacity: 0.55,
  },
  locationActionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  locationActionButtonTextPrimary: {
    color: "#FFFFFF",
  },
  locationActionButtonTextSecondary: {
    color: "#334155",
  },
  regionGroupCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E7E1D7",
    backgroundColor: "#FFFFFF",
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
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  regionGroupMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  regionToggle: {
    color: "#0F766E",
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
    backgroundColor: "#FAF7F1",
    padding: 3,
  },
});
