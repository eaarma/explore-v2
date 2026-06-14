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
  hydrateLocationsWithProgress,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getActiveLocations } from "@/src/features/locations/api/locationsApi";
import { NearbyLocationsView } from "@/src/features/locations/components/NearbyLocationsView";
import { RegionLocationsView } from "@/src/features/locations/components/RegionLocationsView";
import {
  type LocationPermissionState,
  type NearbyLocationItem,
  type NearbyMode,
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

const LOCATION_VIEW_TABS = [
  { key: "nearby", label: "Nearby" },
  { key: "region", label: "Region" },
] as const;

const NEARBY_RANGE_OPTIONS = [
  { key: "5", label: "5 km", value: 5 },
  { key: "10", label: "10 km", value: 10 },
  { key: "25", label: "25 km", value: 25 },
  { key: "50", label: "50 km", value: 50 },
] as const;

const BROWSE_OPTION = {
  key: "all-estonia",
  label: "All Estonia",
} as const;

const NEARBY_SORT_OPTIONS = [
  { key: "distance", label: "Distance" },
  { key: "active", label: "Active" },
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const BROWSE_SORT_OPTIONS = [
  { key: "active", label: "Active" },
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const REGION_SORT_OPTIONS = [
  { key: "active", label: "Active" },
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
type RangeValue = (typeof NEARBY_RANGE_OPTIONS)[number]["value"];
type NearbySortKey = (typeof NEARBY_SORT_OPTIONS)[number]["key"];
type BrowseSortKey = Exclude<NearbySortKey, "distance">;
type RegionSortKey = (typeof REGION_SORT_OPTIONS)[number]["key"];

export function LocationsSection() {
  const styles = useLocationSectionStyles();
  const colors = useLocationSectionColors();
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
  const [locationView, setLocationView] = useState<LocationViewKey>("nearby");
  const [nearbyMode, setNearbyMode] = useState<NearbyMode>("radius");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] =
    useState<LocationPermissionState>("loading");
  const [userCoordinates, setUserCoordinates] =
    useState<UserCoordinates | null>(null);
  const [selectedRange, setSelectedRange] = useState<RangeValue>(25);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [nearbySortBy, setNearbySortBy] = useState<NearbySortKey>("distance");
  const [regionSortBy, setRegionSortBy] = useState<RegionSortKey>("name");
  const [expandedCounties, setExpandedCounties] = useState<
    Record<string, boolean>
  >({});
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(
    null,
  );
  const [activeToggleLocationId, setActiveToggleLocationId] = useState<
    number | null
  >(null);
  const resolveUserCoordinatesRef = useRef(resolveUserCoordinates);
  const locationsRef = useRef(locations);
  resolveUserCoordinatesRef.current = resolveUserCoordinates;
  locationsRef.current = locations;

  useEffect(() => {
    let isMounted = true;

    async function loadLocationsScreenData() {
      setIsLoadingLocations(true);
      const positionPromise = resolveUserCoordinatesRef.current();

      try {
        await initializeContentCache();

        let cachedLocations = await getCachedLocations();
        cachedLocations = await hydrateLocationsWithProgress(user?.id, cachedLocations);

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
            cachedLocations = await hydrateLocationsWithProgress(user?.id, cachedLocations);
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
          // Journey-location backfill should not block the Locations tab.
        }

        const positionResult = await positionPromise;

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(cachedLocations);
          setLocationsError(null);
          setLocationPermissionState(positionResult.status);
          setUserCoordinates(positionResult.coordinates);
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

        const positionResult = await positionPromise;

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
          setLocationPermissionState(positionResult.status);
          setUserCoordinates(positionResult.coordinates);
        });
      } finally {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      }
    }

    loadLocationsScreenData();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, progressRevision, user?.id]);

  useEffect(() => {
    let isMounted = true;

    async function syncLocationFlags() {
      if (!user?.id || locationsRef.current.length === 0) {
        return;
      }

      const nextLocations = await hydrateLocationsWithProgress(
        user.id,
        locationsRef.current,
      );

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setLocations(nextLocations);
      });
    }

    void syncLocationFlags();

    return () => {
      isMounted = false;
    };
  }, [activeItemsRevision, user?.id]);

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

  const browseSortBy: BrowseSortKey =
    nearbySortBy === "distance" ? "name" : nearbySortBy;

  const nearbyLocations = useMemo(() => {
    if (nearbyMode === "browse") {
      return [...filteredLocations]
        .sort((left, right) => compareBrowseLocations(left, right, browseSortBy))
        .map((location) => ({
          location,
          distanceKm: null,
        }));
    }

    return filteredLocations
      .map((location) => ({
        location,
        distanceKm: userCoordinates
          ? calculateDistanceKm(
              userCoordinates.latitude,
              userCoordinates.longitude,
              location.latitude,
              location.longitude,
            )
          : null,
      }))
      .filter(
        (item) => item.distanceKm !== null && item.distanceKm <= selectedRange,
      )
      .sort((left, right) => compareNearbyLocations(left, right, nearbySortBy));
  }, [
    browseSortBy,
    filteredLocations,
    nearbyMode,
    nearbySortBy,
    selectedRange,
    userCoordinates,
  ]);

  const regionGroups = useMemo(
    () => buildRegionGroups(filteredLocations, regionSortBy),
    [filteredLocations, regionSortBy],
  );

  const shouldAutoExpandRegion = activeSearchQuery.length > 0;
  const firstCounty = regionGroups[0]?.county ?? null;
  const canShowNearbyResults =
    nearbyMode === "browse" || locationPermissionState === "granted";
  const nearbySectionTitle =
    nearbyMode === "browse" ? "All Estonia" : "Nearby locations";
  const nearbySectionMeta =
    nearbyMode === "browse"
      ? `${nearbyLocations.length} locations across Estonia`
      : `${nearbyLocations.length} within ${selectedRange} km`;
  const nearbySortOptions =
    nearbyMode === "browse" ? BROWSE_SORT_OPTIONS : NEARBY_SORT_OPTIONS;

  function toggleCategory(category: string) {
    setSelectedCategories((current) => toggleValueInArray(current, category));
  }

  function toggleCounty(county: string) {
    setExpandedCounties((current) => ({
      ...current,
      [county]: !(current[county] ?? (county === firstCounty)),
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
      pathname: "/location/[locationId]",
      params: {
        locationId: String(location.id),
      },
    });
  }

  async function toggleLocationActive(location: Location) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    const nextActive = location.active !== true;
    const nextActiveAt = nextActive ? new Date().toISOString() : null;
    setActiveToggleLocationId(location.id);

    try {
      if (nextActive) {
        await markActiveItem({
          userId: currentUserId,
          itemType: "LOCATION",
          itemId: location.id,
          createdAt: nextActiveAt ?? undefined,
        });
      } else {
        await clearActiveItem(currentUserId, "LOCATION", location.id);
      }

      setLocations((currentLocations) =>
        currentLocations.map((currentLocation) =>
          currentLocation.id === location.id
            ? {
                ...currentLocation,
                active: nextActive,
                activeAt: nextActiveAt,
              }
            : currentLocation,
        ),
      );
      markActiveItemsUpdated();
    } finally {
      setActiveToggleLocationId((currentLocationId) =>
        currentLocationId === location.id ? null : currentLocationId,
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
          locationView === "nearby"
            ? nearbySortBy
            : regionSortBy
        }
        options={
          locationView === "nearby"
            ? nearbySortOptions
            : REGION_SORT_OPTIONS
        }
        onSelect={(optionKey) => {
          if (locationView === "nearby") {
            setNearbySortBy(optionKey as NearbySortKey);
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

  if (locationView === "nearby") {
    return (
      <NearbyLocationsView
        headerContent={sharedHeaderControls}
        sortAndCategoryControls={sharedSortAndCategoryControls}
        nearbyMode={nearbyMode}
        rangeOptions={NEARBY_RANGE_OPTIONS}
        browseLabel={BROWSE_OPTION.label}
        selectedRange={selectedRange}
        onSelectRange={(range) => {
          setNearbyMode("radius");
          setSelectedRange(range as RangeValue);
        }}
        onSelectBrowseMode={() => {
          setNearbyMode("browse");
          if (nearbySortBy === "distance") {
            setNearbySortBy("name");
          }
        }}
        isLoadingLocations={isLoadingLocations}
        locationsError={locationsError}
        canShowNearbyResults={canShowNearbyResults}
        locationPermissionState={locationPermissionState}
        nearbyLocations={nearbyLocations}
        nearbySectionTitle={nearbySectionTitle}
        nearbySectionMeta={nearbySectionMeta}
        expandedLocationId={expandedLocationId}
        onToggleLocation={toggleLocation}
        activeToggleLocationId={activeToggleLocationId}
        onToggleLocationActive={toggleLocationActive}
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
      regionGroups={regionGroups}
      filteredLocationCount={filteredLocations.length}
      shouldAutoExpandRegion={shouldAutoExpandRegion}
      expandedCounties={expandedCounties}
      firstCounty={firstCounty}
      onToggleCounty={toggleCounty}
      expandedLocationId={expandedLocationId}
      onToggleLocation={toggleLocation}
      activeToggleLocationId={activeToggleLocationId}
      onToggleLocationActive={toggleLocationActive}
      onShowLocationOnMap={showLocationOnMap}
      onViewLocationDetails={viewLocationDetails}
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

function compareNearbyLocations(
  left: NearbyLocationItem,
  right: NearbyLocationItem,
  sortBy: NearbySortKey,
) {
  if (sortBy === "active") {
    return compareActiveLocations(left.location, right.location);
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
      getCreatedAtTime(right.location.createdAt) -
      getCreatedAtTime(left.location.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getLocationTitle(left.location).localeCompare(
    getLocationTitle(right.location),
  );
}

function compareBrowseLocations(
  left: Location,
  right: Location,
  sortBy: BrowseSortKey,
) {
  if (sortBy === "active") {
    return compareActiveLocations(left, right);
  }

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
  if (sortBy === "active") {
    return compareActiveLocations(left, right);
  }

  if (sortBy === "newest") {
    const timeDifference =
      getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }
  }

  return getLocationTitle(left).localeCompare(getLocationTitle(right));
}

function compareActiveLocations(
  left: Pick<Location, "active" | "title">,
  right: Pick<Location, "active" | "title">,
) {
  const leftRank = left.active === true ? 0 : 1;
  const rightRank = right.active === true ? 0 : 1;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
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
