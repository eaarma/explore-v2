import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  useLocationSectionColors,
  type LocationSectionColors,
} from "@/src/features/locations/components/locationsSectionShared";
import { TripPlanList } from "@/src/features/trips/components/TripPlanList";
import type {
  ResolvedTrip,
  ResolvedTripItem,
} from "@/src/features/trips/types/tripTypes";

type TripCardProps = {
  isReorderPending?: boolean;
  onDragStateChange?: ((isDragging: boolean) => void) | null;
  onClearMapTrip?: (() => void | Promise<void>) | null;
  onManageItems?: (() => void | Promise<void>) | null;
  onShowTripOnMap?: (() => void | Promise<void>) | null;
  onReorderItems?: ((items: ResolvedTripItem[]) => void | Promise<void>) | null;
  trip: ResolvedTrip;
};

export function TripCard({
  isReorderPending = false,
  onDragStateChange = null,
  onClearMapTrip = null,
  onManageItems = null,
  onShowTripOnMap = null,
  onReorderItems = null,
  trip,
}: TripCardProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{trip.name}</Text>
          {trip.description ? (
            <Text style={styles.description}>{trip.description}</Text>
          ) : null}
        </View>

        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>
            {trip.completedCount} / {trip.totalCount} completed
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>
        {formatCount(trip.locationCount, "location")} |{" "}
        {formatCount(trip.journeyCount, "journey")}
      </Text>

      {onManageItems ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void onManageItems()}
          style={({ pressed }) => [
            styles.manageItemsButton,
            pressed && styles.pressedAction,
          ]}
        >
          <Text style={styles.manageItemsButtonText}>Edit items</Text>
        </Pressable>
      ) : null}

      {onShowTripOnMap ? (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={trip.totalCount === 0}
            onPress={() => void onShowTripOnMap()}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && styles.pressedAction,
              trip.totalCount === 0 && styles.disabledAction,
            ]}
          >
            <Text style={styles.primaryActionText}>
              {trip.isMapActive ? "Trip active on map" : "Show trip on map"}
            </Text>
          </Pressable>

          {trip.isMapActive && onClearMapTrip ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void onClearMapTrip()}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressedAction,
              ]}
            >
              <Text style={styles.secondaryActionText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <TripPlanList
        isDisabled={isReorderPending || onReorderItems === null}
        isReorderPending={isReorderPending}
        items={trip.items}
        onDragStateChange={onDragStateChange}
        onReorder={(items) => onReorderItems?.(items)}
      />
    </View>
  );
}

function formatCount(count: number, label: string) {
  if (count === 1) {
    return `1 ${label}`;
  }

  return `${count} ${label}s`;
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      padding: 18,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    copy: {
      flex: 1,
      gap: 6,
    },
    title: {
      color: colors.title,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 25,
    },
    description: {
      color: colors.bodyText,
      fontSize: 14,
      lineHeight: 20,
    },
    metaChip: {
      borderRadius: 999,
      backgroundColor: colors.metricChipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    metaChipText: {
      color: colors.metricChipText,
      fontSize: 12,
      fontWeight: "700",
    },
    summary: {
      color: colors.metaText,
      fontSize: 13,
      fontWeight: "600",
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    manageItemsButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    manageItemsButtonText: {
      color: colors.secondaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
    primaryAction: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: tripActionPurple,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    primaryActionText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryAction: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    secondaryActionText: {
      color: colors.secondaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
    pressedAction: {
      opacity: 0.9,
    },
    disabledAction: {
      opacity: 0.55,
    },
  });
}

const tripActionPurple = "#9333EA";
