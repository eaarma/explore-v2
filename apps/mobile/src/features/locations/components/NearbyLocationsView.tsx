import type { ReactNode } from "react";
import { FlashList } from "@shopify/flash-list";
import { Pressable, ScrollView, Text, View } from "react-native";

import { LocationListCard } from "@/src/features/locations/components/LocationListCard";
import {
  type LocationPermissionState,
  type NearbyLocationItem,
  type NearbyMode,
  useLocationSectionStyles,
} from "@/src/features/locations/components/locationsSectionShared";

type RangeOption = {
  key: string;
  label: string;
  value: number;
};

type NearbyLocationsViewProps = {
  headerContent: ReactNode;
  sortAndCategoryControls: ReactNode;
  nearbyMode: NearbyMode;
  rangeOptions: readonly RangeOption[];
  browseLabel: string;
  selectedRange: number;
  onSelectRange: (value: number) => void;
  onSelectBrowseMode: () => void;
  isLoadingLocations: boolean;
  locationsError: string | null;
  canShowNearbyResults: boolean;
  locationPermissionState: LocationPermissionState;
  nearbyLocations: NearbyLocationItem[];
  nearbySectionTitle: string;
  nearbySectionMeta: string;
  expandedLocationId: number | null;
  onToggleLocation: (locationId: number) => void;
  activeToggleLocationId: number | null;
  onToggleLocationActive: (location: NearbyLocationItem["location"]) => void;
  onShowLocationOnMap: (location: NearbyLocationItem["location"]) => void;
  onViewLocationDetails: (location: NearbyLocationItem["location"]) => void;
  showActiveToggle?: boolean;
  viewDetailsLabel?: string;
};

export function NearbyLocationsView({
  headerContent,
  sortAndCategoryControls,
  nearbyMode,
  rangeOptions,
  browseLabel,
  selectedRange,
  onSelectRange,
  onSelectBrowseMode,
  isLoadingLocations,
  locationsError,
  canShowNearbyResults,
  locationPermissionState,
  nearbyLocations,
  nearbySectionTitle,
  nearbySectionMeta,
  expandedLocationId,
  onToggleLocation,
  activeToggleLocationId,
  onToggleLocationActive,
  onShowLocationOnMap,
  onViewLocationDetails,
  showActiveToggle = true,
  viewDetailsLabel = "View details",
}: NearbyLocationsViewProps) {
  const styles = useLocationSectionStyles();
  const listData = canShowNearbyResults ? nearbyLocations : [];

  return (
    <FlashList<NearbyLocationItem>
      key={`nearby-locations-${nearbyMode}`}
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={listData}
      keyExtractor={(item) => String(item.location.id)}
      renderItem={({ item }) => {
        return (
          <View style={styles.listItemContainer}>
            <LocationListCard
              location={item.location}
              distanceKm={item.distanceKm}
              showDistance={nearbyMode === "radius"}
              isExpanded={expandedLocationId === item.location.id}
              onToggle={() => onToggleLocation(item.location.id)}
              isActiveTogglePending={activeToggleLocationId === item.location.id}
              onToggleActive={() => onToggleLocationActive(item.location)}
              onShowOnMap={() => onShowLocationOnMap(item.location)}
              onViewDetails={() => onViewLocationDetails(item.location)}
              showActiveToggle={showActiveToggle}
              viewDetailsLabel={viewDetailsLabel}
            />
          </View>
        );
      }}
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

          {isLoadingLocations ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Loading locations</Text>
              <Text style={styles.stateCopy}>
                Pulling the location catalog and your nearby view.
              </Text>
            </View>
          ) : null}

          {!isLoadingLocations && locationsError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Locations unavailable</Text>
              <Text style={styles.stateCopy}>{locationsError}</Text>
            </View>
          ) : null}

          {!isLoadingLocations && !locationsError && !canShowNearbyResults ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Nearby needs your location</Text>
              <Text style={styles.stateCopy}>
                {locationPermissionState === "denied"
                  ? "Allow location access or switch to All Estonia to browse the full catalog."
                  : "We could not resolve your position. Try All Estonia or use Region view for manual exploration."}
              </Text>
            </View>
          ) : null}

          {!isLoadingLocations && !locationsError && canShowNearbyResults ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{nearbySectionTitle}</Text>
                <Text style={styles.sectionMeta}>{nearbySectionMeta}</Text>
              </View>

              {nearbyMode === "browse" ? (
                <Text style={styles.sectionHint}>
                  Planning mode for country-wide browsing. Results show county
                  and category instead of distance.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoadingLocations && !locationsError && canShowNearbyResults ? (
          <View style={styles.listItemContainer}>
            <View style={styles.stateCard}>
              <Text style={styles.emptyCopy}>
                No locations match the current range, search, and filters.
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
