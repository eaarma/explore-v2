import { useMemo, type ReactNode } from "react";
import { FlashList } from "@shopify/flash-list";
import { Pressable, Text, View } from "react-native";

import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import {
  type JourneyRegionGroup,
  type NearbyJourneyItem,
  useJourneySectionStyles,
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
  sortAndCategoryControls: ReactNode;
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
  showActiveToggle?: boolean;
  viewDetailsLabel?: string;
};

export function RegionJourneysView({
  headerContent,
  sortAndCategoryControls,
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
  showActiveToggle = true,
  viewDetailsLabel = "View details",
}: RegionJourneysViewProps) {
  const styles = useJourneySectionStyles();
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
  const listData = regionRows;

  return (
    <FlashList<RegionJourneyRow>
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={listData}
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
                showActiveToggle={showActiveToggle}
                viewDetailsLabel={viewDetailsLabel}
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
