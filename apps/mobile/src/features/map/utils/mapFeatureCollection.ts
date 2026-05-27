import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  getMapMarkerImageId,
  getMapMarkerState,
} from "@/src/features/map/mapMarkerIcons";

type MapPoint = {
  id: number;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
};

export function createPointFeatureCollection<T extends MapPoint>(
  points: T[],
  kind: "location" | "journey",
  selectedId: number | null,
  options: {
    isAchieved: (point: T) => boolean;
    isActive: (point: T) => boolean;
    isTripHighlighted: (point: T) => boolean;
  },
) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => {
      const normalizedCategory =
        kind === "journey"
          ? normalizeJourneyCategory(point.category)
          : normalizeLocationCategory(point.category);
      const achieved = options.isAchieved(point);
      const active = options.isActive(point);
      const tripHighlighted = options.isTripHighlighted(point);

      return {
        type: "Feature" as const,
        id: `${kind}-${point.id}`,
        properties: {
          id: point.id,
          kind,
          title: point.title,
          category: normalizedCategory,
          markerIcon: getMapMarkerImageId(
            kind,
            normalizedCategory,
            getMapMarkerState(achieved, active),
          ),
          achieved,
          active,
          tripHighlighted,
          selected: point.id === selectedId,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude],
        },
      };
    }),
  };
}

export function buildAvailableMapCategories(
  locations: Location[],
  journeys: Journey[],
) {
  const categories = new Set<string>();

  for (const location of locations) {
    categories.add(normalizeLocationCategory(location.category));
  }

  for (const journey of journeys) {
    categories.add(normalizeJourneyCategory(journey.category));
  }

  return [...categories].sort((left, right) => left.localeCompare(right));
}

export function syncCategoryVisibility(
  currentVisibility: Record<string, boolean>,
  availableCategories: string[],
) {
  const nextVisibility: Record<string, boolean> = {};
  let didChange = false;

  for (const category of availableCategories) {
    if (category in currentVisibility) {
      nextVisibility[category] = currentVisibility[category];
      continue;
    }

    nextVisibility[category] = true;
    didChange = true;
  }

  const currentKeys = Object.keys(currentVisibility);
  if (currentKeys.length !== availableCategories.length) {
    didChange = true;
  }

  return didChange ? nextVisibility : currentVisibility;
}

export function isCategoryVisible(
  categoryVisibility: Record<string, boolean>,
  category: string,
) {
  return categoryVisibility[category] ?? true;
}

export function hasValidCoordinates(
  point: Pick<MapPoint, "latitude" | "longitude">,
) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}
