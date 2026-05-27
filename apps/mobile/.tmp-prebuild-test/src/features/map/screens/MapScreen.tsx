import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Camera,
  CameraRef,
  GeoJSONSource,
  Images,
  Layer,
  LocationManager,
  Map as MapLibreMap,
  UserLocation,
  useCurrentPosition,
} from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { checkDiscoveries } from "@/src/features/discoveries/api/discoveriesApi";
import {
  clearActiveItem,
  captureOfflineDiscoveryCheck,
  cacheDiscoveryCheckResult,
  hydrateJourneysWithProgress,
  hydrateLocationsWithProgress,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { buildDiscoveryBannerMessage } from "@/src/features/discoveries/utils/discoveryPresentation";
import { getActiveJourneys } from "@/src/features/journeys/api/journeysApi";
import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import { getActiveLocations } from "@/src/features/locations/api/locationsApi";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import {
  getMapMarkerImageId,
  getMapMarkerState,
  mapMarkerImages,
} from "@/src/features/map/mapMarkerIcons";
import { MapSelectionBottomSheet } from "@/src/features/map/components/MapSelectionBottomSheet";
import type {
  MapBottomSheetSelection,
  MapBottomSheetState,
} from "@/src/features/map/components/MapSelectionBottomSheet";
import type {
  PressEventWithFeatures,
  ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  getApiErrorMessage,
  isApiNetworkError,
} from "@/src/shared/api/apiError";
import {
  bootstrapContentCacheIfNeeded,
  cacheActiveContent,
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
  syncAllContentCaches,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import {
  buildMapStyleUrl,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_STYLE_KEY,
  DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM,
  DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM,
  MAP_STYLE_OPTIONS,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";

const DISCOVERY_CHECK_MIN_DISTANCE_METERS = 25;
const DISCOVERY_CHECK_MIN_INTERVAL_MS = 20_000;
const DISCOVERY_WARNING_COOLDOWN_MS = 60_000;
const TOOLBAR_TOP_OFFSET = 40;
const TOOLBAR_RIGHT_OFFSET = 16;
const TOOLBAR_GAP = 10;
const TOOLBAR_BUTTON_SIZE = 45;
const MAP_ROTATION_EPSILON = 1;
const SCALE_BAR_MAX_WIDTH = 96;

type DiscoveryBannerTone = "success" | "warning" | "error";
type ActiveToolPanel = "map-style" | "category-filter" | null;

type DiscoveryBanner = {
  tone: DiscoveryBannerTone;
  text: string;
};

export function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authStatus = useAuthStore((state) => state.status);
  const authUser = useAuthStore((state) => state.user);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore(
    (state) => state.markUpdated,
  );
  const contentRevision = useContentSyncStore((state) => state.revision);
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const cameraRef = useRef<CameraRef>(null);
  const lastAppliedCameraFocusAtRef = useRef<string | null>(null);
  const lastAppliedSelectionFocusAtRef = useRef<string | null>(null);
  const discoveryCheckInFlightRef = useRef(false);
  const lastDiscoveryCheckRef = useRef<{
    latitude: number;
    longitude: number;
    at: number;
  } | null>(null);
  const lastAccuracyWarningAtRef = useRef(0);
  const lastDiscoveryErrorAtRef = useRef(0);
  const { focusLatitude, focusLongitude, focusAt, focusKind, focusItemId } =
    useLocalSearchParams<{
      focusLatitude?: string;
      focusLongitude?: string;
      focusAt?: string;
      focusKind?: SelectedMapTarget["kind"];
      focusItemId?: string;
    }>();

  const [locations, setLocations] = useState<Location[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isMapDataLoading, setIsMapDataLoading] = useState(true);
  const [mapDataError, setMapDataError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [selectedTarget, setSelectedTarget] =
    useState<SelectedMapTarget | null>(null);
  const [bottomSheetState, setBottomSheetState] =
    useState<MapBottomSheetState>("hidden");
  const [discoveryBanner, setDiscoveryBanner] =
    useState<DiscoveryBanner | null>(null);
  const [activeToolPanel, setActiveToolPanel] = useState<ActiveToolPanel>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const [mapZoom, setMapZoom] = useState(7);
  const [mapCenterLatitude, setMapCenterLatitude] = useState(
    DEFAULT_MAP_CENTER[1],
  );
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyleKey>(
    DEFAULT_MAP_STYLE_KEY,
  );
  const [categoryVisibility, setCategoryVisibility] = useState<
    Record<string, boolean>
  >({});
  const [activeToggleTargetKey, setActiveToggleTargetKey] = useState<
    string | null
  >(null);

  const selectedLocationId =
    selectedTarget?.kind === "location" && bottomSheetState !== "hidden"
      ? selectedTarget.id
      : null;
  const selectedJourneyId =
    selectedTarget?.kind === "journey" && bottomSheetState !== "hidden"
      ? selectedTarget.id
      : null;

  const currentPosition = useCurrentPosition({
    enabled: locationPermissionGranted,
  });

  const locationsById = useMemo(
    () =>
      new globalThis.Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  const journeysById = useMemo(
    () => new globalThis.Map(journeys.map((journey) => [journey.id, journey])),
    [journeys],
  );

  const availableCategories = useMemo(
    () => buildAvailableMapCategories(locations, journeys),
    [journeys, locations],
  );

  const visibleLocations = useMemo(
    () =>
      locations.filter((location) =>
        isCategoryVisible(
          categoryVisibility,
          normalizeLocationCategory(location.category),
        ),
      ),
    [categoryVisibility, locations],
  );

  const visibleJourneys = useMemo(
    () =>
      journeys.filter((journey) =>
        isCategoryVisible(
          categoryVisibility,
          normalizeJourneyCategory(journey.category),
        ),
      ),
    [categoryVisibility, journeys],
  );

  const visibleLocationsById = useMemo(
    () =>
      new globalThis.Map(
        visibleLocations.map((location) => [location.id, location]),
      ),
    [visibleLocations],
  );

  const visibleJourneysById = useMemo(
    () =>
      new globalThis.Map(
        visibleJourneys.map((journey) => [journey.id, journey]),
      ),
    [visibleJourneys],
  );

  const locationGeoJson = useMemo(
    () =>
      createPointFeatureCollection(
        visibleLocations,
        "location",
        selectedLocationId,
        {
          isAchieved: (location) => location.discovered === true,
          isActive: (location) => location.active === true,
        },
      ),
    [selectedLocationId, visibleLocations],
  );

  const journeyGeoJson = useMemo(
    () =>
      createPointFeatureCollection(
        visibleJourneys,
        "journey",
        selectedJourneyId,
        {
          isAchieved: (journey) => journey.completed === true,
          isActive: (journey) => journey.active === true,
        },
      ),
    [selectedJourneyId, visibleJourneys],
  );

  const locationSourceId = `location-points-${contentRevision}`;
  const locationLayerId = `location-markers-${contentRevision}`;
  const journeySourceId = `journey-points-${contentRevision}`;
  const journeyLayerId = `journey-markers-${contentRevision}`;
  const currentMapStyleUrl = useMemo(
    () => buildMapStyleUrl(selectedMapStyle),
    [selectedMapStyle],
  );
  const normalizedMapBearing = useMemo(
    () => normalizeMapBearing(mapBearing),
    [mapBearing],
  );
  const shouldShowCompass = useMemo(
    () => Math.abs(normalizedMapBearing) >= MAP_ROTATION_EPSILON,
    [normalizedMapBearing],
  );
  const allCategoriesEnabled = useMemo(
    () =>
      availableCategories.every((category) =>
        isCategoryVisible(categoryVisibility, category),
      ),
    [availableCategories, categoryVisibility],
  );
  const enabledCategoryCount = useMemo(
    () =>
      availableCategories.filter((category) =>
        isCategoryVisible(categoryVisibility, category),
      ).length,
    [availableCategories, categoryVisibility],
  );
  const isCategoryFilterModified =
    availableCategories.length > 0 &&
    enabledCategoryCount !== availableCategories.length;

  const selectedMapItem = useMemo<MapBottomSheetSelection | null>(() => {
    if (!selectedTarget) {
      return null;
    }

    if (selectedTarget.kind === "location") {
      const location = visibleLocationsById.get(selectedTarget.id);

      if (!location) {
        return null;
      }

      return {
        kind: "location",
        item: location,
      };
    }

    const journey = visibleJourneysById.get(selectedTarget.id);

    if (!journey) {
      return null;
    }

    return {
      kind: "journey",
      item: journey,
    };
  }, [selectedTarget, visibleJourneysById, visibleLocationsById]);
  const selectedItemActiveToggleKey = useMemo(
    () => (selectedMapItem ? getMapSelectionKey(selectedMapItem) : null),
    [selectedMapItem],
  );
  const isActiveTogglePending =
    selectedItemActiveToggleKey !== null &&
    activeToggleTargetKey === selectedItemActiveToggleKey;
  const mapScale = useMemo(
    () =>
      buildMapScaleIndicator(mapCenterLatitude, mapZoom, SCALE_BAR_MAX_WIDTH),
    [mapCenterLatitude, mapZoom],
  );

  useEffect(() => {
    setCategoryVisibility((currentVisibility) =>
      syncCategoryVisibility(currentVisibility, availableCategories),
    );
  }, [availableCategories]);

  useEffect(() => {
    async function requestLocationPermission() {
      const granted = await LocationManager.requestPermissions();
      setLocationPermissionGranted(granted);
    }

    requestLocationPermission();
  }, []);

  useEffect(() => {
    const latitude = parseNumericParam(focusLatitude);
    const longitude = parseNumericParam(focusLongitude);

    if (
      !focusAt ||
      latitude === null ||
      longitude === null ||
      !isMapReady ||
      !cameraRef.current ||
      lastAppliedCameraFocusAtRef.current === focusAt
    ) {
      return;
    }

    lastAppliedCameraFocusAtRef.current = focusAt;
    cameraRef.current?.setStop({
      center: [longitude, latitude],
      zoom: 15,
      bearing: 0,
      pitch: 0,
      duration: 900,
    });
  }, [focusAt, focusLatitude, focusLongitude, isMapReady]);

  useEffect(() => {
    if (!focusAt || !focusKind || !focusItemId) {
      return;
    }

    if (lastAppliedSelectionFocusAtRef.current === focusAt) {
      return;
    }

    const parsedFocusItemId = Number(focusItemId);

    if (!Number.isInteger(parsedFocusItemId)) {
      return;
    }

    const focusedItemExists =
      focusKind === "location"
        ? visibleLocationsById.has(parsedFocusItemId)
        : visibleJourneysById.has(parsedFocusItemId);

    if (!focusedItemExists) {
      return;
    }

    lastAppliedSelectionFocusAtRef.current = focusAt;
    setActiveToolPanel(null);
    setSelectedTarget({
      kind: focusKind,
      id: parsedFocusItemId,
    });
    setBottomSheetState("collapsed");
  }, [
    focusAt,
    focusItemId,
    focusKind,
    visibleJourneysById,
    visibleLocationsById,
  ]);

  useEffect(() => {
    if (selectedTarget && !selectedMapItem) {
      setSelectedTarget(null);
      setBottomSheetState("hidden");
    }
  }, [selectedMapItem, selectedTarget]);

  useEffect(() => {
    let isMounted = true;

    async function syncActiveMapFlags() {
      if (!authUser?.id || (locations.length === 0 && journeys.length === 0)) {
        return;
      }

      const [nextLocations, nextJourneys] = await Promise.all([
        locations.length > 0
          ? hydrateLocationsWithProgress(authUser.id, locations)
          : Promise.resolve(locations),
        journeys.length > 0
          ? hydrateJourneysWithProgress(authUser.id, journeys)
          : Promise.resolve(journeys),
      ]);

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setLocations(nextLocations);
        setJourneys(nextJourneys);
      });
    }

    void syncActiveMapFlags();

    return () => {
      isMounted = false;
    };
  }, [activeItemsRevision, authUser?.id]);

  useEffect(() => {
    if (!discoveryBanner) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setDiscoveryBanner(null);
    }, 4200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [discoveryBanner]);

  useEffect(() => {
    let isMounted = true;

    async function loadMapData() {
      setIsMapDataLoading(true);
      setMapDataError(null);

      let nextLocations: Location[] = [];
      let nextJourneys: Journey[] = [];
      let nextMapDataError: string | null = null;

      try {
        await initializeContentCache();

        [nextLocations, nextJourneys] = await Promise.all([
          getCachedLocations(),
          getCachedJourneys(),
        ]);

        nextLocations = nextLocations.filter(hasValidCoordinates);
        nextJourneys = nextJourneys.filter(hasValidCoordinates);
        ({ locations: nextLocations, journeys: nextJourneys } =
          await hydrateMapContent(nextLocations, nextJourneys, authUser?.id));

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(nextLocations);
          setJourneys(nextJourneys);
          setMapDataError(null);
        });

        if (nextLocations.length > 0 || nextJourneys.length > 0) {
          setIsMapDataLoading(false);
        }

        try {
          const { didBootstrap } = await bootstrapContentCacheIfNeeded();

          if (didBootstrap) {
            const [cachedLocations, cachedJourneys] = await Promise.all([
              getCachedLocations(),
              getCachedJourneys(),
            ]);

            nextLocations = cachedLocations.filter(hasValidCoordinates);
            nextJourneys = cachedJourneys.filter(hasValidCoordinates);
            ({ locations: nextLocations, journeys: nextJourneys } =
              await hydrateMapContent(
                nextLocations,
                nextJourneys,
                authUser?.id,
              ));
          }
        } catch {
          if (nextLocations.length === 0 || nextJourneys.length === 0) {
            const liveMapData = await loadLiveMapData();

            nextLocations =
              liveMapData.locations.length > 0
                ? liveMapData.locations
                : nextLocations;
            nextJourneys =
              liveMapData.journeys.length > 0
                ? liveMapData.journeys
                : nextJourneys;
            ({ locations: nextLocations, journeys: nextJourneys } =
              await hydrateMapContent(
                nextLocations,
                nextJourneys,
                authUser?.id,
              ));
            nextMapDataError = resolveVisibleMapDataError(
              liveMapData.locationsResult,
              liveMapData.journeysResult,
              nextLocations.length,
              nextJourneys.length,
            );

            if (!isMounted) {
              return;
            }
          }
        }

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(nextLocations);
          setJourneys(nextJourneys);
          setMapDataError(nextMapDataError);
        });
      } catch {
        const liveMapData = await loadLiveMapData();
        const hydratedMapContent = await hydrateMapContent(
          liveMapData.locations,
          liveMapData.journeys,
          authUser?.id,
        );

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLocations(hydratedMapContent.locations);
          setJourneys(hydratedMapContent.journeys);
          setMapDataError(
            resolveVisibleMapDataError(
              liveMapData.locationsResult,
              liveMapData.journeysResult,
              liveMapData.locations.length,
              liveMapData.journeys.length,
            ),
          );
        });
      } finally {
        if (isMounted) {
          setIsMapDataLoading(false);
        }
      }
    }

    loadMapData();

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, contentRevision]);

  useEffect(() => {
    const isAuthenticatedSession =
      authStatus === "authenticated-online" ||
      authStatus === "authenticated-offline";
    const sessionUser = authUser;

    if (!isAuthenticatedSession || !sessionUser) {
      return;
    }

    const authenticatedUser = sessionUser;

    if (!locationPermissionGranted) {
      return;
    }

    const latitude = Number(currentPosition?.coords.latitude);
    const longitude = Number(currentPosition?.coords.longitude);
    const accuracyMeters = Number(currentPosition?.coords.accuracy);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters < 0
    ) {
      return;
    }

    if (
      !shouldTriggerDiscoveryCheck(
        lastDiscoveryCheckRef.current,
        latitude,
        longitude,
      )
    ) {
      return;
    }

    if (discoveryCheckInFlightRef.current) {
      return;
    }

    lastDiscoveryCheckRef.current = {
      latitude,
      longitude,
      at: Date.now(),
    };
    discoveryCheckInFlightRef.current = true;

    void (async () => {
      async function finalizeDiscoveryResult(
        discoveryResult: Awaited<ReturnType<typeof checkDiscoveries>>,
        options: {
          persistToCache: boolean;
          offlineCapture: boolean;
        },
      ) {
        if (!discoveryResult.accuracyValid) {
          if (shouldShowDiscoveryFeedback(lastAccuracyWarningAtRef.current)) {
            lastAccuracyWarningAtRef.current = Date.now();
            setDiscoveryBanner({
              tone: "warning",
              text: `GPS accuracy is too low to confirm discoveries yet. Move closer or wait for accuracy below ${Math.round(discoveryResult.maxAllowedAccuracyMeters)} m.`,
            });
          }

          return false;
        }

        if (options.persistToCache) {
          await cacheDiscoveryCheckResult(
            authenticatedUser.id,
            discoveryResult,
          );
        }

        if (
          discoveryResult.discoveredLocationCount === 0 &&
          discoveryResult.completedJourneyCount === 0
        ) {
          return false;
        }

        setLocations((currentLocations) =>
          applyDiscoveryResultsToLocations(
            currentLocations,
            discoveryResult.discoveredLocations,
          ),
        );
        setJourneys((currentJourneys) =>
          applyDiscoveryResultsToJourneys(
            currentJourneys,
            discoveryResult.completedJourneys,
          ),
        );

        const hasUnknownDiscoveredContent =
          discoveryResult.discoveredLocations.some(
            (discovery) => !locationsById.has(discovery.locationId),
          ) ||
          discoveryResult.completedJourneys.some(
            (journey) => !journeysById.has(journey.journeyId),
          );

        if (hasUnknownDiscoveredContent && !options.offlineCapture) {
          try {
            const syncedContent = await syncAllContentCaches();
            const hydratedContent = await hydrateMapContent(
              syncedContent.locations.filter(hasValidCoordinates),
              syncedContent.journeys.filter(hasValidCoordinates),
              authenticatedUser.id,
            );

            setLocations(hydratedContent.locations);
            setJourneys(hydratedContent.journeys);
            markContentUpdated();
          } catch {
            // Keep the discovery result visible even if refreshing the full map content fails.
          }
        }

        markDiscoveryProgressUpdated();

        const bannerMessage = buildDiscoveryBannerMessage(discoveryResult);
        if (bannerMessage) {
          setDiscoveryBanner({
            tone: "success",
            text: options.offlineCapture
              ? `${bannerMessage}. Saved offline and will sync when you're back online.`
              : bannerMessage,
          });
        }

        return true;
      }

      try {
        if (authStatus === "authenticated-offline") {
          await finalizeDiscoveryResult(
            await captureOfflineDiscoveryCheck({
              userId: authenticatedUser.id,
              latitude,
              longitude,
              accuracyMeters,
              locations,
              journeys,
            }),
            {
              persistToCache: false,
              offlineCapture: true,
            },
          );
          return;
        }

        const discoveryResult = await checkDiscoveries({
          latitude,
          longitude,
          accuracyMeters,
        });
        await finalizeDiscoveryResult(discoveryResult, {
          persistToCache: true,
          offlineCapture: false,
        });
      } catch (error) {
        if (isApiNetworkError(error)) {
          try {
            const didCaptureOffline = await finalizeDiscoveryResult(
              await captureOfflineDiscoveryCheck({
                userId: authenticatedUser.id,
                latitude,
                longitude,
                accuracyMeters,
                locations,
                journeys,
              }),
              {
                persistToCache: false,
                offlineCapture: true,
              },
            );

            if (didCaptureOffline) {
              return;
            }
          } catch {
            // Fall through to the offline warning banner below.
          }
        }

        if (!shouldShowDiscoveryFeedback(lastDiscoveryErrorAtRef.current)) {
          return;
        }

        lastDiscoveryErrorAtRef.current = Date.now();
        setDiscoveryBanner({
          tone: isApiNetworkError(error) ? "warning" : "error",
          text: isApiNetworkError(error)
            ? "Discovery sync paused while you're offline."
            : getApiErrorMessage(
                error,
                "Could not sync nearby discoveries right now.",
              ),
        });
      } finally {
        discoveryCheckInFlightRef.current = false;
      }
    })();
  }, [
    authStatus,
    authUser,
    currentPosition?.coords.accuracy,
    currentPosition?.coords.latitude,
    currentPosition?.coords.longitude,
    journeys,
    locationPermissionGranted,
    locations,
    contentRevision,
    journeysById,
    markContentUpdated,
    markDiscoveryProgressUpdated,
    locationsById,
  ]);

  async function centerToUser() {
    let hasPermission = locationPermissionGranted;

    if (!hasPermission) {
      hasPermission = await LocationManager.requestPermissions();
      setLocationPermissionGranted(hasPermission);
    }

    if (!hasPermission) {
      return;
    }

    const resolvedPosition =
      currentPosition ?? (await LocationManager.getCurrentPosition());

    if (!resolvedPosition) {
      return;
    }

    cameraRef.current?.setStop({
      center: [
        resolvedPosition.coords.longitude,
        resolvedPosition.coords.latitude,
      ],
      zoom: 15,
      duration: 700,
    });
  }

  function toggleToolPanel(panel: Exclude<ActiveToolPanel, null>) {
    setActiveToolPanel((currentPanel) =>
      currentPanel === panel ? null : panel,
    );
  }

  function toggleCategory(category: string) {
    setCategoryVisibility((currentVisibility) => ({
      ...currentVisibility,
      [category]: !isCategoryVisible(currentVisibility, category),
    }));
  }

  function enableAllCategories() {
    setCategoryVisibility((currentVisibility) => {
      const nextVisibility = { ...currentVisibility };

      for (const category of availableCategories) {
        nextVisibility[category] = true;
      }

      return nextVisibility;
    });
  }

  function handleMapPress() {
    setActiveToolPanel(null);

    if (selectedTarget) {
      setBottomSheetState("hidden");
    }
  }

  function handleMapRegionChange(
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) {
    const nextBearing = Number(event.nativeEvent.bearing);
    const nextZoom = Number(event.nativeEvent.zoom);
    const nextCenterLatitude = Number(event.nativeEvent.center?.[1]);

    if (Number.isFinite(nextBearing)) {
      setMapBearing(nextBearing);
    }

    if (Number.isFinite(nextZoom)) {
      setMapZoom(nextZoom);
    }

    if (Number.isFinite(nextCenterLatitude)) {
      setMapCenterLatitude(nextCenterLatitude);
    }
  }

  function resetMapOrientation() {
    cameraRef.current?.setStop({
      bearing: 0,
      duration: 450,
    });
  }

  function handleLocationSourcePress(
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ) {
    event.stopPropagation();
    selectMapTarget(event, "location");
  }

  function handleJourneySourcePress(
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ) {
    event.stopPropagation();
    selectMapTarget(event, "journey");
  }

  function selectMapTarget(
    event: NativeSyntheticEvent<PressEventWithFeatures>,
    kind: SelectedMapTarget["kind"],
  ) {
    const pressedId = getPressedFeatureId(event);

    if (pressedId === null) {
      return;
    }

    setSelectedTarget({
      kind,
      id: pressedId,
    });
    setBottomSheetState("collapsed");
  }

  function handleOpenDetails(selection: MapBottomSheetSelection) {
    if (selection.kind === "location") {
      router.push({
        pathname: "/location/[locationId]",
        params: {
          locationId: String(selection.item.id),
        },
      });

      return;
    }

    router.push({
      pathname: "/journey/[journeyId]",
      params: {
        journeyId: String(selection.item.id),
      },
    });
  }

  async function handleToggleActive(selection: MapBottomSheetSelection) {
    const currentUserId = authUser?.id ?? "";

    if (!currentUserId) {
      return;
    }

    const targetKey = getMapSelectionKey(selection);
    setActiveToggleTargetKey(targetKey);

    try {
      if (selection.kind === "location") {
        const nextActive = selection.item.active !== true;

        if (nextActive) {
          await markActiveItem({
            userId: currentUserId,
            itemType: "LOCATION",
            itemId: selection.item.id,
          });
        } else {
          await clearActiveItem(currentUserId, "LOCATION", selection.item.id);
        }

        setLocations((currentLocations) =>
          currentLocations.map((location) =>
            location.id === selection.item.id
              ? {
                  ...location,
                  active: nextActive,
                  activeAt: nextActive ? new Date().toISOString() : null,
                }
              : location,
          ),
        );
        markActiveItemsUpdated();

        return;
      }

      const nextActive = selection.item.active !== true;

      if (nextActive) {
        await markActiveItem({
          userId: currentUserId,
          itemType: "JOURNEY",
          itemId: selection.item.id,
        });
      } else {
        await clearActiveItem(currentUserId, "JOURNEY", selection.item.id);
      }

      setJourneys((currentJourneys) =>
        currentJourneys.map((journey) =>
          journey.id === selection.item.id
            ? {
                ...journey,
                active: nextActive,
                activeAt: nextActive ? new Date().toISOString() : null,
              }
            : journey,
        ),
      );
      markActiveItemsUpdated();
    } catch {
      setDiscoveryBanner({
        tone: "error",
        text: "Could not update active items right now.",
      });
    } finally {
      setActiveToggleTargetKey((currentKey) =>
        currentKey === targetKey ? null : currentKey,
      );
    }
  }

  return (
    <View style={styles.container}>
      <MapLibreMap
        style={styles.map}
        mapStyle={currentMapStyleUrl}
        androidView="texture"
        attribution
        compass={false}
        logo={false}
        onRegionIsChanging={handleMapRegionChange}
        onRegionDidChange={handleMapRegionChange}
        onPress={handleMapPress}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: DEFAULT_MAP_CENTER,
            zoom: 7,
          }}
        />

        {locationPermissionGranted && <UserLocation accuracy heading />}
        <Images images={mapMarkerImages} />

        <GeoJSONSource
          key={locationSourceId}
          id={locationSourceId}
          data={locationGeoJson}
          hitbox={markerHitbox}
          onPress={handleLocationSourcePress}
        >
          <Layer
            id={locationLayerId}
            type="symbol"
            layout={locationMarkerLayout}
          />
        </GeoJSONSource>

        <GeoJSONSource
          key={journeySourceId}
          id={journeySourceId}
          data={journeyGeoJson}
          hitbox={markerHitbox}
          onPress={handleJourneySourcePress}
        >
          <Layer
            id={journeyLayerId}
            type="symbol"
            layout={journeyMarkerLayout}
          />
        </GeoJSONSource>
      </MapLibreMap>

      <View style={styles.tools}>
        <Pressable
          accessibilityLabel="Center map on your location"
          accessibilityRole="button"
          onPress={centerToUser}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.toolButtonPressed,
          ]}
        >
          <Ionicons color="#0F172A" name="locate" size={22} />
        </Pressable>

        <Pressable
          accessibilityLabel="Choose map type"
          accessibilityRole="button"
          onPress={() => toggleToolPanel("map-style")}
          style={({ pressed }) => [
            styles.toolButton,
            activeToolPanel === "map-style" && styles.toolButtonActive,
            pressed && styles.toolButtonPressed,
          ]}
        >
          <Ionicons
            color={activeToolPanel === "map-style" ? "#FFFFFF" : "#0F172A"}
            name="layers-outline"
            size={22}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Filter map categories"
          accessibilityRole="button"
          onPress={() => toggleToolPanel("category-filter")}
          style={({ pressed }) => [
            styles.toolButton,
            (activeToolPanel === "category-filter" ||
              isCategoryFilterModified) &&
              styles.toolButtonActive,
            pressed && styles.toolButtonPressed,
          ]}
        >
          <Ionicons
            color={
              activeToolPanel === "category-filter" || isCategoryFilterModified
                ? "#FFFFFF"
                : "#0F172A"
            }
            name="funnel-outline"
            size={22}
          />
          {isCategoryFilterModified ? (
            <View style={styles.toolButtonBadge}>
              <Text style={styles.toolButtonBadgeText}>
                {enabledCategoryCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {activeToolPanel === "map-style" ? (
          <View style={styles.toolPanel}>
            <Text style={styles.toolPanelEyebrow}>Map Type</Text>
            <Text style={styles.toolPanelHint}>
              Road stays available offline between zooms{" "}
              {DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM} and{" "}
              {DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM}.
            </Text>

            <View style={styles.toolOptionList}>
              {MAP_STYLE_OPTIONS.map((styleOption) => {
                const isActive = selectedMapStyle === styleOption.key;

                return (
                  <Pressable
                    key={styleOption.key}
                    accessibilityRole="button"
                    onPress={() => setSelectedMapStyle(styleOption.key)}
                    style={({ pressed }) => [
                      styles.toolOption,
                      isActive && styles.toolOptionActive,
                      pressed && styles.toolOptionPressed,
                    ]}
                  >
                    <Ionicons
                      color={isActive ? "#115E59" : "#475569"}
                      name={styleOption.icon}
                      size={18}
                    />
                    <Text
                      style={[
                        styles.toolOptionText,
                        isActive && styles.toolOptionTextActive,
                      ]}
                    >
                      {styleOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {activeToolPanel === "category-filter" ? (
          <View style={styles.toolPanel}>
            <View style={styles.toolPanelHeader}>
              <Text style={styles.toolPanelEyebrow}>Categories</Text>
              {!allCategoriesEnabled ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={enableAllCategories}
                  style={({ pressed }) => [
                    styles.panelActionPill,
                    pressed && styles.panelActionPillPressed,
                  ]}
                >
                  <Text style={styles.panelActionPillText}>All on</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.toolPanelHint}>
              Showing {enabledCategoryCount} of {availableCategories.length}{" "}
              categories
            </Text>

            <View style={styles.filterChipWrap}>
              {availableCategories.map((category) => {
                const isActive = isCategoryVisible(
                  categoryVisibility,
                  category,
                );

                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    onPress={() => toggleCategory(category)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      pressed && styles.filterChipPressed,
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
            </View>
          </View>
        ) : null}

        {shouldShowCompass ? (
          <Pressable
            accessibilityLabel="Reset map orientation to north"
            accessibilityRole="button"
            onPress={resetMapOrientation}
            style={({ pressed }) => [
              styles.toolButton,
              styles.compassToolButton,
              pressed && styles.toolButtonPressed,
            ]}
          >
            <View style={styles.compassContent}>
              <View
                style={[
                  styles.compassArrowWrap,
                  {
                    transform: [{ rotate: `${-normalizedMapBearing}deg` }],
                  },
                ]}
              >
                <Text style={styles.compassNorthLabel}>N</Text>
                <MaterialCommunityIcons
                  color="#334155"
                  name="navigation"
                  size={24}
                  style={styles.compassArrowIcon}
                />
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>

      {isMapDataLoading || mapDataError ? (
        <View
          style={[
            styles.statusCard,
            {
              paddingTop: 14,
              paddingRight: 16,
              paddingBottom: 14,
              paddingLeft: 16,
            },
          ]}
        >
          {isMapDataLoading ? (
            <Text style={styles.statusText}>Loading map data...</Text>
          ) : null}

          {mapDataError ? (
            <Text style={styles.errorText}>{mapDataError}</Text>
          ) : null}
        </View>
      ) : null}

      {mapScale ? (
        <View
          style={[
            styles.scaleCard,
            {
              bottom:
                (bottomSheetState === "hidden" ? 4 : 132) +
                Math.max(insets.bottom, 8) +
                (discoveryBanner ? 72 : 0),
              left: 12,
            },
          ]}
        >
          <Text style={styles.scaleLabel}>{mapScale.label}</Text>
          <View style={[styles.scaleBar, { width: mapScale.widthPx }]} />
        </View>
      ) : null}

      {discoveryBanner ? (
        <View
          style={[
            styles.discoveryBanner,
            discoveryBanner.tone === "success" && styles.discoveryBannerSuccess,
            discoveryBanner.tone === "warning" && styles.discoveryBannerWarning,
            discoveryBanner.tone === "error" && styles.discoveryBannerError,
            {
              bottom:
                (bottomSheetState === "hidden" ? 24 : 132) +
                Math.max(insets.bottom, 8),
            },
          ]}
        >
          <Text style={styles.discoveryBannerText}>{discoveryBanner.text}</Text>
        </View>
      ) : null}

      <MapSelectionBottomSheet
        selection={selectedMapItem}
        state={bottomSheetState}
        onChangeState={setBottomSheetState}
        isActiveTogglePending={isActiveTogglePending}
        onOpenDetails={handleOpenDetails}
        onToggleActive={handleToggleActive}
        onRequestClose={() => setBottomSheetState("hidden")}
      />
    </View>
  );
}

const achievedMarkerExpression = ["boolean", ["get", "achieved"], false] as any;

const activeMarkerExpression = ["boolean", ["get", "active"], false] as any;

const selectedLocationMarkerIconSizeExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  0.42,
  0.336,
] as any;

const selectedJourneyMarkerIconSizeExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  0.456,
  0.372,
] as any;

const markerSortKeyExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  2,
  activeMarkerExpression,
  1,
  achievedMarkerExpression,
  0.5,
  0,
] as any;

const baseMarkerLayout = {
  "icon-image": ["get", "markerIcon"],
  "icon-anchor": "center",
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
  "symbol-sort-key": markerSortKeyExpression,
} as any;

const locationMarkerLayout = {
  ...baseMarkerLayout,
  "icon-size": selectedLocationMarkerIconSizeExpression,
} as any;

const journeyMarkerLayout = {
  ...baseMarkerLayout,
  "icon-size": selectedJourneyMarkerIconSizeExpression,
} as any;

const selectedJourneyMarkerSizeExpression = 17 as any;

const selectedJourneyMarkerHaloWidthExpression = 2 as any;

const achievedJourneyMarkerColorExpression = "#f97316" as any;

const achievedJourneyMarkerHaloColorExpression = "#fff7ed" as any;

const journeyDiamondLayout = {
  "text-field": "◆",
  "text-size": selectedJourneyMarkerSizeExpression,
  "text-allow-overlap": true,
  "text-ignore-placement": true,
};

const journeyDiamondPaint = {
  "text-color": achievedJourneyMarkerColorExpression,
  "text-halo-width": selectedJourneyMarkerHaloWidthExpression,
  "text-halo-color": achievedJourneyMarkerHaloColorExpression,
};

const selectedCategoryMarkerIconSizeExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  0.76,
  0.64,
] as any;

const categoryMarkerIconLayout = {
  "icon-image": ["get", "markerIcon"],
  "icon-size": selectedCategoryMarkerIconSizeExpression,
  "icon-anchor": "center",
  "icon-padding": [2, 2, 2, 2],
  "icon-allow-overlap": false,
  "icon-ignore-placement": false,
} as any;

const categoryMarkerIconPaint = {
  "icon-opacity": 0.98,
} as any;

void journeyDiamondLayout;
void journeyDiamondPaint;
void categoryMarkerIconLayout;
void categoryMarkerIconPaint;

const markerHitbox = {
  top: 14,
  right: 14,
  bottom: 14,
  left: 14,
} as const;

type MapPoint = {
  id: number;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
};

type SelectedMapTarget =
  | {
      kind: "location";
      id: number;
    }
  | {
      kind: "journey";
      id: number;
    };

function createPointFeatureCollection<T extends MapPoint>(
  points: T[],
  kind: "location" | "journey",
  selectedId: number | null,
  options: {
    isAchieved: (point: T) => boolean;
    isActive: (point: T) => boolean;
  },
) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => {
      const normalizedCategory =
        kind === "journey"
          ? normalizeJourneyCategory(point.category)
          : normalizeLocationCategory(point.category);
      const achieved = options.isAchieved(point);
      const active = options.isActive(point);

      return {
        type: "Feature" as const,
        id: `${kind}-${point.id}`,
        properties: {
          id: point.id,
          kind,
          title: point.title,
          category: normalizedCategory,
          markerIcon: getMapMarkerImageId(
            kind,
            normalizedCategory,
            getMapMarkerState(achieved, active),
          ),
          achieved,
          active,
          selected: point.id === selectedId,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude],
        },
      };
    }),
  };
}

function buildAvailableMapCategories(
  locations: Location[],
  journeys: Journey[],
) {
  const categories = new Set<string>();

  for (const location of locations) {
    categories.add(normalizeLocationCategory(location.category));
  }

  for (const journey of journeys) {
    categories.add(normalizeJourneyCategory(journey.category));
  }

  return [...categories].sort((left, right) => left.localeCompare(right));
}

function syncCategoryVisibility(
  currentVisibility: Record<string, boolean>,
  availableCategories: string[],
) {
  const nextVisibility: Record<string, boolean> = {};
  let didChange = false;

  for (const category of availableCategories) {
    if (category in currentVisibility) {
      nextVisibility[category] = currentVisibility[category];
      continue;
    }

    nextVisibility[category] = true;
    didChange = true;
  }

  const currentKeys = Object.keys(currentVisibility);
  if (currentKeys.length !== availableCategories.length) {
    didChange = true;
  }

  return didChange ? nextVisibility : currentVisibility;
}

function isCategoryVisible(
  categoryVisibility: Record<string, boolean>,
  category: string,
) {
  return categoryVisibility[category] ?? true;
}

function normalizeMapBearing(bearing: number) {
  if (!Number.isFinite(bearing)) {
    return 0;
  }

  const normalizedBearing = bearing % 360;

  if (normalizedBearing > 180) {
    return normalizedBearing - 360;
  }

  if (normalizedBearing < -180) {
    return normalizedBearing + 360;
  }

  return normalizedBearing;
}

function buildMapScaleIndicator(
  latitude: number,
  zoom: number,
  maxWidthPx: number,
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(zoom) ||
    !Number.isFinite(maxWidthPx) ||
    maxWidthPx <= 0
  ) {
    return null;
  }

  const metersPerPixel =
    (156543.03392 * Math.cos(toRadians(latitude))) / 2 ** zoom;

  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
    return null;
  }

  const maxDistanceMeters = metersPerPixel * maxWidthPx;
  const scaleDistanceMeters = getNiceScaleDistance(maxDistanceMeters);

  if (!Number.isFinite(scaleDistanceMeters) || scaleDistanceMeters <= 0) {
    return null;
  }

  return {
    label: formatScaleDistance(scaleDistanceMeters),
    widthPx: Math.max(
      28,
      Math.min(maxWidthPx, scaleDistanceMeters / metersPerPixel),
    ),
  };
}

function getNiceScaleDistance(maxDistanceMeters: number) {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters <= 0) {
    return 0;
  }

  const exponent = Math.floor(Math.log10(maxDistanceMeters));
  const multipliers = [5, 2, 1];

  for (
    let currentExponent = exponent;
    currentExponent >= -2;
    currentExponent -= 1
  ) {
    const base = 10 ** currentExponent;

    for (const multiplier of multipliers) {
      const candidate = multiplier * base;

      if (candidate <= maxDistanceMeters) {
        return candidate;
      }
    }
  }

  return maxDistanceMeters;
}

function formatScaleDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    const distanceKm = distanceMeters / 1000;

    if (distanceKm < 10 && distanceKm % 1 !== 0) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  if (distanceMeters >= 10) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${distanceMeters.toFixed(1)} m`;
}

function hasValidCoordinates(point: { latitude: number; longitude: number }) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

async function loadLiveMapData() {
  const [locationsResult, journeysResult] = await Promise.allSettled([
    getActiveLocations(),
    getActiveJourneys(),
  ]);

  const locations =
    locationsResult.status === "fulfilled"
      ? locationsResult.value.filter(hasValidCoordinates)
      : [];
  const journeys =
    journeysResult.status === "fulfilled"
      ? journeysResult.value.filter(hasValidCoordinates)
      : [];

  if (
    locationsResult.status === "fulfilled" &&
    journeysResult.status === "fulfilled"
  ) {
    try {
      await cacheActiveContent({
        locations: locationsResult.value,
        journeys: journeysResult.value,
      });
    } catch {
      // Keep showing live content even if persisting it fails.
    }
  }

  return {
    locations,
    journeys,
    locationsResult,
    journeysResult,
  };
}

async function hydrateMapContent(
  locations: Location[],
  journeys: Journey[],
  userId: string | null | undefined,
) {
  const [hydratedLocations, hydratedJourneys] = await Promise.all([
    hydrateLocationsWithProgress(userId, locations),
    hydrateJourneysWithProgress(userId, journeys),
  ]);

  return {
    locations: hydratedLocations,
    journeys: hydratedJourneys,
  };
}

function getMapSelectionKey(selection: MapBottomSheetSelection) {
  return `${selection.kind}:${selection.item.id}`;
}

function resolveVisibleMapDataError(
  locationsResult: PromiseSettledResult<Location[]>,
  journeysResult: PromiseSettledResult<Journey[]>,
  visibleLocationCount: number,
  visibleJourneyCount: number,
) {
  const locationFailed =
    locationsResult.status === "rejected" && visibleLocationCount === 0;
  const journeyFailed =
    journeysResult.status === "rejected" && visibleJourneyCount === 0;

  if (locationFailed && journeyFailed) {
    return "Could not load locations or journeys.";
  }

  if (locationFailed) {
    return "Could not load locations.";
  }

  if (journeyFailed) {
    return "Could not load journeys.";
  }

  return null;
}

function parseNumericParam(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(firstValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function getPressedFeatureId(
  event: NativeSyntheticEvent<PressEventWithFeatures>,
) {
  const rawId = event.nativeEvent.features[0]?.properties?.id;

  if (typeof rawId === "number" && Number.isInteger(rawId)) {
    return rawId;
  }

  if (typeof rawId === "string") {
    const parsedId = Number(rawId);

    if (Number.isInteger(parsedId)) {
      return parsedId;
    }
  }

  return null;
}

function shouldTriggerDiscoveryCheck(
  lastCheck: { latitude: number; longitude: number; at: number } | null,
  latitude: number,
  longitude: number,
) {
  if (!lastCheck) {
    return true;
  }

  const elapsedMs = Date.now() - lastCheck.at;
  if (elapsedMs >= DISCOVERY_WARNING_COOLDOWN_MS) {
    return true;
  }

  if (elapsedMs < DISCOVERY_CHECK_MIN_INTERVAL_MS) {
    return false;
  }

  return (
    calculateDistanceMeters(
      lastCheck.latitude,
      lastCheck.longitude,
      latitude,
      longitude,
    ) >= DISCOVERY_CHECK_MIN_DISTANCE_METERS
  );
}

function shouldShowDiscoveryFeedback(lastShownAt: number) {
  return Date.now() - lastShownAt >= DISCOVERY_WARNING_COOLDOWN_MS;
}

function applyDiscoveryResultsToLocations(
  locations: Location[],
  discoveries: {
    locationId: number;
    discoveredAt: string;
  }[],
) {
  if (discoveries.length === 0) {
    return locations;
  }

  const discoveredAtByLocationId = new Map(
    discoveries.map(
      (discovery) => [discovery.locationId, discovery.discoveredAt] as const,
    ),
  );

  return locations.map((location) => {
    const discoveredAt = discoveredAtByLocationId.get(location.id);

    if (!discoveredAt) {
      return location;
    }

    return {
      ...location,
      discovered: true,
      discoveredAt,
    };
  });
}

function applyDiscoveryResultsToJourneys(
  journeys: Journey[],
  completedJourneys: {
    journeyId: number;
    completedAt: string;
  }[],
) {
  if (completedJourneys.length === 0) {
    return journeys;
  }

  const completedAtByJourneyId = new Map(
    completedJourneys.map(
      (journey) => [journey.journeyId, journey.completedAt] as const,
    ),
  );

  return journeys.map((journey) => {
    const completedAt = completedAtByJourneyId.get(journey.id);

    if (!completedAt) {
      return journey;
    }

    return {
      ...journey,
      completed: true,
      completedAt,
    };
  });
}

function calculateDistanceMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const earthRadiusMeters = 6_371_000;
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

  return earthRadiusMeters * arc;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  tools: {
    position: "absolute",
    right: TOOLBAR_RIGHT_OFFSET,
    top: TOOLBAR_TOP_OFFSET,
    gap: TOOLBAR_GAP,
    alignItems: "flex-end",
  },
  toolButton: {
    width: TOOLBAR_BUTTON_SIZE,
    height: TOOLBAR_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },
  toolButtonActive: {
    backgroundColor: "#0F766E",
  },
  compassToolButton: {
    overflow: "hidden",
  },
  compassContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  compassNorthLabel: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 10,
    letterSpacing: 0.4,
    marginBottom: -1,
  },
  compassArrowWrap: {
    width: 24,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compassArrowIcon: {
    marginTop: 1,
  },
  toolButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  toolButtonBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B91C1C",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  toolButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  toolPanel: {
    width: 236,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  toolPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toolPanelEyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  toolPanelHint: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  toolOptionList: {
    gap: 10,
  },
  toolOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toolOptionActive: {
    borderColor: "#0F766E",
    backgroundColor: "#CCFBF1",
  },
  toolOptionPressed: {
    backgroundColor: "#F8FAFC",
  },
  toolOptionText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  toolOptionTextActive: {
    color: "#115E59",
  },
  panelActionPill: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  panelActionPillPressed: {
    backgroundColor: "#E2E8F0",
  },
  panelActionPillText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D5D0C5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },
  filterChipPressed: {
    backgroundColor: "#F8FAFC",
  },
  filterChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  statusCard: {
    position: "absolute",
    top: 0,
    left: 0,
    minWidth: 168,
    gap: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  scaleCard: {
    position: "absolute",
    alignItems: "flex-start",
    gap: 6,
  },
  scaleLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(255, 255, 255, 0.92)",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 8,
  },
  scaleBar: {
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#0F172A",
  },
  statusText: {
    color: "#334155",
    fontSize: 13,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  discoveryBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },
  discoveryBannerSuccess: {
    backgroundColor: "#CCFBF1",
  },
  discoveryBannerWarning: {
    backgroundColor: "#FEF3C7",
  },
  discoveryBannerError: {
    backgroundColor: "#FEE2E2",
  },
  discoveryBannerText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
