import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { LocationManager } from "@maplibre/maplibre-react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  clearActiveItem,
  hydrateJourneysWithProgress,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getActiveJourneys } from "@/src/features/journeys/api/journeysApi";
import { NearbyJourneysView } from "@/src/features/journeys/components/NearbyJourneysView";
import { RegionJourneysView } from "@/src/features/journeys/components/RegionJourneysView";
import {
  JOURNEY_RANGE_OPTIONS,
  JOURNEY_SORT_OPTIONS,
  JOURNEY_VIEW_TABS,
  PREFERRED_JOURNEY_CATEGORIES,
  type JourneyNearbyMode,
  type JourneyPermissionState,
  type JourneyRegionGroup,
  type JourneyRegionSortKey,
  type JourneyRangeValue,
  type JourneySortKey,
  type JourneyViewKey,
  type NearbyJourneyItem,
  normalizeCategory,
  styles,
} from "@/src/features/journeys/components/journeysSectionShared";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
  getCachedJourneyLocations,
  getCachedJourneys,
  initializeContentCache,
  syncActiveContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

type PositionResolution = {
  status: Exclude<JourneyPermissionState, "loading">;
  coordinates: UserCoordinates | null;
};

const JOURNEY_BROWSE_OPTION = {
  key: "all-estonia",
  label: "All Estonia",
} as const;

const JOURNEY_BROWSE_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

type JourneyBrowseSortKey = Exclude<JourneySortKey, "distance">;

export function JourneysSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore(
    (state) => state.markUpdated,
  );
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [journeyView, setJourneyView] = useState<JourneyViewKey>("nearby");
  const [nearbyMode, setNearbyMode] = useState<JourneyNearbyMode>("radius");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);
  const activeSearchQuery =
    normalizedSearchQuery.length === 0 ? normalizedSearchQuery : deferredSearchQuery;
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [journeyLocations, setJourneyLocations] = useState<JourneyLocation[]>(
    [],
  );
  const [isLoadingJourneys, setIsLoadingJourneys] = useState(true);
  const [journeysError, setJourneysError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<JourneyPermissionState>("loading");
  const [userCoordinates, setUserCoordinates] =
    useState<UserCoordinates | null>(null);
  const [selectedRange, setSelectedRange] = useState<JourneyRangeValue>(25);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<JourneySortKey>("distance");
  const [regionSortBy, setRegionSortBy] =
    useState<JourneyRegionSortKey>("name");
  const [expandedCounties, setExpandedCounties] = useState<
    Record<string, boolean>
  >({});
  const [expandedJourneyId, setExpandedJourneyId] = useState<number | null>(
    null,
  );
  const [activeToggleJourneyId, setActiveToggleJourneyId] = useState<
    number | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJourneysScreenData() {
      setIsLoadingJourneys(true);
      const positionPromise = resolveUserCoordinates();

      try {
        await initializeContentCache();

        let cachedJourneys = await getCachedJourneys();
        cachedJourneys = await hydrateJourneysWithProgress(user?.id, cachedJourneys);
        let cachedJourneyLocations: JourneyLocation[] = [];

        try {
          cachedJourneyLocations = await getCachedJourneyLocations();
        } catch {
          cachedJourneyLocations = [];
        }

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setJourneys(cachedJourneys);
          setJourneyLocations(cachedJourneyLocations);
          setJourneysError(null);
        });

        if (cachedJourneys.length > 0) {
          setIsLoadingJourneys(false);
        }

        try {
          const { didBootstrap } = await bootstrapContentCacheIfNeeded();

          if (didBootstrap) {
            cachedJourneys = await getCachedJourneys();
            cachedJourneys = await hydrateJourneysWithProgress(user?.id, cachedJourneys);
          }
        } catch {
          if (cachedJourneys.length === 0) {
            try {
              const syncedContent = await syncActiveContentCache();
              cachedJourneys = await hydrateJourneysWithProgress(
                user?.id,
                syncedContent.journeys,
              );
            } catch {
              cachedJourneys = await hydrateJourneysWithProgress(
                user?.id,
                await getActiveJourneys(),
              );
            }
          }
        }

        try {
          const { didBootstrap } = await bootstrapJourneyLocationsCacheIfNeeded();

          if (didBootstrap || cachedJourneyLocations.length === 0) {
            cachedJourneyLocations = await getCachedJourneyLocations();
          }
        } catch {
          if (cachedJourneyLocations.length === 0) {
            cachedJourneyLocations = [];
          }
        }

        const positionResult = await positionPromise;

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setJourneys(cachedJourneys);
          setJourneyLocations(cachedJourneyLocations);
          setJourneysError(null);
          setPermissionState(positionResult.status);
          setUserCoordinates(positionResult.coordinates);
        });
      } catch {
        let liveJourneys: Journey[] = [];

        try {
          liveJourneys = await hydrateJourneysWithProgress(
            user?.id,
            await getActiveJourneys(),
          );
        } catch {
          liveJourneys = [];
        }

        const positionResult = await positionPromise;

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setJourneys(liveJourneys);
          setJourneyLocations([]);
          setJourneysError(
            liveJourneys.length === 0
              ? "Could not load journeys right now."
              : null,
          );
          setPermissionState(positionResult.status);
          setUserCoordinates(positionResult.coordinates);
        });
      } finally {
        if (isMounted) {
          setIsLoadingJourneys(false);
        }
      }
    }

    loadJourneysScreenData();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, progressRevision, user?.id]);

  useEffect(() => {
    let isMounted = true;

    async function syncActiveJourneyFlags() {
      if (!user?.id || journeys.length === 0) {
        return;
      }

      const nextJourneys = await hydrateJourneysWithProgress(user.id, journeys);

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setJourneys(nextJourneys);
      });
    }

    void syncActiveJourneyFlags();

    return () => {
      isMounted = false;
    };
  }, [activeItemsRevision, user?.id]);

  const availableCategories = useMemo(
    () => buildAvailableJourneyCategories(journeys),
    [journeys],
  );

  const filteredJourneys = useMemo(() => {
    return journeys.filter((journey) => {
      if (!matchesJourneySearch(journey, activeSearchQuery)) {
        return false;
      }

      if (selectedCategories.length === 0) {
        return true;
      }

      return selectedCategories.includes(normalizeCategory(journey.category));
    });
  }, [activeSearchQuery, journeys, selectedCategories]);

  const journeyMetaByJourneyId = useMemo(
    () => buildJourneyLocationMeta(journeyLocations),
    [journeyLocations],
  );

  const browseSortBy: JourneyBrowseSortKey =
    sortBy === "distance" ? "name" : sortBy;

  const nearbyJourneys = useMemo(() => {
    if (nearbyMode === "browse") {
      return filteredJourneys
        .map((journey) => {
          const journeyMeta = journeyMetaByJourneyId.get(journey.id);

          return {
            journey,
            distanceKm: null,
            stopCount: journeyMeta?.stopCount ?? 0,
            previewImageUrl: journeyMeta?.previewImageUrl ?? null,
          };
        })
        .sort((left, right) => compareBrowseJourneys(left, right, browseSortBy));
    }

    return filteredJourneys
      .map((journey) => {
        const journeyMeta = journeyMetaByJourneyId.get(journey.id);

        return {
          journey,
          distanceKm: userCoordinates
            ? calculateDistanceKm(
                userCoordinates.latitude,
                userCoordinates.longitude,
                journey.latitude,
                journey.longitude,
              )
            : null,
          stopCount: journeyMeta?.stopCount ?? 0,
          previewImageUrl: journeyMeta?.previewImageUrl ?? null,
        };
      })
      .filter(
        (item) => item.distanceKm !== null && item.distanceKm <= selectedRange,
      )
      .sort((left, right) => compareNearbyJourneys(left, right, sortBy));
  }, [
    browseSortBy,
    filteredJourneys,
    journeyMetaByJourneyId,
    nearbyMode,
    selectedRange,
    sortBy,
    userCoordinates,
  ]);

  const regionGroups = useMemo(
    () =>
      buildRegionGroups(filteredJourneys, journeyMetaByJourneyId, regionSortBy),
    [filteredJourneys, journeyMetaByJourneyId, regionSortBy],
  );

  const shouldAutoExpandRegion = activeSearchQuery.length > 0;
  const firstCounty = regionGroups[0]?.county ?? null;
  const canShowNearbyJourneys =
    nearbyMode === "browse" || permissionState === "granted";
  const nearbySectionTitle =
    nearbyMode === "browse" ? "All Estonia" : "Nearby journeys";
  const nearbySectionMeta =
    nearbyMode === "browse"
      ? `${nearbyJourneys.length} journeys across Estonia`
      : `${nearbyJourneys.length} within ${selectedRange} km`;
  const nearbySortOptions =
    nearbyMode === "browse"
      ? JOURNEY_BROWSE_SORT_OPTIONS
      : JOURNEY_SORT_OPTIONS;

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function toggleCounty(county: string) {
    setExpandedCounties((current) => ({
      ...current,
      [county]: !(current[county] ?? (county === firstCounty)),
    }));
  }

  function toggleJourney(journeyId: number) {
    setExpandedJourneyId((current) =>
      current === journeyId ? null : journeyId,
    );
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

  function viewJourneyDetails(journey: Journey) {
    router.push({
      pathname: "/journey/[journeyId]",
      params: {
        journeyId: String(journey.id),
      },
    });
  }

  async function toggleJourneyActive(journey: Journey) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    const nextActive = journey.active !== true;
    const nextActiveAt = nextActive ? new Date().toISOString() : null;
    setActiveToggleJourneyId(journey.id);

    try {
      if (nextActive) {
        await markActiveItem({
          userId: currentUserId,
          itemType: "JOURNEY",
          itemId: journey.id,
          createdAt: nextActiveAt ?? undefined,
        });
      } else {
        await clearActiveItem(currentUserId, "JOURNEY", journey.id);
      }

      setJourneys((currentJourneys) =>
        currentJourneys.map((currentJourney) =>
          currentJourney.id === journey.id
            ? {
                ...currentJourney,
                active: nextActive,
                activeAt: nextActiveAt,
              }
            : currentJourney,
        ),
      );
      markActiveItemsUpdated();
    } finally {
      setActiveToggleJourneyId((currentJourneyId) =>
        currentJourneyId === journey.id ? null : currentJourneyId,
      );
    }
  }

  function clearSearchQuery() {
    setSearchQuery("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  const sharedHeaderControls = (
    <>
      <View style={styles.searchInputWrapper}>
        <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search journeys, counties, categories"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchQuery.length > 0 ? (
          <Pressable
            onPress={clearSearchQuery}
            style={styles.searchInputClearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
          >
            <Text style={styles.searchInputClearButtonText}>X</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.controlBlock}>
        <Text style={styles.controlLabel}>View</Text>
        <View style={styles.segmentedRow}>
          {JOURNEY_VIEW_TABS.map((tab) => {
            const isActive = journeyView === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setJourneyView(tab.key)}
                style={[
                  styles.segmentButton,
                  isActive && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    isActive && styles.segmentButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );

  if (journeyView === "nearby") {
    return (
      <NearbyJourneysView
        headerContent={sharedHeaderControls}
        nearbyMode={nearbyMode}
        rangeOptions={JOURNEY_RANGE_OPTIONS}
        browseLabel={JOURNEY_BROWSE_OPTION.label}
        selectedRange={selectedRange}
        onSelectRange={(range) => {
          setNearbyMode("radius");
          setSelectedRange(range);
        }}
        onSelectBrowseMode={() => {
          setNearbyMode("browse");

          if (sortBy === "distance") {
            setSortBy("name");
          }
        }}
        selectedCategories={selectedCategories}
        availableCategories={availableCategories}
        onToggleCategory={toggleCategory}
        onClearCategories={() => setSelectedCategories([])}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        sortOptions={nearbySortOptions}
        isLoadingJourneys={isLoadingJourneys}
        journeysError={journeysError}
        permissionState={permissionState}
        canShowNearbyJourneys={canShowNearbyJourneys}
        nearbyJourneys={nearbyJourneys}
        nearbySectionTitle={nearbySectionTitle}
        nearbySectionMeta={nearbySectionMeta}
        expandedJourneyId={expandedJourneyId}
        onToggleJourney={toggleJourney}
        activeToggleJourneyId={activeToggleJourneyId}
        onToggleJourneyActive={toggleJourneyActive}
        onShowJourneyOnMap={showJourneyOnMap}
        onViewJourneyDetails={viewJourneyDetails}
      />
    );
  }

  return (
    <RegionJourneysView
      headerContent={sharedHeaderControls}
      selectedCategories={selectedCategories}
      availableCategories={availableCategories}
      onToggleCategory={toggleCategory}
      onClearCategories={() => setSelectedCategories([])}
      sortBy={regionSortBy}
      onSelectSort={setRegionSortBy}
      isLoadingJourneys={isLoadingJourneys}
      journeysError={journeysError}
      regionGroups={regionGroups}
      filteredJourneyCount={filteredJourneys.length}
      shouldAutoExpandRegion={shouldAutoExpandRegion}
      expandedCounties={expandedCounties}
      firstCounty={firstCounty}
      onToggleCounty={toggleCounty}
      expandedJourneyId={expandedJourneyId}
      onToggleJourney={toggleJourney}
      activeToggleJourneyId={activeToggleJourneyId}
      onToggleJourneyActive={toggleJourneyActive}
      onShowJourneyOnMap={showJourneyOnMap}
      onViewJourneyDetails={viewJourneyDetails}
    />
  );
}

function resolveUserCoordinates(): Promise<PositionResolution> {
  return (async () => {
    try {
      const granted = await LocationManager.requestPermissions();

      if (!granted) {
        return {
          status: "denied",
          coordinates: null,
        };
      }

      const position = await LocationManager.getCurrentPosition();

      if (!position) {
        return {
          status: "unavailable",
          coordinates: null,
        };
      }

      return {
        status: "granted",
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      };
    } catch {
      return {
        status: "unavailable",
        coordinates: null,
      };
    }
  })();
}

function buildAvailableJourneyCategories(journeys: Journey[]) {
  const categories: string[] = [...PREFERRED_JOURNEY_CATEGORIES];
  const seen = new Set<string>(categories);

  for (const journey of journeys) {
    const category = normalizeCategory(journey.category);

    if (seen.has(category)) {
      continue;
    }

    seen.add(category);
    categories.push(category);
  }

  return categories;
}

function matchesJourneySearch(journey: Journey, query: string) {
  if (!query) {
    return true;
  }

  const searchableFields = [
    journey.title,
    journey.description,
    journey.county,
    normalizeCategory(journey.category),
  ];

  return searchableFields.some((field) =>
    normalizeSearchValue(field).includes(query),
  );
}

function buildJourneyLocationMeta(journeyLocations: JourneyLocation[]) {
  const metaByJourneyId = new Map<
    number,
    { stopCount: number; previewImageUrl: string | null }
  >();

  for (const journeyLocation of journeyLocations) {
    const currentMeta = metaByJourneyId.get(journeyLocation.journeyId) ?? {
      stopCount: 0,
      previewImageUrl: null,
    };

    currentMeta.stopCount += 1;

    if (!currentMeta.previewImageUrl && journeyLocation.imageUrl) {
      currentMeta.previewImageUrl = journeyLocation.imageUrl;
    }

    metaByJourneyId.set(journeyLocation.journeyId, currentMeta);
  }

  return metaByJourneyId;
}

function buildRegionGroups(
  journeys: Journey[],
  journeyMetaByJourneyId: Map<
    number,
    { stopCount: number; previewImageUrl: string | null }
  >,
  sortBy: JourneyRegionSortKey,
): JourneyRegionGroup[] {
  const journeysByCounty = new Map<string, NearbyJourneyItem[]>();

  for (const journey of journeys) {
    const county = normalizeCounty(journey.county);
    const journeyMeta = journeyMetaByJourneyId.get(journey.id);
    const countyJourneys = journeysByCounty.get(county) ?? [];

    countyJourneys.push({
      journey,
      distanceKm: null,
      stopCount: journeyMeta?.stopCount ?? 0,
      previewImageUrl: journeyMeta?.previewImageUrl ?? null,
    });

    journeysByCounty.set(county, countyJourneys);
  }

  return [...journeysByCounty.entries()]
    .sort(([leftCounty], [rightCounty]) =>
      leftCounty.localeCompare(rightCounty),
    )
    .map(([county, countyJourneys]) => ({
      county,
      journeys: [...countyJourneys].sort((left, right) =>
        compareRegionJourneys(left, right, sortBy),
      ),
    }));
}

function compareNearbyJourneys(
  left: {
    journey: Journey;
    distanceKm: number | null;
  },
  right: {
    journey: Journey;
    distanceKm: number | null;
  },
  sortBy: JourneySortKey,
) {
  if (sortBy === "distance") {
    const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
  }

  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.journey.createdAt) -
      getCreatedAtTime(left.journey.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getJourneyTitle(left.journey).localeCompare(
    getJourneyTitle(right.journey),
  );
}

function compareBrowseJourneys(
  left: NearbyJourneyItem,
  right: NearbyJourneyItem,
  sortBy: JourneyBrowseSortKey,
) {
  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.journey.createdAt) -
      getCreatedAtTime(left.journey.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getJourneyTitle(left.journey).localeCompare(
    getJourneyTitle(right.journey),
  );
}

function compareRegionJourneys(
  left: NearbyJourneyItem,
  right: NearbyJourneyItem,
  sortBy: JourneyRegionSortKey,
) {
  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.journey.createdAt) -
      getCreatedAtTime(left.journey.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getJourneyTitle(left.journey).localeCompare(
    getJourneyTitle(right.journey),
  );
}

function normalizeSearchValue(value: string | null | undefined) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function getJourneyTitle(journey: Pick<Journey, "title">) {
  const trimmedTitle =
    typeof journey.title === "string" ? journey.title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}

function getCreatedAtTime(createdAt: string) {
  const parsedTime = Date.parse(createdAt);

  if (Number.isFinite(parsedTime)) {
    return parsedTime;
  }

  return 0;
}

function calculateDistanceKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * arc;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
