import type { ReactNode } from "react";
import { FlashList } from "@shopify/flash-list";
import { Pressable, ScrollView, Text, View } from "react-native";

import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import {
  type JourneyNearbyMode,
  type JourneyPermissionState,
  type JourneyRangeValue,
  type NearbyJourneyItem,
  useJourneySectionStyles,
} from "@/src/features/journeys/components/journeysSectionShared";

type RangeOption = {
  key: string;
  label: string;
  value: JourneyRangeValue;
};

type NearbyJourneysViewProps = {
  headerContent: ReactNode;
  sortAndCategoryControls: ReactNode;
  nearbyMode: JourneyNearbyMode;
  rangeOptions: readonly RangeOption[];
  browseLabel: string;
  selectedRange: JourneyRangeValue;
  onSelectRange: (range: JourneyRangeValue) => void;
  onSelectBrowseMode: () => void;
  isLoadingJourneys: boolean;
  journeysError: string | null;
  permissionState: JourneyPermissionState;
  canShowNearbyJourneys: boolean;
  nearbyJourneys: NearbyJourneyItem[];
  nearbySectionTitle: string;
  nearbySectionMeta: string;
  expandedJourneyId: number | null;
  onToggleJourney: (journeyId: number) => void;
  activeToggleJourneyId: number | null;
  onToggleJourneyActive: (journey: NearbyJourneyItem["journey"]) => void;
  onShowJourneyOnMap: (journey: NearbyJourneyItem["journey"]) => void;
  onViewJourneyDetails: (journey: NearbyJourneyItem["journey"]) => void;
  showActiveToggle?: boolean;
  viewDetailsLabel?: string;
};

export function NearbyJourneysView({
  headerContent,
  sortAndCategoryControls,
  nearbyMode,
  rangeOptions,
  browseLabel,
  selectedRange,
  onSelectRange,
  onSelectBrowseMode,
  isLoadingJourneys,
  journeysError,
  permissionState,
  canShowNearbyJourneys,
  nearbyJourneys,
  nearbySectionTitle,
  nearbySectionMeta,
  expandedJourneyId,
  onToggleJourney,
  activeToggleJourneyId,
  onToggleJourneyActive,
  onShowJourneyOnMap,
  onViewJourneyDetails,
  showActiveToggle = true,
  viewDetailsLabel = "View details",
}: NearbyJourneysViewProps) {
  const styles = useJourneySectionStyles();
  const listData = canShowNearbyJourneys ? nearbyJourneys : [];

  return (
    <FlashList<NearbyJourneyItem>
      key={`nearby-journeys-${nearbyMode}`}
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={listData}
      keyExtractor={(item) => String(item.journey.id)}
      renderItem={({ item }) => (
        <View style={styles.listItemContainer}>
          <JourneyListCard
            journey={item.journey}
            distanceKm={item.distanceKm}
            showDistance={nearbyMode === "radius"}
            stopCount={item.stopCount}
            previewImageUrl={item.previewImageUrl}
            isExpanded={expandedJourneyId === item.journey.id}
            onToggle={() => onToggleJourney(item.journey.id)}
            isActiveTogglePending={activeToggleJourneyId === item.journey.id}
            onToggleActive={() => onToggleJourneyActive(item.journey)}
            onShowOnMap={() => onShowJourneyOnMap(item.journey)}
            onViewDetails={() => onViewJourneyDetails(item.journey)}
            showActiveToggle={showActiveToggle}
            viewDetailsLabel={viewDetailsLabel}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
      ListHeaderComponent={
        <View style={styles.content}>
          {headerContent}

          <View style={styles.controlBlock}>
            <Text style={styles.controlLabel}>Nearby</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {rangeOptions.map((option) => {
                const isActive =
                  nearbyMode === "radius" && selectedRange === option.value;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => onSelectRange(option.value)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={onSelectBrowseMode}
                style={[
                  styles.filterChip,
                  nearbyMode === "browse" && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    nearbyMode === "browse" && styles.filterChipTextActive,
                  ]}
                >
                  {browseLabel}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {sortAndCategoryControls}

          {isLoadingJourneys ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Loading journeys</Text>
              <Text style={styles.stateCopy}>
                Pulling journey routes and nearby starting points from local
                cache.
              </Text>
            </View>
          ) : null}

          {!isLoadingJourneys && journeysError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Journeys unavailable</Text>
              <Text style={styles.stateCopy}>{journeysError}</Text>
            </View>
          ) : null}

          {!isLoadingJourneys && !journeysError && !canShowNearbyJourneys ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Nearby journeys need location</Text>
              <Text style={styles.stateCopy}>
                {permissionState === "denied"
                  ? "Allow location access or switch to All Estonia to browse the full journey catalog."
                  : "We could not resolve your position. Try All Estonia or use Region view for manual planning."}
              </Text>
            </View>
          ) : null}

          {!isLoadingJourneys && !journeysError && canShowNearbyJourneys ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{nearbySectionTitle}</Text>
                <Text style={styles.sectionMeta}>{nearbySectionMeta}</Text>
              </View>

              {nearbyMode === "browse" ? (
                <Text style={styles.sectionHint}>
                  Planning mode for country-wide browsing. Results skip distance
                  calculations and focus on route details instead.
                </Text>
              ) : (
                <Text style={styles.sectionHint}>
                  Discover journeys by how close their starting point is to you.
                  Expand a card to compare route length, stop count, and the
                  first available preview image.
                </Text>
              )}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoadingJourneys && !journeysError && canShowNearbyJourneys ? (
          <View style={styles.listItemContainer}>
            <View style={styles.stateCard}>
              <Text style={styles.emptyCopy}>
                {nearbyMode === "browse"
                  ? "No journeys match the current search and filters."
                  : "No journeys match the current range, search, and filters."}
              </Text>
            </View>
          </View>
        ) : null
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}
