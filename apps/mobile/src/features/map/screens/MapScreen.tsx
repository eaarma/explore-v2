import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  type NativeSyntheticEvent,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { CameraRef, LocationManager } from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  clearActiveItem,
  clearActiveTripSelection,
  markActiveItem,
} from "@/src/features/discoveries/storage/discoveryCache";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { MapHeaderActions } from "@/src/features/map/components/MapHeaderActions";
import { MapCanvas } from "@/src/features/map/components/MapCanvas";
import { MapLegendDialog } from "@/src/features/map/components/MapLegendDialog";
import { MapSearchOverlay } from "@/src/features/map/components/MapSearchOverlay";
import { MapToolbar } from "@/src/features/map/components/MapToolbar";
import { useActiveTripMapContext } from "@/src/features/map/hooks/useActiveTripMapContext";
import { useMapContent } from "@/src/features/map/hooks/useMapContent";
import { useMapDiscoverySync } from "@/src/features/map/hooks/useMapDiscoverySync";
import { useMapLocationPermission } from "@/src/features/map/hooks/useMapLocationPermission";
import { useSelectedJourneyMapContext } from "@/src/features/map/hooks/useSelectedJourneyMapContext";
import {
  useMapScreenModel,
  type MapScreenTarget,
} from "@/src/features/map/hooks/useMapScreenModel";
import { useMapStyle } from "@/src/features/map/hooks/useMapStyle";
import type { ActiveToolPanel } from "@/src/features/map/types/mapUiTypes";
import { MapSelectionBottomSheet } from "@/src/features/map/components/MapSelectionBottomSheet";
import type {
  MapBottomSheetSelection,
  MapBottomSheetState,
} from "@/src/features/map/components/MapSelectionBottomSheet";
import type {
  PressEventWithFeatures,
  ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { useTripsStore } from "@/src/features/trips/store/tripsStore";
import { styles } from "@/src/features/map/screens/MapScreen.styles";
import {
  isCategoryVisible,
  syncCategoryVisibility,
} from "@/src/features/map/utils/mapFeatureCollection";
import { type MapSearchResult } from "@/src/features/map/utils/mapSearch";
import {
  formatTripItemCount,
  getMapSelectionKey,
  getPressedFeatureId,
  parseNumericParam,
} from "@/src/features/map/utils/mapView";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import {
  DEFAULT_MAP_CENTER,
  type MapOverlayKey,
} from "@/src/features/map/mapConfig";
import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";

export function MapScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeStateColors = useMemo(
    () => getActiveStateColors(isDark),
    [isDark],
  );
  const authStatus = useAuthStore((state) => state.status);
  const authUser = useAuthStore((state) => state.user);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore(
    (state) => state.markUpdated,
  );
  const tripsRevision = useTripsStore((state) => state.revision);
  const markTripsUpdated = useTripsStore((state) => state.markUpdated);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const selectedMapStyle = useAppSettingsStore(
    (state) => state.defaultMapStyle,
  );
  const persistDefaultMapStyle = useAppSettingsStore(
    (state) => state.setDefaultMapStyle,
  );
  const cameraRef = useRef<CameraRef>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const lastAppliedCameraFocusAtRef = useRef<string | null>(null);
  const lastAppliedSelectionFocusAtRef = useRef<string | null>(null);
  const lastAppliedJourneyBoundsRequestKeyRef = useRef<string | null>(null);
  const { focusLatitude, focusLongitude, focusAt, focusKind, focusItemId } =
    useLocalSearchParams<{
      focusLatitude?: string;
      focusLongitude?: string;
      focusAt?: string;
      focusKind?: MapScreenTarget["kind"];
      focusItemId?: string;
    }>();

  const {
    currentPosition,
    ensureLocationPermission,
    latestPosition,
    locationPermissionGranted,
  } = useMapLocationPermission();
  const {
    isMapDataLoading,
    journeys,
    locations,
    mapDataError,
    setJourneys,
    setLocations,
  } = useMapContent({
    activeItemsRevision,
    authUserId: authUser?.id,
    contentRevision,
  });
  const { activeTripMapContext, setActiveTripMapContext } =
    useActiveTripMapContext({
      authUserId: authUser?.id,
      markTripsUpdated,
      tripsRevision,
    });
  const { resolvedMapStyle, roadLabelLayerId } = useMapStyle(selectedMapStyle);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedTarget, setSelectedTarget] =
    useState<MapScreenTarget | null>(null);
  const [bottomSheetState, setBottomSheetState] =
    useState<MapBottomSheetState>("hidden");
  const [activeToolPanel, setActiveToolPanel] = useState<ActiveToolPanel>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapBearing, setMapBearing] = useState(0);
  const [mapZoom, setMapZoom] = useState(7);
  const [mapCenterLatitude, setMapCenterLatitude] = useState(
    DEFAULT_MAP_CENTER[1],
  );
  const [categoryVisibility, setCategoryVisibility] = useState<
    Record<string, boolean>
  >({});
  const [overlayVisibility, setOverlayVisibility] = useState<
    Record<MapOverlayKey, boolean>
  >({
    hillshade: false,
    hikingTrails: false,
    protectedAreas: false,
    wetlands: false,
    hydrology: false,
    landcover: false,
  });
  const [activeToggleTargetKey, setActiveToggleTargetKey] = useState<
    string | null
  >(null);
  const [selectedJourneyBoundsRequestKey, setSelectedJourneyBoundsRequestKey] =
    useState<string | null>(null);
  const selectedLocationId =
    selectedTarget?.kind === "location" && bottomSheetState !== "hidden"
      ? selectedTarget.id
      : null;
  const selectedJourneyId =
    selectedTarget?.kind === "journey" && bottomSheetState !== "hidden"
      ? selectedTarget.id
      : null;

  const locationsById = useMemo(
    () =>
      new globalThis.Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  const journeysById = useMemo(
    () => new globalThis.Map(journeys.map((journey) => [journey.id, journey])),
    [journeys],
  );
  const selectedJourneyCoordinate =
    selectedJourneyId !== null
      ? journeysById.get(selectedJourneyId) ?? null
      : null;
  const { selectedJourneyMapContext } = useSelectedJourneyMapContext({
    contentRevision,
    selectedJourneyCoordinate,
    selectedJourneyId,
  });
  const { discoveryBanner, showDiscoveryBanner } = useMapDiscoverySync({
    authStatus,
    authUser,
    currentPosition,
    journeys,
    journeysById,
    locationPermissionGranted,
    locations,
    locationsById,
    markContentUpdated,
    markDiscoveryProgressUpdated,
    setJourneys,
    setLocations,
  });
  const {
    allCategoriesEnabled,
    availableCategories,
    enabledCategoryCount,
    enabledOverlayCount,
    hasEnabledOverlays,
    isActiveTogglePending,
    isCategoryFilterModified,
    journeyGeoJson,
    locationGeoJson,
    mapScale,
    mapSearchResults,
    normalizedMapBearing,
    selectedMapItem,
    shouldShowCompass,
    visibleJourneysById,
    visibleLocationsById,
  } = useMapScreenModel({
    activeToggleTargetKey,
    activeTripMapContext,
    categoryVisibility,
    journeys,
    locations,
    mapBearing,
    mapCenterLatitude,
    mapZoom,
    overlayVisibility,
    searchQuery,
    selectedJourneyMapContext,
    selectedJourneyId,
    selectedLocationId,
    selectedTarget,
  });
  const mapCanvasKey = useMemo(() => {
    const resolvedStyleKey =
      typeof resolvedMapStyle === "string"
        ? resolvedMapStyle
        : `${selectedMapStyle}-adjusted`;

    return `${resolvedStyleKey}-${roadLabelLayerId ?? "no-road-label"}`;
  }, [resolvedMapStyle, roadLabelLayerId, selectedMapStyle]);
  const chromeColors = useMemo(
    () =>
      isDark
        ? {
            toolButtonBackground: "rgba(15, 23, 42, 0.96)",
            toolButtonBorder: "#334155",
            toolButtonActiveBackground: activeStateColors.selectionBackground,
            toolButtonActiveBorder: activeStateColors.border,
            toolButtonIcon: "#E2E8F0",
            toolButtonActiveIcon: activeStateColors.text,
            toolPanelBackground: "rgba(15, 23, 42, 0.98)",
            toolPanelBorder: "#1E293B",
            toolPanelEyebrow: activeStateColors.tint,
            toolPanelHint: "#CBD5E1",
            searchInputBackground: "#111827",
            searchInputBorder: "#334155",
            searchInputText: "#F8FAFC",
            searchInputPlaceholder: "#94A3B8",
            searchCloseIcon: "#CBD5E1",
            toolOptionBackground: "#111827",
            toolOptionBorder: "#334155",
            toolOptionActiveBackground: activeStateColors.selectionBackground,
            toolOptionActiveBorder: activeStateColors.border,
            toolOptionPressedBackground: "#1E293B",
            toolOptionText: "#E2E8F0",
            toolOptionTextActive: activeStateColors.text,
            searchResultMeta: "#94A3B8",
            searchResultKindBackground: "#134E4A",
            searchResultKindText: "#CCFBF1",
            panelActionPillBackground: "#111827",
            panelActionPillPressedBackground: "#1E293B",
            panelActionPillText: "#E2E8F0",
            filterChipBackground: "#111827",
            filterChipBorder: "#334155",
            filterChipActiveBackground: activeStateColors.selectionBackground,
            filterChipActiveBorder: activeStateColors.border,
            filterChipPressedBackground: "#1E293B",
            filterChipText: "#E2E8F0",
            filterChipTextActive: activeStateColors.text,
            compassNorth: "#F87171",
            compassArrow: "#E2E8F0",
            badgeBackground: "#B91C1C",
            badgeBorder: "#0F172A",
            statusCardBackground: "rgba(15, 23, 42, 0.94)",
            statusText: "#E2E8F0",
            errorText: "#FCA5A5",
            scaleLabel: "#E2E8F0",
            scaleLabelShadow: "rgba(15, 23, 42, 0.92)",
            scaleBar: "#E2E8F0",
            discoverySuccess: "#134E4A",
            discoveryWarning: "#713F12",
            discoveryError: "#7F1D1D",
            discoveryText: "#F8FAFC",
          }
        : {
            toolButtonBackground: "rgba(255, 255, 255, 0.96)",
            toolButtonBorder: "#E2E8F0",
            toolButtonActiveBackground: activeStateColors.background,
            toolButtonActiveBorder: activeStateColors.border,
            toolButtonIcon: "#0F172A",
            toolButtonActiveIcon: activeStateColors.text,
            toolPanelBackground: "rgba(255, 255, 255, 0.97)",
            toolPanelBorder: "#E2E8F0",
            toolPanelEyebrow: activeStateColors.tint,
            toolPanelHint: "#475569",
            searchInputBackground: "#FEFCF8",
            searchInputBorder: "#D7E0EA",
            searchInputText: "#0F172A",
            searchInputPlaceholder: "#64748B",
            searchCloseIcon: "#64748B",
            toolOptionBackground: "#FFFFFF",
            toolOptionBorder: "#D7E0EA",
            toolOptionActiveBackground: activeStateColors.background,
            toolOptionActiveBorder: activeStateColors.border,
            toolOptionPressedBackground: "#F8FAFC",
            toolOptionText: "#334155",
            toolOptionTextActive: activeStateColors.text,
            searchResultMeta: "#64748B",
            searchResultKindBackground: "#CCFBF1",
            searchResultKindText: "#115E59",
            panelActionPillBackground: "#F1F5F9",
            panelActionPillPressedBackground: "#E2E8F0",
            panelActionPillText: "#334155",
            filterChipBackground: "#FFFFFF",
            filterChipBorder: "#D5D0C5",
            filterChipActiveBackground: activeStateColors.background,
            filterChipActiveBorder: activeStateColors.border,
            filterChipPressedBackground: "#F8FAFC",
            filterChipText: "#334155",
            filterChipTextActive: activeStateColors.text,
            compassNorth: "#DC2626",
            compassArrow: "#334155",
            badgeBackground: "#B91C1C",
            badgeBorder: "#FFFFFF",
            statusCardBackground: "rgba(255, 255, 255, 0.94)",
            statusText: "#334155",
            errorText: "#B91C1C",
            scaleLabel: "#334155",
            scaleLabelShadow: "rgba(255, 255, 255, 0.92)",
            scaleBar: "#0F172A",
            discoverySuccess: "#CCFBF1",
            discoveryWarning: "#FEF3C7",
            discoveryError: "#FEE2E2",
            discoveryText: "#0F172A",
          },
    [activeStateColors, isDark],
  );
  const headerActionColors = useMemo(
    () =>
      isDark
        ? {
            background: activeStateColors.buttonBackground,
            border: activeStateColors.border,
            pressedBackground: activeStateColors.buttonPressedBackground,
            text: activeStateColors.text,
          }
        : {
            background: "#EFF6FF",
            border: "#BFDBFE",
            pressedBackground: "#DBEAFE",
            text: "#1D4ED8",
          },
    [activeStateColors, isDark],
  );

  useLayoutEffect(() => {
    const isSearchPanelActive = activeToolPanel === "search";
    const isLegendDialogActive = activeToolPanel === "legend";

    navigation.setOptions({
      headerRight: () => (
        <MapHeaderActions
          isSearchActive={isSearchPanelActive}
          isLegendActive={isLegendDialogActive}
          colors={headerActionColors}
          onLegendPress={() => {
            setActiveToolPanel((currentPanel) =>
              currentPanel === "legend" ? null : "legend",
            );
          }}
          onSearchPress={() => {
            if (isSearchPanelActive) {
              closeSearchPanel();
              return;
            }

            setActiveToolPanel("search");
          }}
        />
      ),
    });
  }, [activeToolPanel, headerActionColors, navigation]);

  useEffect(() => {
    setCategoryVisibility((currentVisibility) =>
      syncCategoryVisibility(currentVisibility, availableCategories),
    );
  }, [availableCategories]);

  useEffect(() => {
    if (activeToolPanel !== "search") {
      return;
    }

    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeToolPanel]);

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

    if (focusKind === "journey") {
      setSelectedJourneyBoundsRequestKey(focusAt);
      return;
    }

    setSelectedJourneyBoundsRequestKey(null);
  }, [
    focusAt,
    focusItemId,
    focusKind,
    visibleJourneysById,
    visibleLocationsById,
  ]);

  useEffect(() => {
    if (selectedJourneyId === null) {
      lastAppliedJourneyBoundsRequestKeyRef.current = null;
      return;
    }

    if (
      !selectedJourneyBoundsRequestKey ||
      !selectedJourneyMapContext ||
      selectedJourneyMapContext.journeyId !== selectedJourneyId ||
      !selectedJourneyMapContext.bounds ||
      !isMapReady ||
      !cameraRef.current ||
      lastAppliedJourneyBoundsRequestKeyRef.current ===
        selectedJourneyBoundsRequestKey
    ) {
      return;
    }

    lastAppliedJourneyBoundsRequestKeyRef.current =
      selectedJourneyBoundsRequestKey;
    cameraRef.current.fitBounds(selectedJourneyMapContext.bounds, {
      duration: 900,
      easing: "ease",
      padding: {
        top: Math.max(insets.top + 24, 48),
        right: 48,
        bottom:
          Math.max(insets.bottom, 16) +
          (bottomSheetState === "expanded" ? 360 : 240),
        left: 48,
      },
    });
  }, [
    bottomSheetState,
    insets.bottom,
    insets.top,
    isMapReady,
    selectedJourneyBoundsRequestKey,
    selectedJourneyId,
    selectedJourneyMapContext,
  ]);

  useEffect(() => {
    if (selectedTarget && !selectedMapItem) {
      setSelectedTarget(null);
      setBottomSheetState("hidden");
    }
  }, [selectedMapItem, selectedTarget]);

  async function centerToUser() {
    const hasPermission = await ensureLocationPermission();

    if (!hasPermission) {
      return;
    }

    const resolvedPosition =
      latestPosition ??
      (await LocationManager.getCurrentPosition()) ??
      currentPosition;

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

  function clearSearchQuery() {
    setSearchQuery("");

    if (activeToolPanel === "search") {
      searchInputRef.current?.focus();
    }
  }

  function closeSearchPanel() {
    setSearchQuery("");
    setActiveToolPanel((currentPanel) =>
      currentPanel === "search" ? null : currentPanel,
    );
  }

  function toggleCategory(category: string) {
    setCategoryVisibility((currentVisibility) => ({
      ...currentVisibility,
      [category]: !isCategoryVisible(currentVisibility, category),
    }));
  }

  function toggleOverlay(overlayKey: MapOverlayKey) {
    setOverlayVisibility((currentVisibility) => ({
      ...currentVisibility,
      [overlayKey]: !currentVisibility[overlayKey],
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

  function disableAllCategories() {
    setCategoryVisibility((currentVisibility) => {
      const nextVisibility = { ...currentVisibility };

      for (const category of availableCategories) {
        nextVisibility[category] = false;
      }

      return nextVisibility;
    });
  }

  function disableAllOverlays() {
    setOverlayVisibility({
      hillshade: false,
      hikingTrails: false,
      protectedAreas: false,
      wetlands: false,
      hydrology: false,
      landcover: false,
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

  function focusMapSearchResult(result: MapSearchResult) {
    cameraRef.current?.setStop({
      center: [result.longitude, result.latitude],
      zoom: Math.max(mapZoom, 14),
      duration: 700,
    });
    setSelectedTarget({
      kind: result.kind,
      id: result.id,
    });
    setBottomSheetState("collapsed");
    setSelectedJourneyBoundsRequestKey(
      result.kind === "journey" ? `${result.kind}-${result.id}-${Date.now()}` : null,
    );
    setSearchQuery("");
    setActiveToolPanel(null);
  }

  function submitMapSearch() {
    const firstResult = mapSearchResults[0];

    if (!firstResult) {
      return;
    }

    focusMapSearchResult(firstResult);
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
    kind: MapScreenTarget["kind"],
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
    setSelectedJourneyBoundsRequestKey(
      kind === "journey" ? `${kind}-${pressedId}-${Date.now()}` : null,
    );
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
      showDiscoveryBanner({
        tone: "error",
        text: "Could not update active items right now.",
      });
    } finally {
      setActiveToggleTargetKey((currentKey) =>
        currentKey === targetKey ? null : currentKey,
      );
    }
  }

  async function handleClearActiveTripMapFilter() {
    const currentUserId = authUser?.id ?? "";

    if (!currentUserId) {
      return;
    }

    try {
      await clearActiveTripSelection(currentUserId);
      setActiveTripMapContext(null);
      markTripsUpdated();
    } catch {
      showDiscoveryBanner({
        tone: "error",
        text: "Could not clear the active trip map filter right now.",
      });
    }
  }

  return (
    <View style={styles.container}>
      <MapCanvas
        key={mapCanvasKey}
        cameraRef={cameraRef}
        contentRevision={contentRevision}
        journeyGeoJson={journeyGeoJson}
        locationGeoJson={locationGeoJson}
        locationPermissionGranted={locationPermissionGranted}
        onJourneySourcePress={handleJourneySourcePress}
        onLocationSourcePress={handleLocationSourcePress}
        onMapPress={handleMapPress}
        onMapReady={() => setIsMapReady(true)}
        onMapRegionChange={handleMapRegionChange}
        overlayVisibility={overlayVisibility}
        resolvedMapStyle={resolvedMapStyle}
        roadLabelLayerId={roadLabelLayerId}
      />
      <MapSearchOverlay
        visible={activeToolPanel === "search"}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        isDark={isDark}
        colors={chromeColors}
        results={mapSearchResults}
        onChangeSearchQuery={setSearchQuery}
        onSubmitSearch={submitMapSearch}
        onClose={closeSearchPanel}
        onClearSearch={clearSearchQuery}
        onSelectResult={focusMapSearchResult}
      />
      <MapLegendDialog
        visible={activeToolPanel === "legend"}
        isDark={isDark}
        onClose={() =>
          setActiveToolPanel((currentPanel) =>
            currentPanel === "legend" ? null : currentPanel,
          )
        }
      />

      {activeTripMapContext && activeToolPanel !== "search" ? (
        <View
          style={[
            styles.tripFilterCard,
            {
              top: Math.max(insets.top + 10, 16),
              left: 16,
              borderColor: chromeColors.toolPanelBorder,
              backgroundColor: chromeColors.toolPanelBackground,
            },
          ]}
        >
          <View style={styles.tripFilterHeader}>
            <Text
              style={[
                styles.tripFilterEyebrow,
                { color: chromeColors.toolPanelEyebrow },
              ]}
            >
              Active trip on map
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => void handleClearActiveTripMapFilter()}
              style={({ pressed }) => [
                styles.tripFilterClearButton,
                {
                  backgroundColor: chromeColors.panelActionPillBackground,
                },
                pressed && {
                  backgroundColor:
                    chromeColors.panelActionPillPressedBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.tripFilterClearButtonText,
                  { color: chromeColors.panelActionPillText },
                ]}
              >
                Clear
              </Text>
            </Pressable>
          </View>

          <Text
            numberOfLines={2}
            style={[styles.tripFilterTitle, { color: chromeColors.statusText }]}
          >
            {activeTripMapContext.tripName}
          </Text>
          <Text
            style={[
              styles.tripFilterHint,
              { color: chromeColors.toolPanelHint },
            ]}
          >
            Trip highlights active for{" "}
            {formatTripItemCount(activeTripMapContext.totalCount)}.
          </Text>
        </View>
      ) : null}

      {activeToolPanel !== "search" ? (
        <MapToolbar
          activeToolPanel={activeToolPanel}
          chromeColors={chromeColors}
          selectedMapStyle={selectedMapStyle}
          overlayVisibility={overlayVisibility}
          categoryVisibility={categoryVisibility}
          availableCategories={availableCategories}
          hasEnabledOverlays={hasEnabledOverlays}
          enabledOverlayCount={enabledOverlayCount}
          isCategoryFilterModified={isCategoryFilterModified}
          enabledCategoryCount={enabledCategoryCount}
          allCategoriesEnabled={allCategoriesEnabled}
          shouldShowCompass={shouldShowCompass}
          normalizedMapBearing={normalizedMapBearing}
          onCenterToUser={centerToUser}
          onToggleToolPanel={toggleToolPanel}
          onSelectMapStyle={(mapStyle) => {
            void persistDefaultMapStyle(mapStyle);
          }}
          onToggleOverlay={toggleOverlay}
          onDisableAllOverlays={disableAllOverlays}
          onToggleCategory={toggleCategory}
          onDisableAllCategories={disableAllCategories}
          onEnableAllCategories={enableAllCategories}
          onResetMapOrientation={resetMapOrientation}
        />
      ) : null}
      {isMapDataLoading || mapDataError ? (
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: chromeColors.statusCardBackground,
            },
            {
              paddingTop: 14,
              paddingRight: 16,
              paddingBottom: 14,
              paddingLeft: 16,
            },
          ]}
        >
          {isMapDataLoading ? (
            <Text
              style={[styles.statusText, { color: chromeColors.statusText }]}
            >
              Loading map data...
            </Text>
          ) : null}

          {mapDataError ? (
            <Text style={[styles.errorText, { color: chromeColors.errorText }]}>
              {mapDataError}
            </Text>
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
          <Text
            style={[
              styles.scaleLabel,
              {
                color: chromeColors.scaleLabel,
                textShadowColor: chromeColors.scaleLabelShadow,
              },
            ]}
          >
            {mapScale.label}
          </Text>
          <View
            style={[
              styles.scaleBar,
              {
                width: mapScale.widthPx,
                borderColor: chromeColors.scaleBar,
              },
            ]}
          />
        </View>
      ) : null}

      {discoveryBanner ? (
        <View
          style={[
            styles.discoveryBanner,
            {
              backgroundColor:
                discoveryBanner.tone === "success"
                  ? chromeColors.discoverySuccess
                  : discoveryBanner.tone === "warning"
                    ? chromeColors.discoveryWarning
                    : chromeColors.discoveryError,
            },
            {
              bottom:
                (bottomSheetState === "hidden" ? 24 : 132) +
                Math.max(insets.bottom, 8),
            },
          ]}
        >
          <Text
            style={[
              styles.discoveryBannerText,
              { color: chromeColors.discoveryText },
            ]}
          >
            {discoveryBanner.text}
          </Text>
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
