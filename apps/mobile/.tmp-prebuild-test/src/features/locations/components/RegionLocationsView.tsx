import { useMemo, type ReactNode } from "react";
import { FlashList } from "@shopify/flash-list";
import { Pressable, Text, View } from "react-native";

import { LocationListCard } from "@/src/features/locations/components/LocationListCard";
import {
  type RegionGroup,
  styles,
} from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";

type RegionListRow =
  | {
      key: string;
      type: "group";
      county: string;
      locationCount: number;
      isExpanded: boolean;
    }
  | {
      key: string;
      type: "location";
      county: string;
      location: Location;
    };

type RegionLocationsViewProps = {
  headerContent: ReactNode;
  sortAndCategoryControls: ReactNode;
  isLoadingLocations: boolean;
  locationsError: string | null;
  regionGroups: RegionGroup[];
  filteredLocationCount: number;
  shouldAutoExpandRegion: boolean;
  expandedCounties: Record<string, boolean>;
  firstCounty: string | null;
  onToggleCounty: (county: string) => void;
  expandedLocationId: number | null;
  onToggleLocation: (locationId: number) => void;
  activeToggleLocationId: number | null;
  onToggleLocationActive: (location: Location) => void;
  onShowLocationOnMap: (location: Location) => void;
  onViewLocationDetails: (location: Location) => void;
};

export function RegionLocationsView({
  headerContent,
  sortAndCategoryControls,
  isLoadingLocations,
  locationsError,
  regionGroups,
  filteredLocationCount,
  shouldAutoExpandRegion,
  expandedCounties,
  firstCounty,
  onToggleCounty,
  expandedLocationId,
  onToggleLocation,
  activeToggleLocationId,
  onToggleLocationActive,
  onShowLocationOnMap,
  onViewLocationDetails,
}: RegionLocationsViewProps) {
  const regionRows = useMemo(
    () =>
      buildRegionRows(
        regionGroups,
        shouldAutoExpandRegion,
        expandedCounties,
        firstCounty,
      ),
    [expandedCounties, firstCounty, regionGroups, shouldAutoExpandRegion],
  );

  return (
    <FlashList<RegionListRow>
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={!isLoadingLocations && !locationsError ? regionRows : []}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        if (item.type === "group") {
          return (
            <View style={styles.listItemContainer}>
              <View style={styles.regionGroupCard}>
                <Pressable
                  onPress={() => onToggleCounty(item.county)}
                  style={styles.regionGroupButton}
                >
                  <View>
                    <Text style={styles.regionGroupTitle}>{item.county}</Text>
                    <Text style={styles.regionGroupMeta}>
                      {item.locationCount} locations
                    </Text>
                  </View>

                  <Text style={styles.regionToggle}>
                    {item.isExpanded ? "-" : "+"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.regionLocationRowContainer}>
            <View style={styles.regionLocationCard}>
              <LocationListCard
                location={item.location}
                distanceKm={null}
                showDistance={false}
                isExpanded={expandedLocationId === item.location.id}
                onToggle={() => onToggleLocation(item.location.id)}
                isActiveTogglePending={
                  activeToggleLocationId === item.location.id
                }
                onToggleActive={() => onToggleLocationActive(item.location)}
                onShowOnMap={() => onShowLocationOnMap(item.location)}
                onViewDetails={() => onViewLocationDetails(item.location)}
              />
            </View>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
      ListHeaderComponent={
        <View style={styles.content}>
          {headerContent}
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

          {!isLoadingLocations && !locationsError ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Estonia</Text>
                <Text style={styles.sectionMeta}>
                  {regionGroups.length} counties . {filteredLocationCount}{" "}
                  locations
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoadingLocations && !locationsError ? (
          <View style={styles.listItemContainer}>
            <View style={styles.stateCard}>
              <Text style={styles.emptyCopy}>
                No locations match the current search and category filters.
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

function buildRegionRows(
  regionGroups: RegionGroup[],
  shouldAutoExpandRegion: boolean,
  expandedCounties: Record<string, boolean>,
  firstCounty: string | null,
) {
  const rows: RegionListRow[] = [];

  for (const group of regionGroups) {
    const isExpanded =
      shouldAutoExpandRegion ||
      (expandedCounties[group.county] ?? group.county === firstCounty);

    rows.push({
      key: `group-${group.county}`,
      type: "group",
      county: group.county,
      locationCount: group.locations.length,
      isExpanded,
    });

    if (!isExpanded) {
      continue;
    }

    for (const location of group.locations) {
      rows.push({
        key: `location-${group.county}-${location.id}`,
        type: "location",
        county: group.county,
        location,
      });
    }
  }

  return rows;
}
