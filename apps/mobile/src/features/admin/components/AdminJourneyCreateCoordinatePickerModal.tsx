import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, type NativeSyntheticEvent, Pressable, Text, View } from "react-native";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type PressEvent,
} from "@maplibre/maplibre-react-native";

import {
  buildSelectedCoordinateFeatureCollection,
  type CoordinateSelection,
} from "@/src/features/admin/utils/adminJourneyCreateModel";
import {
  type AdminJourneyCreateColors,
  createAdminJourneyCreateStyles,
} from "@/src/features/admin/utils/adminJourneyCreateTheme";
import { useMapStyle } from "@/src/features/map/hooks/useMapStyle";
import { DEFAULT_MAP_CENTER } from "@/src/features/map/mapConfig";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";

type AdminJourneyCreateCoordinatePickerModalProps = {
  visible: boolean;
  initialCoordinates: CoordinateSelection | null;
  colors: AdminJourneyCreateColors;
  onClose: () => void;
  onConfirm: (coordinates: CoordinateSelection) => void;
};

export function AdminJourneyCreateCoordinatePickerModal({
  visible,
  initialCoordinates,
  colors,
  onClose,
  onConfirm,
}: AdminJourneyCreateCoordinatePickerModalProps) {
  const selectedMapStyle = useAppSettingsStore(
    (state) => state.defaultMapStyle,
  );
  const { resolvedMapStyle } = useMapStyle(selectedMapStyle);
  const cameraRef = useRef<CameraRef>(null);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<CoordinateSelection | null>(initialCoordinates);
  const styles = useMemo(() => createAdminJourneyCreateStyles(colors), [colors]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedCoordinates(initialCoordinates);
  }, [initialCoordinates, visible]);

  const markerGeoJson = useMemo(
    () => buildSelectedCoordinateFeatureCollection(selectedCoordinates),
    [selectedCoordinates],
  );

  function handleMapPress(event: NativeSyntheticEvent<PressEvent>) {
    const [longitude, latitude] = event.nativeEvent.lngLat;

    setSelectedCoordinates({
      latitude,
      longitude,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick on map</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryPillButton,
              pressed && styles.secondaryPillButtonPressed,
            ]}
          >
            <Text style={styles.secondaryPillButtonText}>Close</Text>
          </Pressable>
        </View>

        <Text style={styles.modalCopy}>
          Tap the map to place a marker, then confirm to fill the coordinates
          back into the form.
        </Text>

        <View style={styles.mapFrame}>
          <MapLibreMap
            style={styles.map}
            mapStyle={resolvedMapStyle}
            androidView="texture"
            attribution
            compass={false}
            logo={false}
            onPress={handleMapPress}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: DEFAULT_MAP_CENTER,
                zoom: 7,
              }}
            />

            <GeoJSONSource id="admin-journey-create-picker-point" data={markerGeoJson}>
              <Layer
                id="admin-journey-create-picker-glow"
                type="circle"
                paint={{
                  "circle-radius": 16,
                  "circle-color": colors.accent,
                  "circle-opacity": 0.22,
                }}
              />
              <Layer
                id="admin-journey-create-picker-dot"
                type="circle"
                paint={{
                  "circle-radius": 7,
                  "circle-color": colors.accent,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#FFFFFF",
                }}
              />
            </GeoJSONSource>
          </MapLibreMap>
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.coordinateSummaryText}>
            {selectedCoordinates
              ? `${selectedCoordinates.latitude.toFixed(6)}, ${selectedCoordinates.longitude.toFixed(6)}`
              : "No marker placed yet."}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[styles.actionButton, styles.actionButtonSecondary]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextSecondary,
                ]}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                selectedCoordinates ? onConfirm(selectedCoordinates) : undefined
              }
              disabled={!selectedCoordinates}
              style={[
                styles.actionButton,
                styles.actionButtonPrimary,
                !selectedCoordinates && styles.actionButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextPrimary,
                ]}
              >
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
