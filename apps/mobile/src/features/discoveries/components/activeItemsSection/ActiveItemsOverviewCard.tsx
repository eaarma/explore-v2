import { Pressable, Text, View } from "react-native";

import { CreateTripComposer } from "@/src/features/trips/components/CreateTripComposer";
import type {
  ActiveItemsSectionStyles,
  SharedLocationSectionStyles,
} from "@/src/features/discoveries/components/activeItemsSection/ActiveItemsSection.styles";

type ActiveItemsOverviewCardProps = {
  activeSummaryLabel: string;
  isCreateTripComposerVisible: boolean;
  isTripMutationPending: boolean;
  onCloseCreateTrip: () => void;
  onCreateTrip: (name: string) => void | Promise<void>;
  onOpenCreateTrip: () => void;
  sharedStyles: SharedLocationSectionStyles;
  styles: ActiveItemsSectionStyles;
  suggestedTripName: string;
  tripSummaryLabel: string;
};

export function ActiveItemsOverviewCard({
  activeSummaryLabel,
  isCreateTripComposerVisible,
  isTripMutationPending,
  onCloseCreateTrip,
  onCreateTrip,
  onOpenCreateTrip,
  sharedStyles,
  styles,
  suggestedTripName,
  tripSummaryLabel,
}: ActiveItemsOverviewCardProps) {
  return (
    <View style={sharedStyles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={sharedStyles.sectionHeader}>
          <Text style={sharedStyles.sectionTitle}>Active</Text>
          <Text style={sharedStyles.sectionMeta}>
            {activeSummaryLabel} | {tripSummaryLabel}
          </Text>
        </View>

        {!isCreateTripComposerVisible ? (
          <Pressable
            accessibilityRole="button"
            disabled={isTripMutationPending}
            onPress={onOpenCreateTrip}
            style={({ pressed }) => [
              styles.sectionActionButton,
              pressed && styles.sectionActionButtonPressed,
              isTripMutationPending && styles.disabledAction,
            ]}
          >
            <Text style={styles.sectionActionButtonText}>+ Create trip</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={sharedStyles.sectionHint}>
        Track the locations and journeys you are currently focusing on. Remove
        an item with the minus button when you are done with it, or group items
        into custom trips below.
      </Text>

      {isCreateTripComposerVisible ? (
        <CreateTripComposer
          initialName={suggestedTripName}
          isSubmitting={isTripMutationPending}
          onCancel={onCloseCreateTrip}
          onSave={onCreateTrip}
          title="Create trip"
        />
      ) : null}
    </View>
  );
}
