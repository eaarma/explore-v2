import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useLocationSectionColors,
  type LocationSectionColors,
} from "@/src/features/locations/components/locationsSectionShared";
import { CreateTripComposer } from "@/src/features/trips/components/CreateTripComposer";
import type { ResolvedTrip } from "@/src/features/trips/types/tripTypes";

type TripSelectionModalProps = {
  isSubmitting?: boolean;
  onClose: () => void;
  onCreateTrip: (name: string) => void | Promise<void>;
  onSelectTrip: (tripId: number) => void | Promise<void>;
  suggestedTripName: string;
  targetLabel: string | null;
  trips: ResolvedTrip[];
  visible: boolean;
};

export function TripSelectionModal({
  isSubmitting = false,
  onClose,
  onCreateTrip,
  onSelectTrip,
  suggestedTripName,
  targetLabel,
  trips,
  visible,
}: TripSelectionModalProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsCreatingTrip(false);
    }
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) {
          setIsCreatingTrip(false);
          onClose();
        }
      }}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Select trip</Text>
          <Text style={styles.body}>
            {targetLabel
              ? `Add ${targetLabel} to an existing trip or create a new one.`
              : "Choose a trip for this item."}
          </Text>

          <ScrollView
            contentContainerStyle={styles.tripList}
            showsVerticalScrollIndicator={false}
          >
            {trips.map((trip) => (
              <Pressable
                key={trip.id}
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void onSelectTrip(trip.id)}
                style={({ pressed }) => [
                  styles.tripButton,
                  pressed && styles.pressedButton,
                  isSubmitting && styles.disabledAction,
                ]}
              >
                <Text style={styles.tripButtonTitle}>{trip.name}</Text>
                <Text style={styles.tripButtonMeta}>
                  {trip.locationCount} locations | {trip.journeyCount} journeys
                </Text>
              </Pressable>
            ))}

            {!isCreatingTrip ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => setIsCreatingTrip(true)}
                style={({ pressed }) => [
                  styles.newTripButton,
                  pressed && styles.pressedButton,
                  isSubmitting && styles.disabledAction,
                ]}
              >
                <Text style={styles.newTripButtonText}>+ New trip</Text>
              </Pressable>
            ) : (
              <CreateTripComposer
                actionLabel="Create and add"
                initialName={suggestedTripName}
                isSubmitting={isSubmitting}
                onCancel={() => setIsCreatingTrip(false)}
                onSave={async (name) => {
                  await onCreateTrip(name);
                  setIsCreatingTrip(false);
                }}
                title="New trip"
              />
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              setIsCreatingTrip(false);
              onClose();
            }}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedButton,
              isSubmitting && styles.disabledAction,
            ]}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(15, 23, 42, 0.48)",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      maxHeight: "82%",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      padding: 20,
      gap: 14,
      shadowColor: "#0F172A",
      shadowOffset: {
        width: 0,
        height: 16,
      },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 14,
    },
    title: {
      color: colors.title,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 28,
    },
    body: {
      color: colors.bodyText,
      fontSize: 15,
      lineHeight: 22,
    },
    tripList: {
      gap: 10,
    },
    tripButton: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.searchInputBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 4,
    },
    tripButtonTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    tripButtonMeta: {
      color: colors.metaText,
      fontSize: 13,
      fontWeight: "600",
    },
    newTripButton: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.segmentedActiveBorder,
      backgroundColor: colors.segmentedActiveBackground,
      paddingHorizontal: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    newTripButtonText: {
      color: colors.segmentedActiveText,
      fontSize: 15,
      fontWeight: "700",
    },
    closeButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    closeButtonText: {
      color: colors.secondaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
    pressedButton: {
      opacity: 0.84,
    },
    disabledAction: {
      opacity: 0.58,
    },
  });
}
