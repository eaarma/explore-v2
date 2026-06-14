import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

type MapUserLocationProps = {
  position:
    | {
        coords?: {
          accuracy?: number | null;
          latitude?: number | null;
          longitude?: number | null;
        } | null;
      }
    | null
    | undefined;
  showAccuracy?: boolean;
};

export function MapUserLocation({
  position,
  showAccuracy = true,
}: MapUserLocationProps) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  const accuracyMeters = Number(position?.coords?.accuracy);
  const shouldShowHalo =
    showAccuracy && Number.isFinite(accuracyMeters) && accuracyMeters >= 0;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return (
    <Marker id="app-user-location" anchor="center" lngLat={[longitude, latitude]}>
      <View pointerEvents="none" style={styles.container}>
        {shouldShowHalo ? <View style={styles.halo} /> : null}
        <View style={styles.outerDot}>
          <View style={styles.innerDot} />
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  halo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(51, 181, 229, 0.2)",
  },
  outerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#33B5E5",
  },
});
