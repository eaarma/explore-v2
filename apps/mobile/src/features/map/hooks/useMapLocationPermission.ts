import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as ExpoLocation from "expo-location";
import {
  LOCATION_UPDATE_INTERVAL_MS,
  REQUIRED_DISCOVERY_ACCURACY_METERS,
} from "@/src/features/discoveries/discoveryConfig";

type CurrentPosition = ExpoLocation.LocationObject | undefined;
type ResolvedCurrentPosition = NonNullable<CurrentPosition>;

export function useMapLocationPermission() {
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [currentPosition, setCurrentPosition] = useState<CurrentPosition>();
  const [latestPosition, setLatestPosition] = useState<CurrentPosition>();
  const locationSubscriptionRef =
    useRef<ExpoLocation.LocationSubscription | null>(null);
  const refreshInFlightRef = useRef(false);

  const applyPositionUpdate = useCallback((nextPosition: CurrentPosition) => {
    if (!nextPosition) {
      return;
    }

    setLatestPosition(nextPosition);
    setPreferredCurrentPosition(setCurrentPosition, nextPosition);
  }, []);

  const refreshCurrentPosition = useCallback(async () => {
    if (!locationPermissionGranted || refreshInFlightRef.current) {
      return latestPosition;
    }

    refreshInFlightRef.current = true;

    try {
      const refreshedPosition = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      applyPositionUpdate(refreshedPosition);
      return refreshedPosition;
    } catch {
      return latestPosition;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [applyPositionUpdate, latestPosition, locationPermissionGranted]);

  useEffect(() => {
    let isMounted = true;

    async function requestInitialPermission() {
      const permissionResponse =
        await ExpoLocation.requestForegroundPermissionsAsync();
      const granted =
        permissionResponse.status === ExpoLocation.PermissionStatus.GRANTED;

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
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      setCurrentPosition(undefined);
      setLatestPosition(undefined);
      return;
    }

    let isActive = true;

    async function startWatchingPosition() {
      try {
        locationSubscriptionRef.current?.remove();
        locationSubscriptionRef.current =
          await ExpoLocation.watchPositionAsync(
            {
              accuracy: ExpoLocation.Accuracy.Highest,
              distanceInterval: 0,
              timeInterval: LOCATION_UPDATE_INTERVAL_MS,
              mayShowUserSettingsDialog: true,
            },
            (nextPosition) => {
              if (!isActive) {
                return;
              }

              applyPositionUpdate(nextPosition);
            },
          );
      } catch {
        // Ignore transient watcher startup failures and rely on the polling fallback.
      }
    }

    void refreshCurrentPosition();
    void startWatchingPosition();
    const intervalId = setInterval(() => {
      void refreshCurrentPosition();
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => {
      isActive = false;
      clearInterval(intervalId);
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      refreshInFlightRef.current = false;
    };
  }, [applyPositionUpdate, locationPermissionGranted, refreshCurrentPosition]);

  async function ensureLocationPermission() {
    if (locationPermissionGranted) {
      return true;
    }

    const permissionResponse =
      await ExpoLocation.requestForegroundPermissionsAsync();
    const granted =
      permissionResponse.status === ExpoLocation.PermissionStatus.GRANTED;

    setLocationPermissionGranted(granted);

    if (granted) {
      void refreshCurrentPosition();
    }

    return granted;
  }

  return {
    currentPosition,
    ensureLocationPermission,
    latestPosition,
    locationPermissionGranted,
    refreshCurrentPosition,
  };
}

function setPreferredCurrentPosition(
  setCurrentPosition: Dispatch<SetStateAction<CurrentPosition>>,
  nextPosition: ResolvedCurrentPosition,
) {
  setCurrentPosition((currentReliablePosition) =>
    selectPreferredCurrentPosition(currentReliablePosition, nextPosition),
  );
}

function selectPreferredCurrentPosition(
  currentPosition: CurrentPosition,
  nextPosition: ResolvedCurrentPosition,
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
