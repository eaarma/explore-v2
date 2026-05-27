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
import { hydrateLocationsWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getActiveLocations } from "@/src/features/locations/api/locationsApi";
import { LocationListCard } from "@/src/features/locations/components/LocationListCard";
import { RegionLocationsView } from "@/src/features/locations/components/RegionLocationsView";
import {
  type RegionGroup,
  normalizeCategory,
  useLocationSectionColors,
  useLocationSectionStyles,
} from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";
import {
  getCachedLocations,
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

const LOCATION_VIEW_TABS = [
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

const PREFERRED_LOCATION_CATEGORIES = [
  "Nature",
  "Urbex",
  "Camping",
  "Sightseeing",
] as const;

type LocationViewKey = (typeof LOCATION_VIEW_TABS)[number]["key"];
type AllEstoniaSortKey = (typeof ALL_ESTONIA_SORT_OPTIONS)[number]["key"];
type RegionSortKey = (typeof REGION_SORT_OPTIONS)[number]["key"];

export function AdminLocationViewEditSection() {
  const styles = useLocationSectionStyles();
  const colors = useLocationSectionColors();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [locationView, setLocationView] =
    useState<LocationViewKey>("all-estonia");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
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
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadLocationsScreenData() {
      setIsLoadingLocations(true);

      try {
        await initializeContentCache();

        let cachedLocations = await getCachedLocations();
        cachedLocations = await hydrateLocationsWithProgress(
          user?.id,
          cachedLocations,
        );

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(cachedLocations);
          setLocationsError(null);
        });

        if (cachedLocations.length > 0) {
          setIsLoadingLocations(false);
        }

        try {
          const { didBootstrap } = await bootstrapContentCacheIfNeeded();

          if (didBootstrap) {
            cachedLocations = await getCachedLocations();
            cachedLocations = await hydrateLocationsWithProgress(
              user?.id,
              cachedLocations,
            );
          }
        } catch {
          if (cachedLocations.length === 0) {
            try {
              const syncedContent = await syncActiveContentCache();
              cachedLocations = await hydrateLocationsWithProgress(
                user?.id,
                syncedContent.locations,
              );
            } catch {
              cachedLocations = await hydrateLocationsWithProgress(
                user?.id,
                await getActiveLocations(),
              );
            }
          }
        }

        try {
          await bootstrapJourneyLocationsCacheIfNeeded();
        } catch {
          // Journey-location bootstrap should not block the admin browser.
        }

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(cachedLocations);
          setLocationsError(null);
        });
      } catch {
        let liveLocations: Location[] = [];

        try {
          liveLocations = await hydrateLocationsWithProgress(
            user?.id,
            await getActiveLocations(),
          );
        } catch {
          liveLocations = [];
        }

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(liveLocations);
          setLocationsError(
            liveLocations.length === 0
              ? "Could not load locations right now."
              : null,
          );
        });
      } finally {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      }
    }

    void loadLocationsScreenData();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, progressRevision, user?.id]);

  const availableCategories = useMemo(
    () => buildAvailableCategories(locations),
    [locations],
  );

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      if (!matchesLocationSearch(location, activeSearchQuery)) {
        return false;
      }

      if (selectedCategories.length === 0) {
        return true;
      }

      return selectedCategories.includes(normalizeCategory(location.category));
    });
  }, [locations, activeSearchQuery, selectedCategories]);

  const allEstoniaLocations = useMemo(
    () =>
      [...filteredLocations].sort((left, right) =>
        compareBrowseLocations(left, right, allEstoniaSortBy),
      ),
    [allEstoniaSortBy, filteredLocations],
  );

  const regionGroups = useMemo(
    () => buildRegionGroups(filteredLocations, regionSortBy),
    [filteredLocations, regionSortBy],
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

  function toggleLocation(locationId: number) {
    setExpandedLocationId((current) =>
      current === locationId ? null : locationId,
    );
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

  function viewLocationDetails(location: Location) {
    router.push({
      pathname: "/admin-location/[locationId]",
      params: {
        locationId: String(location.id),
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
        placeholder="Search name, description, county, category"
        placeholderTextColor={colors.controlLabel}
        styles={styles}
      />
      <SectionSegmentedControl
        label="View"
        activeKey={locationView}
        options={LOCATION_VIEW_TABS}
        onSelect={setLocationView}
        styles={styles}
      />
    </>
  );

  const sharedSortAndCategoryControls = (
    <>
      <SectionChipSelector
        label="Sort"
        activeKey={
          locationView === "all-estonia" ? allEstoniaSortBy : regionSortBy
        }
        options={
          locationView === "all-estonia"
            ? ALL_ESTONIA_SORT_OPTIONS
            : REGION_SORT_OPTIONS
        }
        onSelect={(optionKey) => {
          if (locationView === "all-estonia") {
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

  if (locationView === "all-estonia") {
    return (
      <AdminAllEstoniaLocationsView
        headerContent={sharedHeaderControls}
        sortAndCategoryControls={sharedSortAndCategoryControls}
        isLoadingLocations={isLoadingLocations}
        locationsError={locationsError}
        locations={allEstoniaLocations}
        expandedLocationId={expandedLocationId}
        onToggleLocation={toggleLocation}
        onShowLocationOnMap={showLocationOnMap}
        onViewLocationDetails={viewLocationDetails}
      />
    );
  }

  return (
    <RegionLocationsView
      headerContent={sharedHeaderControls}
      sortAndCategoryControls={sharedSortAndCategoryControls}
      isLoadingLocations={isLoadingLocations}
      locationsError={locationsError}
      loadingCopy="Pulling the location catalog for county-based admin browsing."
      regionGroups={regionGroups}
      filteredLocationCount={filteredLocations.length}
      shouldAutoExpandRegion={shouldAutoExpandRegion}
      expandedCounties={expandedCounties}
      firstCounty={firstCounty}
      onToggleCounty={toggleCounty}
      expandedLocationId={expandedLocationId}
      onToggleLocation={toggleLocation}
      activeToggleLocationId={null}
      onToggleLocationActive={() => {}}
      onShowLocationOnMap={showLocationOnMap}
      onViewLocationDetails={viewLocationDetails}
      showActiveToggle={false}
    />
  );
}

type AdminAllEstoniaLocationsViewProps = {
  headerContent: ReactNode;
  sortAndCategoryControls: ReactNode;
  isLoadingLocations: boolean;
  locationsError: string | null;
  locations: Location[];
  expandedLocationId: number | null;
  onToggleLocation: (locationId: number) => void;
  onShowLocationOnMap: (location: Location) => void;
  onViewLocationDetails: (location: Location) => void;
};

function AdminAllEstoniaLocationsView({
  headerContent,
  sortAndCategoryControls,
  isLoadingLocations,
  locationsError,
  locations,
  expandedLocationId,
  onToggleLocation,
  onShowLocationOnMap,
  onViewLocationDetails,
}: AdminAllEstoniaLocationsViewProps) {
  const styles = useLocationSectionStyles();
  const listData = locations;

  return (
    <FlashList<Location>
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      data={listData}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.listItemContainer}>
          <LocationListCard
            location={item}
            distanceKm={null}
            showDistance={false}
            isExpanded={expandedLocationId === item.id}
            onToggle={() => onToggleLocation(item.id)}
            onToggleActive={() => {}}
            onShowOnMap={() => onShowLocationOnMap(item)}
            onViewDetails={() => onViewLocationDetails(item)}
            showActiveToggle={false}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
      ListHeaderComponent={
        <View style={styles.content}>
          {headerContent}
          {sortAndCategoryControls}

          {isLoadingLocations ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Loading locations</Text>
              <Text style={styles.stateCopy}>
                Pulling the location catalog for the admin browser.
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
                <Text style={styles.sectionTitle}>All Estonia</Text>
                <Text style={styles.sectionMeta}>
                  {locations.length} locations
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

function buildAvailableCategories(locations: Location[]) {
  const categories: string[] = [...PREFERRED_LOCATION_CATEGORIES];
  const seen = new Set<string>(categories);

  for (const location of locations) {
    const category = normalizeCategory(location.category);

    if (seen.has(category)) {
      continue;
    }

    seen.add(category);
    categories.push(category);
  }

  return categories;
}

function matchesLocationSearch(location: Location, query: string) {
  if (!query) {
    return true;
  }

  const searchableFields = [
    location.title,
    location.description,
    location.county,
    normalizeCategory(location.category),
  ];

  return searchableFields.some((field) =>
    normalizeSearchValue(field).includes(query),
  );
}

function buildRegionGroups(
  locations: Location[],
  sortBy: RegionSortKey,
): RegionGroup[] {
  const locationsByCounty = new Map<string, Location[]>();

  for (const location of locations) {
    const county = normalizeCounty(location.county);
    const existingCountyLocations = locationsByCounty.get(county) ?? [];
    existingCountyLocations.push(location);
    locationsByCounty.set(county, existingCountyLocations);
  }

  return [...locationsByCounty.entries()]
    .sort(([leftCounty], [rightCounty]) =>
      leftCounty.localeCompare(rightCounty),
    )
    .map(([county, countyLocations]) => ({
      county,
      locations: [...countyLocations].sort((left, right) =>
        compareRegionLocations(left, right, sortBy),
      ),
    }));
}

function compareBrowseLocations(
  left: Location,
  right: Location,
  sortBy: AllEstoniaSortKey,
) {
  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getLocationTitle(left).localeCompare(getLocationTitle(right));
}

function compareRegionLocations(
  left: Location,
  right: Location,
  sortBy: RegionSortKey,
) {
  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getLocationTitle(left).localeCompare(getLocationTitle(right));
}

function getLocationTitle(location: Pick<Location, "title">) {
  const trimmedTitle =
    typeof location.title === "string" ? location.title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled location";
  }

  return trimmedTitle;
}
