import { useCallback } from "react";
import * as ExpoLocation from "expo-location";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type ResolvedUserCoordinatesStatus =
  | "granted"
  | "denied"
  | "unavailable";

export type ResolvedUserCoordinatesResult = {
  status: ResolvedUserCoordinatesStatus;
  coordinates: UserCoordinates | null;
};

export function useResolvedUserCoordinates() {
  return useCallback(async (): Promise<ResolvedUserCoordinatesResult> => {
    try {
      const permissionResponse =
        await ExpoLocation.requestForegroundPermissionsAsync();
      const granted =
        permissionResponse.status === ExpoLocation.PermissionStatus.GRANTED;

      if (!granted) {
        return {
          status: "denied",
          coordinates: null,
        };
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      if (!position) {
        return {
          status: "unavailable",
          coordinates: null,
        };
      }

      return {
        status: "granted",
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      };
    } catch {
      return {
        status: "unavailable",
        coordinates: null,
      };
    }
  }, []);
}
