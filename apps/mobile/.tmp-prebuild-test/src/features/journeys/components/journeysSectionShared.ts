import { StyleSheet } from "react-native";

import { Journey } from "@/src/features/journeys/types/journeyTypes";

export const JOURNEY_VIEW_TABS = [
  { key: "nearby", label: "Nearby" },
  { key: "region", label: "Region" },
] as const;

export const JOURNEY_RANGE_OPTIONS = [
  { key: "5", label: "5 km", value: 5 },
  { key: "10", label: "10 km", value: 10 },
  { key: "25", label: "25 km", value: 25 },
  { key: "50", label: "50 km", value: 50 },
] as const;

export const JOURNEY_SORT_OPTIONS = [
  { key: "distance", label: "Distance" },
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

export const JOURNEY_REGION_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

export const PREFERRED_JOURNEY_CATEGORIES = [
  "Hiking",
  "Historic",
  "Urbex",
  "Camping",
  "Sightseeing",
] as const;

export type JourneyViewKey = (typeof JOURNEY_VIEW_TABS)[number]["key"];

export type JourneyNearbyMode = "radius" | "browse";

export type JourneyRangeValue =
  (typeof JOURNEY_RANGE_OPTIONS)[number]["value"];

export type JourneySortKey = (typeof JOURNEY_SORT_OPTIONS)[number]["key"];

export type JourneyRegionSortKey =
  (typeof JOURNEY_REGION_SORT_OPTIONS)[number]["key"];

export type JourneyPermissionState =
  | "loading"
  | "granted"
  | "denied"
  | "unavailable";

export type NearbyJourneyItem = {
  journey: Journey;
  distanceKm: number | null;
  stopCount: number;
  previewImageUrl: string | null;
};

export type JourneyRegionGroup = {
  county: string;
  journeys: NearbyJourneyItem[];
};

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

  if (
    normalizedCategory.startsWith("natur") ||
    normalizedCategory.startsWith("hik")
  ) {
    return "Hiking";
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

export function formatRouteDistance(distanceKm: number | null | undefined) {
  if (!Number.isFinite(distanceKm)) {
    return "Route length unknown";
  }

  const numericDistance = Number(distanceKm);

  if (numericDistance < 10) {
    return `Route ${numericDistance.toFixed(1)} km`;
  }

  return `Route ${Math.round(numericDistance)} km`;
}

export function formatStopCount(stopCount: number) {
  if (stopCount === 1) {
    return "1 stop";
  }

  return `${stopCount} stops`;
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
  placeholderCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D7EFEA",
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 8,
  },
  placeholderTitle: {
    color: "#115E59",
    fontSize: 18,
    fontWeight: "700",
  },
  placeholderCopy: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  journeyCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E1D7",
    padding: 18,
    gap: 12,
  },
  journeyCardPressable: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  journeySummary: {
    flex: 1,
    gap: 6,
  },
  journeyTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  journeyTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  journeyActiveToggleButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
  },
  journeyActiveToggleButtonActive: {
    borderColor: "#FACC15",
    backgroundColor: "#FEF3C7",
  },
  journeyActiveToggleButtonPressed: {
    opacity: 0.84,
  },
  journeyActiveToggleButtonDisabled: {
    opacity: 0.5,
  },
  journeyMeta: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  journeyDecisionLine: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  journeySecondaryLine: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  journeyThumbnailSmall: {
    width: 88,
    height: 88,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  journeyThumbnailLarge: {
    width: "100%",
    height: 176,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  journeyImage: {
    width: "100%",
    height: "100%",
  },
  journeyImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7EFEA",
  },
  journeyImagePlaceholderText: {
    color: "#115E59",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    paddingHorizontal: 10,
  },
  journeyExpandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#E7E1D7",
    paddingTop: 16,
    gap: 14,
  },
  journeyDescription: {
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
  journeyActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  journeyActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  journeyActionButtonPrimary: {
    backgroundColor: "#0F766E",
  },
  journeyActionButtonSecondary: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  journeyActionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  journeyActionButtonTextPrimary: {
    color: "#FFFFFF",
  },
  journeyActionButtonTextSecondary: {
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
  regionJourneyRowContainer: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  regionJourneyCard: {
    borderRadius: 18,
    backgroundColor: "#FAF7F1",
    padding: 3,
  },
});
