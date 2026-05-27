import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  clearActiveItem,
  getActiveItems,
  hydrateJourneysWithProgress,
  hydrateLocationsWithProgress,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { LocationListCard } from "@/src/features/locations/components/LocationListCard";
import { styles as sharedStyles } from "@/src/features/locations/components/locationsSectionShared";
import type { Location } from "@/src/features/locations/types/locationTypes";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
  getCachedJourneyById,
  getCachedJourneyLocationsByJourneyId,
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

type ActiveListItem =
  | {
      key: string;
      kind: "location";
      activeAt: string;
      location: Location;
    }
  | {
      key: string;
      kind: "journey";
      activeAt: string;
      journey: Journey;
      stopCount: number;
      previewImageUrl: string | null;
    };

export function ActiveItemsSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore((state) => state.markUpdated);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [activeItems, setActiveItems] = useState<ActiveListItem[]>([]);
  const [isLoadingActiveItems, setIsLoadingActiveItems] = useState(true);
  const [activeItemsError, setActiveItemsError] = useState<string | null>(null);
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [activeToggleTargetKey, setActiveToggleTargetKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadActiveItemsData() {
      const shouldShowLoadingState = activeItems.length === 0;

      if (shouldShowLoadingState) {
        setIsLoadingActiveItems(true);
      }

      try {
        const nextItems = await resolveActiveListItems(user?.id);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setActiveItems(nextItems);
          setActiveItemsError(null);
        });
      } catch {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setActiveItemsError("Could not load active items right now.");
        });
      } finally {
        if (isMounted) {
          setIsLoadingActiveItems(false);
        }
      }
    }

    void loadActiveItemsData();

    return () => {
      isMounted = false;
    };
  }, [activeItemsRevision, contentRevision, progressRevision, user?.id]);

  useEffect(() => {
    if (!expandedItemKey) {
      return;
    }

    const expandedItemStillExists = activeItems.some(
      (activeItem) => activeItem.key === expandedItemKey,
    );

    if (!expandedItemStillExists) {
      setExpandedItemKey(null);
    }
  }, [activeItems, expandedItemKey]);

  const activeItemCount = activeItems.length;
  const activeSummaryLabel = useMemo(() => {
    if (activeItemCount === 1) {
      return "1 active item";
    }

    return `${activeItemCount} active items`;
  }, [activeItemCount]);

  async function toggleActiveItem(item: ActiveListItem) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    setActiveToggleTargetKey(item.key);

    try {
      if (item.kind === "location") {
        const nextActive = item.location.active !== true;
        const nextActiveAt = nextActive ? new Date().toISOString() : null;

        if (nextActive) {
          await markActiveItem({
            userId: currentUserId,
            itemType: "LOCATION",
            itemId: item.location.id,
            createdAt: nextActiveAt ?? undefined,
          });
        } else {
          await clearActiveItem(currentUserId, "LOCATION", item.location.id);
        }

        setActiveItems((currentItems) =>
          nextActive
            ? currentItems.map((currentItem) =>
                currentItem.key === item.key && currentItem.kind === "location"
                  ? {
                      ...currentItem,
                      activeAt: nextActiveAt ?? currentItem.activeAt,
                      location: {
                        ...currentItem.location,
                        active: true,
                        activeAt: nextActiveAt,
                      },
                    }
                  : currentItem,
              )
            : currentItems.filter((currentItem) => currentItem.key !== item.key),
        );
      } else {
        const nextActive = item.journey.active !== true;
        const nextActiveAt = nextActive ? new Date().toISOString() : null;

        if (nextActive) {
          await markActiveItem({
            userId: currentUserId,
            itemType: "JOURNEY",
            itemId: item.journey.id,
            createdAt: nextActiveAt ?? undefined,
          });
        } else {
          await clearActiveItem(currentUserId, "JOURNEY", item.journey.id);
        }

        setActiveItems((currentItems) =>
          nextActive
            ? currentItems.map((currentItem) =>
                currentItem.key === item.key && currentItem.kind === "journey"
                  ? {
                      ...currentItem,
                      activeAt: nextActiveAt ?? currentItem.activeAt,
                      journey: {
                        ...currentItem.journey,
                        active: true,
                        activeAt: nextActiveAt,
                      },
                    }
                  : currentItem,
              )
            : currentItems.filter((currentItem) => currentItem.key !== item.key),
        );
      }

      markActiveItemsUpdated();
    } finally {
      setActiveToggleTargetKey((currentKey) =>
        currentKey === item.key ? null : currentKey,
      );
    }
  }

  function toggleExpandedItem(itemKey: string) {
    setExpandedItemKey((currentKey) => (currentKey === itemKey ? null : itemKey));
  }

  function showLocationOnMap(location: Location) {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        focusLatitude: String(location.latitude),
        focusLongitude: String(location.longitude),
        focusAt: String(Date.now()),
        focusKind: "location",
        focusItemId: String(location.id),
      },
    });
  }

  function showJourneyOnMap(journey: Journey) {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        focusLatitude: String(journey.latitude),
        focusLongitude: String(journey.longitude),
        focusAt: String(Date.now()),
        focusKind: "journey",
        focusItemId: String(journey.id),
      },
    });
  }

  function viewLocationDetails(location: Location) {
    router.push({
      pathname: "/location/[locationId]",
      params: {
        locationId: String(location.id),
      },
    });
  }

  function viewJourneyDetails(journey: Journey) {
    router.push({
      pathname: "/journey/[journeyId]",
      params: {
        journeyId: String(journey.id),
      },
    });
  }

  return (
    <FlashList<ActiveListItem>
      style={sharedStyles.scrollView}
      contentContainerStyle={sharedStyles.listContent}
      data={!isLoadingActiveItems && !activeItemsError ? activeItems : []}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        if (item.kind === "location") {
          return (
            <View style={sharedStyles.listItemContainer}>
              <View style={styles.itemStack}>
                <View style={styles.kindBadge}>
                  <Text style={styles.kindBadgeText}>Location</Text>
                </View>

                <LocationListCard
                  location={item.location}
                  distanceKm={null}
                  showDistance={false}
                  isExpanded={expandedItemKey === item.key}
                  isActiveTogglePending={activeToggleTargetKey === item.key}
                  onToggle={() => toggleExpandedItem(item.key)}
                  onToggleActive={() => void toggleActiveItem(item)}
                  onShowOnMap={() => showLocationOnMap(item.location)}
                  onViewDetails={() => viewLocationDetails(item.location)}
                />
              </View>
            </View>
          );
        }

        return (
          <View style={sharedStyles.listItemContainer}>
            <View style={styles.itemStack}>
              <View style={styles.kindBadge}>
                <Text style={styles.kindBadgeText}>Journey</Text>
              </View>

              <JourneyListCard
                journey={item.journey}
                distanceKm={null}
                showDistance={false}
                stopCount={item.stopCount}
                previewImageUrl={item.previewImageUrl}
                isExpanded={expandedItemKey === item.key}
                isActiveTogglePending={activeToggleTargetKey === item.key}
                onToggle={() => toggleExpandedItem(item.key)}
                onToggleActive={() => void toggleActiveItem(item)}
                onShowOnMap={() => showJourneyOnMap(item.journey)}
                onViewDetails={() => viewJourneyDetails(item.journey)}
              />
            </View>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={sharedStyles.listSpacer} />}
      ListHeaderComponent={
        <View style={sharedStyles.content}>
          <View style={sharedStyles.sectionCard}>
            <View style={sharedStyles.sectionHeader}>
              <Text style={sharedStyles.sectionTitle}>Active</Text>
              <Text style={sharedStyles.sectionMeta}>{activeSummaryLabel}</Text>
            </View>

            <Text style={sharedStyles.sectionHint}>
              Track the locations and journeys you are currently focusing on.
              Remove an item with the minus button when you are done with it.
            </Text>
          </View>

          {isLoadingActiveItems ? (
            <View style={sharedStyles.stateCard}>
              <Text style={sharedStyles.stateTitle}>Loading active items</Text>
              <Text style={sharedStyles.stateCopy}>
                Pulling your saved active locations and journeys from local
                storage.
              </Text>
            </View>
          ) : null}

          {!isLoadingActiveItems && activeItemsError ? (
            <View style={sharedStyles.stateCard}>
              <Text style={sharedStyles.stateTitle}>Active items unavailable</Text>
              <Text style={sharedStyles.stateCopy}>{activeItemsError}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoadingActiveItems && !activeItemsError ? (
          <View style={sharedStyles.listItemContainer}>
            <View style={sharedStyles.stateCard}>
              <Text style={sharedStyles.emptyCopy}>
                No active items yet. Use the plus button on a location or journey
                to pin it here for quick access.
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

async function resolveActiveListItems(userId: string | null | undefined) {
  if (!userId) {
    return [];
  }

  await initializeContentCache();

  try {
    await bootstrapContentCacheIfNeeded();
  } catch {
    // Keep using whatever is already cached locally.
  }

  try {
    await bootstrapJourneyLocationsCacheIfNeeded();
  } catch {
    // Missing journey stop previews should not block the Active tab.
  }

  const activeRows = await getActiveItems(userId);

  if (activeRows.length === 0) {
    return [];
  }

  const locationIds = activeRows
    .filter((row) => row.itemType === "LOCATION")
    .map((row) => row.itemId);
  const journeyIds = activeRows
    .filter((row) => row.itemType === "JOURNEY")
    .map((row) => row.itemId);

  const [cachedLocations, cachedJourneys, journeyLocationRows] = await Promise.all([
    Promise.all(locationIds.map((locationId) => getCachedLocationById(locationId))),
    Promise.all(journeyIds.map((journeyId) => getCachedJourneyById(journeyId))),
    Promise.all(
      journeyIds.map(async (journeyId) => [
        journeyId,
        await getCachedJourneyLocationsByJourneyId(journeyId),
      ] as const),
    ),
  ]);

  const [hydratedLocations, hydratedJourneys] = await Promise.all([
    hydrateLocationsWithProgress(
      userId,
      cachedLocations.filter((location): location is Location => Boolean(location)),
    ),
    hydrateJourneysWithProgress(
      userId,
      cachedJourneys.filter((journey): journey is Journey => Boolean(journey)),
    ),
  ]);

  const locationsById = new Map(
    hydratedLocations.map((location) => [location.id, location] as const),
  );
  const journeysById = new Map(
    hydratedJourneys.map((journey) => [journey.id, journey] as const),
  );
  const journeyMetaById = new Map(
    journeyLocationRows.map(([journeyId, journeyLocations]) => [
      journeyId,
      buildJourneyMeta(journeyLocations),
    ]),
  );

  return activeRows.flatMap<ActiveListItem>((activeRow) => {
    if (activeRow.itemType === "LOCATION") {
      const location = locationsById.get(activeRow.itemId);

      if (!location) {
        return [];
      }

      return [
        {
          key: `location:${location.id}`,
          kind: "location",
          activeAt: activeRow.createdAt,
          location,
        },
      ];
    }

    const journey = journeysById.get(activeRow.itemId);

    if (!journey) {
      return [];
    }

    const journeyMeta = journeyMetaById.get(journey.id) ?? {
      stopCount: 0,
      previewImageUrl: null,
    };

    return [
      {
        key: `journey:${journey.id}`,
        kind: "journey",
        activeAt: activeRow.createdAt,
        journey,
        stopCount: journeyMeta.stopCount,
        previewImageUrl: journeyMeta.previewImageUrl,
      },
    ];
  });
}

function buildJourneyMeta(
  journeyLocations: {
    imageUrl: string | null;
  }[],
) {
  let previewImageUrl: string | null = null;

  for (const journeyLocation of journeyLocations) {
    if (!previewImageUrl && journeyLocation.imageUrl) {
      previewImageUrl = journeyLocation.imageUrl;
    }
  }

  return {
    stopCount: journeyLocations.length,
    previewImageUrl,
  };
}

const styles = StyleSheet.create({
  itemStack: {
    gap: 8,
  },
  kindBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kindBadgeText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
