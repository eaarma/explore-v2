import type { PressEventWithFeatures } from "@maplibre/maplibre-react-native";
import type { MapBottomSheetSelection } from "@/src/features/map/components/MapSelectionBottomSheet";
import { toRadians } from "@/src/features/map/utils/mapMath";
import type { NativeSyntheticEvent } from "react-native";

export function getMapSelectionKey(selection: MapBottomSheetSelection) {
  return `${selection.kind}:${selection.item.id}`;
}

export function normalizeMapBearing(bearing: number) {
  if (!Number.isFinite(bearing)) {
    return 0;
  }

  const normalizedBearing = bearing % 360;

  if (normalizedBearing > 180) {
    return normalizedBearing - 360;
  }

  if (normalizedBearing < -180) {
    return normalizedBearing + 360;
  }

  return normalizedBearing;
}

export function buildMapScaleIndicator(
  latitude: number,
  zoom: number,
  maxWidthPx: number,
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(zoom) ||
    !Number.isFinite(maxWidthPx) ||
    maxWidthPx <= 0
  ) {
    return null;
  }

  const metersPerPixel =
    (156543.03392 * Math.cos(toRadians(latitude))) / 2 ** zoom;

  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
    return null;
  }

  const maxDistanceMeters = metersPerPixel * maxWidthPx;
  const scaleDistanceMeters = getNiceScaleDistance(maxDistanceMeters);

  if (!Number.isFinite(scaleDistanceMeters) || scaleDistanceMeters <= 0) {
    return null;
  }

  return {
    label: formatScaleDistance(scaleDistanceMeters),
    widthPx: Math.max(
      28,
      Math.min(maxWidthPx, scaleDistanceMeters / metersPerPixel),
    ),
  };
}

export function parseNumericParam(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(firstValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

export function formatTripItemCount(count: number) {
  if (count === 1) {
    return "1 item";
  }

  return `${count} items`;
}

export function getPressedFeatureId(
  event: NativeSyntheticEvent<PressEventWithFeatures>,
) {
  const rawId = event.nativeEvent.features[0]?.properties?.id;

  if (typeof rawId === "number" && Number.isInteger(rawId)) {
    return rawId;
  }

  if (typeof rawId === "string") {
    const parsedId = Number(rawId);

    if (Number.isInteger(parsedId)) {
      return parsedId;
    }
  }

  return null;
}

function getNiceScaleDistance(maxDistanceMeters: number) {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters <= 0) {
    return 0;
  }

  const exponent = Math.floor(Math.log10(maxDistanceMeters));
  const multipliers = [5, 2, 1];

  for (
    let currentExponent = exponent;
    currentExponent >= -2;
    currentExponent -= 1
  ) {
    const base = 10 ** currentExponent;

    for (const multiplier of multipliers) {
      const candidate = multiplier * base;

      if (candidate <= maxDistanceMeters) {
        return candidate;
      }
    }
  }

  return maxDistanceMeters;
}

function formatScaleDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    const distanceKm = distanceMeters / 1000;

    if (distanceKm < 10 && distanceKm % 1 !== 0) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  if (distanceMeters >= 10) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${distanceMeters.toFixed(1)} m`;
}
