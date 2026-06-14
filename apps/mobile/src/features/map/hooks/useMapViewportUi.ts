import { useMemo } from "react";

import {
  buildMapScaleIndicator,
  normalizeMapBearing,
} from "@/src/features/map/utils/mapView";

const MAP_ROTATION_EPSILON = 1;
const SCALE_BAR_MAX_WIDTH = 96;

type UseMapViewportUiOptions = {
  mapBearing: number;
  mapCenterLatitude: number;
  mapZoom: number;
};

export function useMapViewportUi({
  mapBearing,
  mapCenterLatitude,
  mapZoom,
}: UseMapViewportUiOptions) {
  const normalizedMapBearing = useMemo(
    () => normalizeMapBearing(mapBearing),
    [mapBearing],
  );

  const shouldShowCompass = useMemo(
    () => Math.abs(normalizedMapBearing) >= MAP_ROTATION_EPSILON,
    [normalizedMapBearing],
  );

  const mapScale = useMemo(
    () =>
      buildMapScaleIndicator(mapCenterLatitude, mapZoom, SCALE_BAR_MAX_WIDTH),
    [mapCenterLatitude, mapZoom],
  );

  return {
    mapScale,
    normalizedMapBearing,
    shouldShowCompass,
  };
}
