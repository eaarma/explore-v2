import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import { syncActiveContentCache } from "@/src/features/content/storage/contentSync";
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
  JOURNEY_REGION_SORT_OPTIONS,
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
  useJourneySectionColors,
  useJourneySectionStyles,
} from "@/src/features/journeys/components/journeysSectionShared";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import {
  getCachedJourneyLocations,
  getCachedJourneys,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import {
  SectionCategorySelector,
  SectionChipSelector,
  SectionSearchField,
  SectionSegmentedControl,
} from "@/src/shared/components/SectionControls";
import {
  type UserCoordinates,
  useResolvedUserCoordinates,
} from "@/src/shared/hooks/useResolvedUserCoordinates";
import { useDeferredSearchQuery } from "@/src/shared/hooks/useDeferredSearchQuery";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import {
  calculateDistanceKm,
  getCreatedAtTime,
  normalizeCounty,
  normalizeSearchValue,
} from "@/src/shared/utils/browseSectionUtils";
import { toggleValueInArray } from "@/src/shared/utils/selectionUtils";

const JOURNEY_BROWSE_OPTION = {
  key: "all-estonia",
  label: "All Estonia",
} as const;

const JOURNEY_BROWSE_SORT_OPTIONS = [
  { key: "active", label: "Active" },
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

type JourneyBrowseSortKey = Exclude<JourneySortKey, "distance">;

export function JourneysSection() {
  const styles = useJourneySectionStyles();
  const colors = useJourneySectionColors();
  const router = useRouter();
  const resolveUserCoordinates = useResolvedUserCoordinates();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore(
    (state) => state.markUpdated,
  );
  const contentRevision = useContentSyncStore((state) => state.revision);
  const {
    searchQuery,
    setSearchQuery,
    searchInputRef,
    activeSearchQuery,
    clearSearchQuery,
  } = useDeferredSearchQuery();
  const [journeyView, setJourneyView] = useState<JourneyViewKey>("nearby");
  const [nearbyMode, setNearbyMode] = useState<JourneyNearbyMode>("radius");
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
  const resolveUserCoordinatesRef = useRef(resolveUserCoordinates);
  const journeysRef = useRef(journeys);
  resolveUserCoordinatesRef.current = resolveUserCoordinates;
  journeysRef.current = journeys;

  useEffect(() => {
    let isMounted = true;

    async function loadJourneysScreenData() {
      setIsLoadingJourneys(true);
      const positionPromise = resolveUserCoordinatesRef.current();

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

    async function syncJourneyFlags() {
      if (!user?.id || journeysRef.current.length === 0) {
        return;
      }

      const nextJourneys = await hydrateJourneysWithProgress(
        user.id,
        journeysRef.current,
      );

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setJourneys(nextJourneys);
      });
    }

    void syncJourneyFlags();

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
    setSelectedCategories((current) => toggleValueInArray(current, category));
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

  const sharedHeaderControls = (
    <>
      <SectionSearchField
        inputRef={searchInputRef}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearchQuery}
        placeholder="Search journeys, counties, categories"
        placeholderTextColor={colors.controlLabel}
        styles={styles}
      />
      <SectionSegmentedControl
        label="View"
        activeKey={journeyView}
        options={JOURNEY_VIEW_TABS}
        onSelect={setJourneyView}
        styles={styles}
      />
    </>
  );

  const sharedSortAndCategoryControls = (
    <>
      <SectionChipSelector
        label="Sort"
        activeKey={
          journeyView === "nearby"
            ? sortBy
            : regionSortBy
        }
        options={
          journeyView === "nearby"
            ? nearbySortOptions
            : JOURNEY_REGION_SORT_OPTIONS
        }
        onSelect={(optionKey) => {
          if (journeyView === "nearby") {
            setSortBy(optionKey as JourneySortKey);
            return;
          }

          setRegionSortBy(optionKey as JourneyRegionSortKey);
        }}
        styles={styles}
      />
      <SectionCategorySelector
        label="Categories"
        options={availableCategories.map((category) => ({
          key: category,
          label: category,
        }))}
        selectedKeys={selectedCategories}
        onToggle={toggleCategory}
        onClear={() => setSelectedCategories([])}
        styles={styles}
      />
    </>
  );

  if (journeyView === "nearby") {
    return (
      <NearbyJourneysView
        headerContent={sharedHeaderControls}
        sortAndCategoryControls={sharedSortAndCategoryControls}
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
      sortAndCategoryControls={sharedSortAndCategoryControls}
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
  if (sortBy === "active") {
    return compareActiveJourneys(left.journey, right.journey);
  }

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
  if (sortBy === "active") {
    return compareActiveJourneys(left.journey, right.journey);
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

function compareRegionJourneys(
  left: NearbyJourneyItem,
  right: NearbyJourneyItem,
  sortBy: JourneyRegionSortKey,
) {
  if (sortBy === "active") {
    return compareActiveJourneys(left.journey, right.journey);
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

function compareActiveJourneys(
  left: Pick<Journey, "active" | "title">,
  right: Pick<Journey, "active" | "title">,
) {
  const leftRank = left.active === true ? 0 : 1;
  const rightRank = right.active === true ? 0 : 1;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return getJourneyTitle(left).localeCompare(getJourneyTitle(right));
}

function getJourneyTitle(journey: Pick<Journey, "title">) {
  const trimmedTitle =
    typeof journey.title === "string" ? journey.title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}
