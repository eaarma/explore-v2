import {
  startTransition,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Text, TextInput, View } from "react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import { syncActiveContentCache } from "@/src/features/content/storage/contentSync";
import { hydrateJourneysWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getActiveJourneys } from "@/src/features/journeys/api/journeysApi";
import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import { RegionJourneysView } from "@/src/features/journeys/components/RegionJourneysView";
import {
  type JourneyRegionGroup,
  type NearbyJourneyItem,
  PREFERRED_JOURNEY_CATEGORIES,
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
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import {
  getCreatedAtTime,
  normalizeCounty,
  normalizeSearchValue,
} from "@/src/shared/utils/browseSectionUtils";

const JOURNEY_VIEW_TABS = [
  { key: "all-estonia", label: "All Estonia" },
  { key: "region", label: "Region" },
] as const;

const ALL_ESTONIA_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const REGION_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

type JourneyViewKey = (typeof JOURNEY_VIEW_TABS)[number]["key"];
type AllEstoniaSortKey = (typeof ALL_ESTONIA_SORT_OPTIONS)[number]["key"];
type RegionSortKey = (typeof REGION_SORT_OPTIONS)[number]["key"];

export function AdminJourneyViewEditSection() {
  const styles = useJourneySectionStyles();
  const colors = useJourneySectionColors();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [journeyView, setJourneyView] =
    useState<JourneyViewKey>("all-estonia");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [journeyLocations, setJourneyLocations] = useState<JourneyLocation[]>(
    [],
  );
  const [isLoadingJourneys, setIsLoadingJourneys] = useState(true);
  const [journeysError, setJourneysError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);
  const activeSearchQuery =
    normalizedSearchQuery.length === 0
      ? normalizedSearchQuery
      : deferredSearchQuery;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allEstoniaSortBy, setAllEstoniaSortBy] =
    useState<AllEstoniaSortKey>("name");
  const [regionSortBy, setRegionSortBy] = useState<RegionSortKey>("name");
  const [expandedCounties, setExpandedCounties] = useState<
    Record<string, boolean>
  >({});
  const [expandedJourneyId, setExpandedJourneyId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadJourneysScreenData() {
      setIsLoadingJourneys(true);

      try {
        await initializeContentCache();

        let cachedJourneys = await getCachedJourneys();
        cachedJourneys = await hydrateJourneysWithProgress(
          user?.id,
          cachedJourneys,
        );
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
            cachedJourneys = await hydrateJourneysWithProgress(
              user?.id,
              cachedJourneys,
            );
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

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setJourneys(cachedJourneys);
          setJourneyLocations(cachedJourneyLocations);
          setJourneysError(null);
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
        });
      } finally {
        if (isMounted) {
          setIsLoadingJourneys(false);
        }
      }
    }

    void loadJourneysScreenData();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, progressRevision, user?.id]);

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

  const allEstoniaJourneys = useMemo(
    () =>
      filteredJourneys
        .map((journey) => ({
          journey,
          distanceKm: null,
          stopCount: journeyMetaByJourneyId.get(journey.id)?.stopCount ?? 0,
          previewImageUrl:
            journeyMetaByJourneyId.get(journey.id)?.previewImageUrl ?? null,
        }))
        .sort((left, right) =>
          compareBrowseJourneys(left, right, allEstoniaSortBy),
        ),
    [allEstoniaSortBy, filteredJourneys, journeyMetaByJourneyId],
  );

  const regionGroups = useMemo(
    () =>
      buildRegionGroups(filteredJourneys, journeyMetaByJourneyId, regionSortBy),
    [filteredJourneys, journeyMetaByJourneyId, regionSortBy],
  );

  const shouldAutoExpandRegion = activeSearchQuery.length > 0;
  const firstCounty = regionGroups[0]?.county ?? null;

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
      [county]: !(current[county] ?? county === firstCounty),
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
      pathname: "/admin-journey/[journeyId]",
      params: {
        journeyId: String(journey.id),
      },
    });
  }

  function clearSearchQuery() {
    setSearchQuery("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
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
          journeyView === "all-estonia" ? allEstoniaSortBy : regionSortBy
        }
        options={
          journeyView === "all-estonia"
            ? ALL_ESTONIA_SORT_OPTIONS
            : REGION_SORT_OPTIONS
        }
        onSelect={(optionKey) => {
          if (journeyView === "all-estonia") {
            setAllEstoniaSortBy(optionKey as AllEstoniaSortKey);
            return;
          }

          setRegionSortBy(optionKey as RegionSortKey);
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

  if (journeyView === "all-estonia") {
    return (
      <AdminAllEstoniaJourneysView
        headerContent={sharedHeaderControls}
        sortAndCategoryControls={sharedSortAndCategoryControls}
        isLoadingJourneys={isLoadingJourneys}
        journeysError={journeysError}
        journeys={allEstoniaJourneys}
        expandedJourneyId={expandedJourneyId}
        onToggleJourney={toggleJourney}
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
      activeToggleJourneyId={null}
      onToggleJourneyActive={() => {}}
      onShowJourneyOnMap={showJourneyOnMap}
      onViewJourneyDetails={viewJourneyDetails}
      showActiveToggle={false}
    />
  );
}

type AdminAllEstoniaJourneysViewProps = {
  headerContent: ReactNode;
  sortAndCategoryControls: ReactNode;
  isLoadingJourneys: boolean;
  journeysError: string | null;
  journeys: NearbyJourneyItem[];
  expandedJourneyId: number | null;
  onToggleJourney: (journeyId: number) => void;
  onShowJourneyOnMap: (journey: Journey) => void;
  onViewJourneyDetails: (journey: Journey) => void;
};

function AdminAllEstoniaJourneysView({
  headerContent,
  sortAndCategoryControls,
  isLoadingJourneys,
  journeysError,
  journeys,
  expandedJourneyId,
  onToggleJourney,
  onShowJourneyOnMap,
  onViewJourneyDetails,
}: AdminAllEstoniaJourneysViewProps) {
  const styles = useJourneySectionStyles();
  const listData = journeys;

  return (
    <FlashList<NearbyJourneyItem>
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={listData}
      keyExtractor={(item) => String(item.journey.id)}
      renderItem={({ item }) => (
        <View style={styles.listItemContainer}>
          <JourneyListCard
            journey={item.journey}
            distanceKm={null}
            showDistance={false}
            stopCount={item.stopCount}
            previewImageUrl={item.previewImageUrl}
            isExpanded={expandedJourneyId === item.journey.id}
            onToggle={() => onToggleJourney(item.journey.id)}
            onToggleActive={() => {}}
            onShowOnMap={() => onShowJourneyOnMap(item.journey)}
            onViewDetails={() => onViewJourneyDetails(item.journey)}
            showActiveToggle={false}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
      ListHeaderComponent={
        <View style={styles.content}>
          {headerContent}
          {sortAndCategoryControls}

          {isLoadingJourneys ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Loading journeys</Text>
              <Text style={styles.stateCopy}>
                Pulling the journey catalog for the admin browser.
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
                <Text style={styles.sectionTitle}>All Estonia</Text>
                <Text style={styles.sectionMeta}>
                  {journeys.length} journeys
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
  sortBy: RegionSortKey,
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

function compareBrowseJourneys(
  left: NearbyJourneyItem,
  right: NearbyJourneyItem,
  sortBy: AllEstoniaSortKey,
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
  sortBy: RegionSortKey,
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

function getJourneyTitle(journey: Pick<Journey, "title">) {
  const trimmedTitle =
    typeof journey.title === "string" ? journey.title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}
