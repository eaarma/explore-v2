import { useCallback } from "react";
import { LocationManager } from "@maplibre/maplibre-react-native";

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
      const granted = await LocationManager.requestPermissions();

      if (!granted) {
        return {
          status: "denied",
          coordinates: null,
        };
      }

      const position = await LocationManager.getCurrentPosition();

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
