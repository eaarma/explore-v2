import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LocationManager } from "@maplibre/maplibre-react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
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
  styles,
} from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
  getCachedLocations,
  initializeContentCache,
  syncActiveContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

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
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const BROWSE_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const REGION_SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "newest", label: "Newest" },
] as const;

const PREFERRED_LOCATION_CATEGORIES = [
  "Nature",
  "Historic",
  "Urbex",
  "Camping",
  "Sightseeing",
] as const;

type LocationViewKey = (typeof LOCATION_VIEW_TABS)[number]["key"];
type RangeValue = (typeof NEARBY_RANGE_OPTIONS)[number]["value"];
type NearbySortKey = (typeof NEARBY_SORT_OPTIONS)[number]["key"];
type BrowseSortKey = Exclude<NearbySortKey, "distance">;
type RegionSortKey = (typeof REGION_SORT_OPTIONS)[number]["key"];

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

type PositionResolution = {
  status: Exclude<LocationPermissionState, "loading">;
  coordinates: UserCoordinates | null;
};

export function LocationsSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore(
    (state) => state.markUpdated,
  );
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [locationView, setLocationView] = useState<LocationViewKey>("nearby");
  const [nearbyMode, setNearbyMode] = useState<NearbyMode>("radius");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] =
    useState<LocationPermissionState>("loading");
  const [userCoordinates, setUserCoordinates] =
    useState<UserCoordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);
  const activeSearchQuery =
    normalizedSearchQuery.length === 0 ? normalizedSearchQuery : deferredSearchQuery;
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

  useEffect(() => {
    let isMounted = true;

    async function loadLocationsScreenData() {
      setIsLoadingLocations(true);
      const positionPromise = resolveUserCoordinates();

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

    async function syncActiveLocationFlags() {
      if (!user?.id || locations.length === 0) {
        return;
      }

      const nextLocations = await hydrateLocationsWithProgress(user.id, locations);

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setLocations(nextLocations);
      });
    }

    void syncActiveLocationFlags();

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
          placeholder="Search name, description, county, category"
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
          {LOCATION_VIEW_TABS.map((tab) => {
            const isActive = locationView === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setLocationView(tab.key)}
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

  const sharedSortAndCategoryControls = (
    <>
      <View style={styles.controlBlock}>
        <Text style={styles.controlLabel}>Sort</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(locationView === "nearby"
            ? nearbySortOptions
            : REGION_SORT_OPTIONS
          ).map((option) => {
            const isActive =
              locationView === "nearby"
                ? nearbySortBy === option.key
                : regionSortBy === option.key;

            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  if (locationView === "nearby") {
                    setNearbySortBy(option.key as NearbySortKey);
                    return;
                  }

                  setRegionSortBy(option.key as RegionSortKey);
                }}
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
            onPress={() => setSelectedCategories([])}
            style={[
              styles.filterChip,
              selectedCategories.length === 0 && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategories.length === 0 && styles.filterChipTextActive,
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
                onPress={() => toggleCategory(category)}
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

function getLocationTitle(location: Pick<Location, "title">) {
  const trimmedTitle =
    typeof location.title === "string" ? location.title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled location";
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
