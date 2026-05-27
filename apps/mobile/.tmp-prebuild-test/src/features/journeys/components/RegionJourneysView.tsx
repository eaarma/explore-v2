import { useMemo, type ReactNode } from "react";
import { FlashList } from "@shopify/flash-list";
import { Pressable, ScrollView, Text, View } from "react-native";

import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import {
  JOURNEY_REGION_SORT_OPTIONS,
  type JourneyRegionGroup,
  type JourneyRegionSortKey,
  type NearbyJourneyItem,
  styles,
} from "@/src/features/journeys/components/journeysSectionShared";
import { Journey } from "@/src/features/journeys/types/journeyTypes";

type RegionJourneyRow =
  | {
      key: string;
      type: "group";
      county: string;
      journeyCount: number;
      isExpanded: boolean;
    }
  | {
      key: string;
      type: "journey";
      county: string;
      journeyItem: NearbyJourneyItem;
    };

type RegionJourneysViewProps = {
  headerContent: ReactNode;
  selectedCategories: string[];
  availableCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearCategories: () => void;
  sortBy: JourneyRegionSortKey;
  onSelectSort: (sortBy: JourneyRegionSortKey) => void;
  isLoadingJourneys: boolean;
  journeysError: string | null;
  regionGroups: JourneyRegionGroup[];
  filteredJourneyCount: number;
  shouldAutoExpandRegion: boolean;
  expandedCounties: Record<string, boolean>;
  firstCounty: string | null;
  onToggleCounty: (county: string) => void;
  expandedJourneyId: number | null;
  onToggleJourney: (journeyId: number) => void;
  activeToggleJourneyId: number | null;
  onToggleJourneyActive: (journey: Journey) => void;
  onShowJourneyOnMap: (journey: Journey) => void;
  onViewJourneyDetails: (journey: Journey) => void;
};

export function RegionJourneysView({
  headerContent,
  selectedCategories,
  availableCategories,
  onToggleCategory,
  onClearCategories,
  sortBy,
  onSelectSort,
  isLoadingJourneys,
  journeysError,
  regionGroups,
  filteredJourneyCount,
  shouldAutoExpandRegion,
  expandedCounties,
  firstCounty,
  onToggleCounty,
  expandedJourneyId,
  onToggleJourney,
  activeToggleJourneyId,
  onToggleJourneyActive,
  onShowJourneyOnMap,
  onViewJourneyDetails,
}: RegionJourneysViewProps) {
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
    <FlashList<RegionJourneyRow>
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={!isLoadingJourneys && !journeysError ? regionRows : []}
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
                      {formatJourneyCount(item.journeyCount)}
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
          <View style={styles.regionJourneyRowContainer}>
            <View style={styles.regionJourneyCard}>
              <JourneyListCard
                journey={item.journeyItem.journey}
                distanceKm={null}
                showDistance={false}
                stopCount={item.journeyItem.stopCount}
                previewImageUrl={item.journeyItem.previewImageUrl}
                isExpanded={expandedJourneyId === item.journeyItem.journey.id}
                onToggle={() => onToggleJourney(item.journeyItem.journey.id)}
                isActiveTogglePending={
                  activeToggleJourneyId === item.journeyItem.journey.id
                }
                onToggleActive={() =>
                  onToggleJourneyActive(item.journeyItem.journey)
                }
                onShowOnMap={() => onShowJourneyOnMap(item.journeyItem.journey)}
                onViewDetails={() =>
                  onViewJourneyDetails(item.journeyItem.journey)
                }
              />
            </View>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
      ListHeaderComponent={
        <View style={styles.content}>
          {headerContent}

          <View style={styles.controlBlock}>
            <Text style={styles.controlLabel}>Sort</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {JOURNEY_REGION_SORT_OPTIONS.map((option) => {
                const isActive = sortBy === option.key;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => onSelectSort(option.key)}
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
            </ScrollView>
          </View>

          <View style={styles.controlBlock}>
            <Text style={styles.controlLabel}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Pressable
                onPress={onClearCategories}
                style={[
                  styles.filterChip,
                  selectedCategories.length === 0 && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategories.length === 0 &&
                      styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>

              {availableCategories.map((category) => {
                const isActive = selectedCategories.includes(category);

                return (
                  <Pressable
                    key={category}
                    onPress={() => onToggleCategory(category)}
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
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {isLoadingJourneys ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Loading journeys</Text>
              <Text style={styles.stateCopy}>
                Pulling the journey catalog and county browse structure from
                local cache.
              </Text>
            </View>
          ) : null}

          {!isLoadingJourneys && journeysError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Journeys unavailable</Text>
              <Text style={styles.stateCopy}>{journeysError}</Text>
            </View>
          ) : null}

          {!isLoadingJourneys && !journeysError ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Estonia</Text>
                <Text style={styles.sectionMeta}>
                  {regionGroups.length} counties | {filteredJourneyCount}{" "}
                  journeys
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoadingJourneys && !journeysError ? (
          <View style={styles.listItemContainer}>
            <View style={styles.stateCard}>
              <Text style={styles.emptyCopy}>
                No journeys match the current search and category filters.
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
  regionGroups: JourneyRegionGroup[],
  shouldAutoExpandRegion: boolean,
  expandedCounties: Record<string, boolean>,
  firstCounty: string | null,
) {
  const rows: RegionJourneyRow[] = [];

  for (const group of regionGroups) {
    const isExpanded =
      shouldAutoExpandRegion ||
      (expandedCounties[group.county] ?? group.county === firstCounty);

    rows.push({
      key: `group-${group.county}`,
      type: "group",
      county: group.county,
      journeyCount: group.journeys.length,
      isExpanded,
    });

    if (!isExpanded) {
      continue;
    }

    for (const journeyItem of group.journeys) {
      rows.push({
        key: `journey-${group.county}-${journeyItem.journey.id}`,
        type: "journey",
        county: group.county,
        journeyItem,
      });
    }
  }

  return rows;
}

function formatJourneyCount(journeyCount: number) {
  if (journeyCount === 1) {
    return "1 journey";
  }

  return `${journeyCount} journeys`;
}
