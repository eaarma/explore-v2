import {
  getJourneyCompletionStatusLabel,
  getLocationVisitStatusLabel,
} from "@/src/features/discoveries/utils/discoveryPresentation";
import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import { calculateDistanceMeters } from "@/src/features/map/utils/mapMath";
import type {
  MapBottomSheetSelection,
  MapSelectionCoordinates,
} from "@/src/features/map/types/mapBottomSheetTypes";

export type MapBottomSheetPresentation = {
  activeToggleLabel: string;
  categoryLabel: string;
  description: string;
  directDistanceLabel: string | null;
  isActive: boolean;
  metricLabels: string[];
  optionsAccessibilityLabel: string;
  summaryLabel: string;
  title: string;
};

export function buildMapBottomSheetPresentation(
  selection: MapBottomSheetSelection,
  userCoordinates: MapSelectionCoordinates | null | undefined,
): MapBottomSheetPresentation {
  const categoryLabel = getMapSelectionCategoryLabel(selection);

  return {
    activeToggleLabel: getMapSelectionActiveToggleLabel(selection),
    categoryLabel,
    description: getMapSelectionDescription(selection),
    directDistanceLabel: getMapSelectionDistanceLabel(selection, userCoordinates),
    isActive: selection.item.active === true,
    metricLabels: getMapSelectionMetrics(selection, categoryLabel),
    optionsAccessibilityLabel: getMapSelectionOptionsAccessibilityLabel(selection),
    summaryLabel: getMapSelectionSummaryLabel(selection, categoryLabel),
    title: getMapSelectionTitle(selection),
  };
}

export function getMapSelectionTitle(selection: MapBottomSheetSelection) {
  const trimmedTitle = getTrimmedText(selection.item.title);

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return selection.kind === "location"
    ? "Untitled location"
    : "Untitled journey";
}

export function getMapSelectionDescription(selection: MapBottomSheetSelection) {
  const trimmedDescription = getTrimmedText(selection.item.description);

  if (trimmedDescription) {
    return trimmedDescription;
  }

  return selection.kind === "location"
    ? "Location details are not available yet."
    : "Journey details are not available yet.";
}

export function getMapSelectionMetrics(
  selection: MapBottomSheetSelection,
  categoryLabel = getMapSelectionCategoryLabel(selection),
) {
  const sharedLabels = [
    categoryLabel,
    normalizeMapSelectionCounty(selection.item.county),
  ];

  if (selection.kind === "location") {
    return [
      ...sharedLabels,
      getLocationVisitStatusLabel(selection.item),
      `Difficulty ${formatMapSelectionDifficulty(selection.item.difficulty)}`,
    ].filter(Boolean);
  }

  return [
    ...sharedLabels,
    getJourneyCompletionStatusLabel(selection.item),
    formatMapSelectionRouteDistance(selection.item.distance),
    `Difficulty ${formatMapSelectionDifficulty(selection.item.difficulty)}`,
  ].filter(Boolean);
}

export function getMapSelectionDistanceLabel(
  selection: MapBottomSheetSelection | null,
  userCoordinates: MapSelectionCoordinates | null | undefined,
) {
  if (!selection || !userCoordinates) {
    return null;
  }

  const distanceMeters = calculateDistanceMeters(
    userCoordinates.latitude,
    userCoordinates.longitude,
    selection.item.latitude,
    selection.item.longitude,
  );

  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return null;
  }

  return `Distance to you: ${formatDirectDistance(distanceMeters)}`;
}

export function getMapSelectionSummaryLabel(
  selection: MapBottomSheetSelection,
  categoryLabel = getMapSelectionCategoryLabel(selection),
) {
  return `${capitalizeMapSelectionKind(selection.kind)} | ${categoryLabel}`;
}

export function getMapSelectionActiveToggleLabel(
  selection: MapBottomSheetSelection,
) {
  return selection.item.active === true
    ? `Remove ${selection.kind} from active items`
    : `Add ${selection.kind} to active items`;
}

export function getMapSelectionOptionsAccessibilityLabel(
  selection: MapBottomSheetSelection,
) {
  return selection.kind === "location"
    ? "More location actions"
    : "More journey actions";
}

export function getMapSelectionCategoryLabel(
  selection: MapBottomSheetSelection,
) {
  return selection.kind === "location"
    ? normalizeLocationCategory(selection.item.category)
    : normalizeJourneyCategory(selection.item.category);
}

function getTrimmedText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMapSelectionCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function formatMapSelectionDifficulty(difficulty: number | null | undefined) {
  if (!Number.isFinite(difficulty)) {
    return "?";
  }

  return Math.max(1, Math.round(Number(difficulty)));
}

function formatMapSelectionRouteDistance(distanceKm: number | null | undefined) {
  if (!Number.isFinite(distanceKm)) {
    return "Route length unknown";
  }

  const numericDistance = Number(distanceKm);

  if (numericDistance < 10) {
    return `${numericDistance.toFixed(1)} km route`;
  }

  return `${Math.round(numericDistance)} km route`;
}

function formatDirectDistance(distanceMeters: number) {
  if (distanceMeters >= 10_000) {
    return `${Math.round(distanceMeters / 1000)} km`;
  }

  if (distanceMeters >= 1_000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function capitalizeMapSelectionKind(value: string) {
  if (!value) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
