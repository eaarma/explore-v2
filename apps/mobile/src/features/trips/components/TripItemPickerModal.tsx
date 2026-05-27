import { useMemo } from "react";
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

export type TripItemPickerCandidate =
  | {
      key: string;
      kind: "location";
      title: string;
      meta: string;
      status: string;
      isInTrip: boolean;
      locationId: number;
    }
  | {
      key: string;
      kind: "journey";
      title: string;
      meta: string;
      status: string;
      isInTrip: boolean;
      journeyId: number;
    };

type TripItemPickerModalProps = {
  items: TripItemPickerCandidate[];
  isSubmitting?: boolean;
  onClose: () => void;
  onToggleItem: (
    item: TripItemPickerCandidate,
  ) => void | Promise<void>;
  tripName: string | null;
  visible: boolean;
};

export function TripItemPickerModal({
  items,
  isSubmitting = false,
  onClose,
  onToggleItem,
  tripName,
  visible,
}: TripItemPickerModalProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit trip items</Text>
          <Text style={styles.body}>
            {tripName
              ? `Use + and - to manage which locations and journeys belong to ${tripName}.`
              : "Use + and - to manage trip items."}
          </Text>

          <ScrollView
            contentContainerStyle={styles.itemList}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Nothing to pick yet</Text>
                <Text style={styles.emptyStateCopy}>
                  Add locations or journeys to Active first, then you can add or
                  remove them from this trip here.
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <View style={styles.itemCopy}>
                    <View style={styles.itemHeader}>
                      <View style={styles.kindBadge}>
                        <Text style={styles.kindBadgeText}>
                          {item.kind === "location" ? "Location" : "Journey"}
                        </Text>
                      </View>
                      <Text style={styles.itemStatus}>{item.status}</Text>
                    </View>

                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.meta}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => void onToggleItem(item)}
                    style={({ pressed }) => [
                      styles.itemActionButton,
                      item.isInTrip
                        ? styles.itemActionButtonRemove
                        : styles.itemActionButtonAdd,
                      pressed && styles.pressedButton,
                      isSubmitting && styles.disabledAction,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemActionButtonText,
                        item.isInTrip
                          ? styles.itemActionButtonTextRemove
                          : styles.itemActionButtonTextAdd,
                      ]}
                    >
                      {item.isInTrip ? "- Remove" : "+ Add"}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedButton,
              isSubmitting && styles.disabledAction,
            ]}
          >
            <Text style={styles.closeButtonText}>Done</Text>
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
      maxWidth: 400,
      maxHeight: "84%",
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
    itemList: {
      gap: 10,
    },
    emptyState: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.dividerBorder,
      backgroundColor: colors.searchInputBackground,
      padding: 16,
      gap: 8,
    },
    emptyStateTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    emptyStateCopy: {
      color: colors.bodyText,
      fontSize: 14,
      lineHeight: 21,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.searchInputBackground,
      padding: 14,
    },
    itemCopy: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    kindBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      backgroundColor: colors.badgeBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    kindBadgeText: {
      color: colors.badgeText,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    itemStatus: {
      color: colors.metaText,
      fontSize: 12,
      fontWeight: "700",
    },
    itemTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 21,
    },
    itemMeta: {
      color: colors.bodyText,
      fontSize: 13,
      lineHeight: 18,
    },
    itemActionButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minWidth: 96,
    },
    itemActionButtonAdd: {
      borderWidth: 1,
      borderColor: colors.segmentedActiveBorder,
      backgroundColor: colors.segmentedActiveBackground,
    },
    itemActionButtonRemove: {
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
    },
    itemActionButtonText: {
      fontSize: 14,
      fontWeight: "700",
    },
    itemActionButtonTextAdd: {
      color: colors.segmentedActiveText,
    },
    itemActionButtonTextRemove: {
      color: colors.secondaryButtonText,
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
