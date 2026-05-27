import { useMemo } from "react";
import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import type { Location } from "@/src/features/locations/types/locationTypes";
import type { MapBottomSheetSelection } from "@/src/features/map/components/MapSelectionBottomSheet";
import {
  MAP_OVERLAY_OPTIONS,
  type MapOverlayKey,
} from "@/src/features/map/mapConfig";
import type { ActiveTripMapContext } from "@/src/features/map/types/mapStateTypes";
import {
  buildAvailableMapCategories,
  createPointFeatureCollection,
  isCategoryVisible,
} from "@/src/features/map/utils/mapFeatureCollection";
import {
  buildMapSearchResults,
  type MapSearchResult,
} from "@/src/features/map/utils/mapSearch";
import {
  buildMapScaleIndicator,
  getMapSelectionKey,
  normalizeMapBearing,
} from "@/src/features/map/utils/mapView";

const MAP_ROTATION_EPSILON = 1;
const SCALE_BAR_MAX_WIDTH = 96;

export type MapScreenTarget =
  | {
      kind: "location";
      id: number;
    }
  | {
      kind: "journey";
      id: number;
    };

type UseMapScreenModelOptions = {
  activeToggleTargetKey: string | null;
  activeTripMapContext: ActiveTripMapContext | null;
  categoryVisibility: Record<string, boolean>;
  journeys: Journey[];
  locations: Location[];
  mapBearing: number;
  mapCenterLatitude: number;
  mapZoom: number;
  overlayVisibility: Record<MapOverlayKey, boolean>;
  searchQuery: string;
  selectedJourneyId: number | null;
  selectedLocationId: number | null;
  selectedTarget: MapScreenTarget | null;
};

export function useMapScreenModel({
  activeToggleTargetKey,
  activeTripMapContext,
  categoryVisibility,
  journeys,
  locations,
  mapBearing,
  mapCenterLatitude,
  mapZoom,
  overlayVisibility,
  searchQuery,
  selectedJourneyId,
  selectedLocationId,
  selectedTarget,
}: UseMapScreenModelOptions) {
  const availableCategories = useMemo(
    () => buildAvailableMapCategories(locations, journeys),
    [journeys, locations],
  );

  const visibleLocations = useMemo(
    () =>
      locations.filter((location) =>
        isCategoryVisible(
          categoryVisibility,
          normalizeLocationCategory(location.category),
        ),
      ),
    [categoryVisibility, locations],
  );

  const visibleJourneys = useMemo(
    () =>
      journeys.filter((journey) =>
        isCategoryVisible(
          categoryVisibility,
          normalizeJourneyCategory(journey.category),
        ),
      ),
    [categoryVisibility, journeys],
  );

  const visibleLocationsById = useMemo(
    () =>
      new globalThis.Map(
        visibleLocations.map((location) => [location.id, location]),
      ),
    [visibleLocations],
  );

  const visibleJourneysById = useMemo(
    () =>
      new globalThis.Map(
        visibleJourneys.map((journey) => [journey.id, journey]),
      ),
    [visibleJourneys],
  );

  const locationGeoJson = useMemo(
    () =>
      createPointFeatureCollection(
        visibleLocations,
        "location",
        selectedLocationId,
        {
          isAchieved: (location) => location.discovered === true,
          isActive: (location) => location.active === true,
          isTripHighlighted: (location) =>
            activeTripMapContext?.locationIds.has(location.id) === true,
        },
      ),
    [activeTripMapContext, selectedLocationId, visibleLocations],
  );

  const journeyGeoJson = useMemo(
    () =>
      createPointFeatureCollection(
        visibleJourneys,
        "journey",
        selectedJourneyId,
        {
          isAchieved: (journey) => journey.completed === true,
          isActive: (journey) => journey.active === true,
          isTripHighlighted: (journey) =>
            activeTripMapContext?.journeyIds.has(journey.id) === true,
        },
      ),
    [activeTripMapContext, selectedJourneyId, visibleJourneys],
  );

  const normalizedMapBearing = useMemo(
    () => normalizeMapBearing(mapBearing),
    [mapBearing],
  );

  const shouldShowCompass = useMemo(
    () => Math.abs(normalizedMapBearing) >= MAP_ROTATION_EPSILON,
    [normalizedMapBearing],
  );

  const allCategoriesEnabled = useMemo(
    () =>
      availableCategories.every((category) =>
        isCategoryVisible(categoryVisibility, category),
      ),
    [availableCategories, categoryVisibility],
  );

  const enabledCategoryCount = useMemo(
    () =>
      availableCategories.filter((category) =>
        isCategoryVisible(categoryVisibility, category),
      ).length,
    [availableCategories, categoryVisibility],
  );

  const enabledOverlayCount = useMemo(
    () =>
      MAP_OVERLAY_OPTIONS.filter(
        (overlayOption) => overlayVisibility[overlayOption.key],
      ).length,
    [overlayVisibility],
  );

  const selectedMapItem = useMemo<MapBottomSheetSelection | null>(() => {
    if (!selectedTarget) {
      return null;
    }

    if (selectedTarget.kind === "location") {
      const location = visibleLocationsById.get(selectedTarget.id);

      if (!location) {
        return null;
      }

      return {
        kind: "location",
        item: location,
      };
    }

    const journey = visibleJourneysById.get(selectedTarget.id);

    if (!journey) {
      return null;
    }

    return {
      kind: "journey",
      item: journey,
    };
  }, [selectedTarget, visibleJourneysById, visibleLocationsById]);

  const isActiveTogglePending = useMemo(() => {
    if (!selectedMapItem) {
      return false;
    }

    return activeToggleTargetKey === getMapSelectionKey(selectedMapItem);
  }, [activeToggleTargetKey, selectedMapItem]);

  const mapScale = useMemo(
    () =>
      buildMapScaleIndicator(mapCenterLatitude, mapZoom, SCALE_BAR_MAX_WIDTH),
    [mapCenterLatitude, mapZoom],
  );

  const mapSearchResults = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return buildMapSearchResults(
      visibleLocations,
      visibleJourneys,
      normalizedSearchQuery,
    ).slice(0, 6);
  }, [searchQuery, visibleJourneys, visibleLocations]);

  return {
    allCategoriesEnabled,
    availableCategories,
    enabledCategoryCount,
    enabledOverlayCount,
    hasEnabledOverlays: enabledOverlayCount > 0,
    isActiveTogglePending,
    isCategoryFilterModified:
      availableCategories.length > 0 &&
      enabledCategoryCount !== availableCategories.length,
    journeyGeoJson,
    locationGeoJson,
    mapScale,
    mapSearchResults,
    normalizedMapBearing,
    selectedMapItem,
    shouldShowCompass,
    visibleJourneysById,
    visibleLocationsById,
  };
}
