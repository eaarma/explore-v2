import { useEffect, useState } from "react";
import {
  LocationManager,
  useCurrentPosition,
} from "@maplibre/maplibre-react-native";
import {
  LOCATION_UPDATE_MIN_DISPLACEMENT_METERS,
  REQUIRED_DISCOVERY_ACCURACY_METERS,
} from "@/src/features/discoveries/discoveryConfig";

export function useMapLocationPermission() {
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [currentPosition, setCurrentPosition] = useState<
    ReturnType<typeof useCurrentPosition>
  >();
  const rawCurrentPosition = useCurrentPosition({
    enabled: locationPermissionGranted,
    minDisplacement: LOCATION_UPDATE_MIN_DISPLACEMENT_METERS,
  });

  useEffect(() => {
    let isMounted = true;

    async function requestInitialPermission() {
      const granted = await LocationManager.requestPermissions();

      if (!isMounted) {
        return;
      }

      setLocationPermissionGranted(granted);
    }

    void requestInitialPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!locationPermissionGranted) {
      setCurrentPosition(undefined);
      return;
    }

    if (!rawCurrentPosition) {
      return;
    }

    setCurrentPosition((currentReliablePosition) =>
      selectPreferredCurrentPosition(
        currentReliablePosition,
        rawCurrentPosition,
      ),
    );
  }, [locationPermissionGranted, rawCurrentPosition]);

  async function ensureLocationPermission() {
    if (locationPermissionGranted) {
      return true;
    }

    const granted = await LocationManager.requestPermissions();
    setLocationPermissionGranted(granted);
    return granted;
  }

  return {
    currentPosition,
    ensureLocationPermission,
    latestPosition: rawCurrentPosition ?? currentPosition,
    locationPermissionGranted,
  };
}

function selectPreferredCurrentPosition(
  currentPosition: ReturnType<typeof useCurrentPosition>,
  nextPosition: NonNullable<ReturnType<typeof useCurrentPosition>>,
) {
  if (!currentPosition) {
    return nextPosition;
  }

  const currentAccuracyMeters = normalizeAccuracyMeters(
    currentPosition.coords.accuracy,
  );
  const nextAccuracyMeters = normalizeAccuracyMeters(nextPosition.coords.accuracy);
  const currentIsReliable =
    currentAccuracyMeters !== null &&
    currentAccuracyMeters <= REQUIRED_DISCOVERY_ACCURACY_METERS;
  const nextIsReliable =
    nextAccuracyMeters !== null &&
    nextAccuracyMeters <= REQUIRED_DISCOVERY_ACCURACY_METERS;

  if (nextIsReliable) {
    return nextPosition;
  }

  if (currentIsReliable) {
    return currentPosition;
  }

  if (currentAccuracyMeters === null) {
    return nextPosition;
  }

  if (nextAccuracyMeters === null) {
    return currentPosition;
  }

  return nextAccuracyMeters <= currentAccuracyMeters
    ? nextPosition
    : currentPosition;
}

function normalizeAccuracyMeters(accuracyMeters: number | null | undefined) {
  const numericAccuracy = Number(accuracyMeters);

  if (!Number.isFinite(numericAccuracy) || numericAccuracy < 0) {
    return null;
  }

  return numericAccuracy;
}
