import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";
import {
  ACTIVE_STATE_ACCENT,
  getActiveStateColors,
} from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

const ROW_HEIGHT = 68;
const SEARCH_RESULT_LIMIT = 6;

type AdminJourneyLocationEditorProps = {
  availableLocations: Location[];
  availableLocationsError: string | null;
  isEditing: boolean;
  isLoadingAvailableLocations: boolean;
  isSaving: boolean;
  journeyId: number;
  locations: JourneyLocation[];
  onLocationsChange: (locations: JourneyLocation[]) => void;
  onRequestAvailableLocations: () => void;
};

export function AdminJourneyLocationEditor({
  availableLocations,
  availableLocationsError,
  isEditing,
  isLoadingAvailableLocations,
  isSaving,
  journeyId,
  locations,
  onLocationsChange,
  onRequestAvailableLocations,
}: AdminJourneyLocationEditorProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getEditorColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const [orderedLocations, setOrderedLocations] = useState(locations);
  const orderedLocationsRef = useRef(locations);
  const [draggingLocationId, setDraggingLocationId] = useState<number | null>(
    null,
  );
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);
  const dragInitialIndexRef = useRef(0);
  const dragCurrentIndexRef = useRef(0);
  const [isAddSearchOpen, setIsAddSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    orderedLocationsRef.current = orderedLocations;
  }, [orderedLocations]);

  useEffect(() => {
    if (draggingLocationId !== null) {
      return;
    }

    setOrderedLocations(locations);
    orderedLocationsRef.current = locations;
  }, [draggingLocationId, locations]);

  useEffect(() => {
    if (isEditing || !isAddSearchOpen) {
      return;
    }

    setIsAddSearchOpen(false);
    setSearchQuery("");
  }, [isAddSearchOpen, isEditing]);

  const draggingLocation =
    draggingLocationId === null
      ? null
      : orderedLocations.find(
          (location) => location.locationId === draggingLocationId,
        ) ?? null;
  const canDrag =
    isEditing && !isSaving && orderedLocations.length > 1;
  const locationIdsInJourney = useMemo(
    () => new Set(orderedLocations.map((location) => location.locationId)),
    [orderedLocations],
  );
  const filteredAvailableLocations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return availableLocations
      .filter((location) => !locationIdsInJourney.has(location.id))
      .filter((location) => {
        const title = location.title.trim().toLowerCase();
        return (
          title.includes(normalizedQuery) ||
          String(location.id).includes(normalizedQuery)
        );
      })
      .sort((left, right) => left.title.localeCompare(right.title))
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [availableLocations, locationIdsInJourney, searchQuery]);

  const beginDrag = useCallback(
    (locationId: number, index: number) => {
      if (!canDrag) {
        return;
      }

      dragOffsetY.stopAnimation();
      dragOffsetY.setValue(0);
      dragInitialIndexRef.current = index;
      dragCurrentIndexRef.current = index;
      dragStartIndexRef.current = index;
      setDraggingLocationId(locationId);
      setDragStartIndex(index);
      setDragTargetIndex(index);
    },
    [canDrag, dragOffsetY],
  );

  const updateDrag = useCallback(
    (translationY: number) => {
      if (dragStartIndexRef.current === null) {
        return;
      }

      const minimumTranslationY = -dragInitialIndexRef.current * ROW_HEIGHT;
      const maximumTranslationY =
        (orderedLocationsRef.current.length - 1 - dragInitialIndexRef.current) *
        ROW_HEIGHT;
      const clampedTranslationY = clamp(
        translationY,
        minimumTranslationY,
        maximumTranslationY,
      );

      dragOffsetY.setValue(clampedTranslationY);

      const targetIndex = clamp(
        Math.round(
          (dragInitialIndexRef.current * ROW_HEIGHT + clampedTranslationY) /
            ROW_HEIGHT,
        ),
        0,
        orderedLocationsRef.current.length - 1,
      );

      if (targetIndex === dragCurrentIndexRef.current) {
        return;
      }

      dragCurrentIndexRef.current = targetIndex;
      setDragTargetIndex(targetIndex);
    },
    [dragOffsetY],
  );

  const endDrag = useCallback(() => {
    if (dragStartIndexRef.current === null) {
      return;
    }

    const moved = dragCurrentIndexRef.current !== dragInitialIndexRef.current;

    if (moved) {
      const nextLocations = normalizeJourneyLocationSortOrder(
        moveItem(
          orderedLocationsRef.current,
          dragInitialIndexRef.current,
          dragCurrentIndexRef.current,
        ),
      );
      orderedLocationsRef.current = nextLocations;
      setOrderedLocations(nextLocations);
      onLocationsChange(nextLocations);
    }

    dragStartIndexRef.current = null;
    setDraggingLocationId(null);
    setDragStartIndex(null);
    setDragTargetIndex(null);

    requestAnimationFrame(() => {
      dragOffsetY.setValue(0);
    });
  }, [dragOffsetY, onLocationsChange]);

  function toggleAddSearch() {
    if (!isEditing || isSaving) {
      return;
    }

    const nextOpen = !isAddSearchOpen;
    setIsAddSearchOpen(nextOpen);
    setSearchQuery("");

    if (nextOpen && availableLocations.length === 0 && !isLoadingAvailableLocations) {
      onRequestAvailableLocations();
    }
  }

  function addLocation(location: Location) {
    const nextLocations = normalizeJourneyLocationSortOrder([
      ...orderedLocations,
      createJourneyLocationFromLocation(location, journeyId, orderedLocations.length),
    ]);

    setOrderedLocations(nextLocations);
    orderedLocationsRef.current = nextLocations;
    onLocationsChange(nextLocations);
    setSearchQuery("");
    setIsAddSearchOpen(false);
  }

  function removeLocation(locationId: number) {
    const nextLocations = normalizeJourneyLocationSortOrder(
      orderedLocations.filter((location) => location.locationId !== locationId),
    );

    setOrderedLocations(nextLocations);
    orderedLocationsRef.current = nextLocations;
    onLocationsChange(nextLocations);
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.label}>Route locations</Text>
          <Text style={styles.hint}>
            {isEditing
              ? "Drag to reorder, remove stops, or add a new location to the route."
              : "Journey stops in their current route order."}
          </Text>
        </View>

        {isEditing ? (
          <Pressable
            onPress={toggleAddSearch}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
              isSaving && styles.addButtonDisabled,
            ]}
          >
            <Ionicons
              color={colors.addButtonText}
              name={isAddSearchOpen ? "close" : "add"}
              size={16}
            />
            <Text style={styles.addButtonText}>
              {isAddSearchOpen ? "Close" : "Add"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isEditing && isAddSearchOpen ? (
        <View style={styles.searchCard}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search locations by ID or title"
            placeholderTextColor={colors.searchPlaceholder}
            style={styles.searchInput}
          />

          {isLoadingAvailableLocations ? (
            <Text style={styles.searchStateText}>Loading locations…</Text>
          ) : null}

          {!isLoadingAvailableLocations && availableLocationsError ? (
            <View style={styles.searchStateRow}>
              <Text style={styles.searchStateText}>{availableLocationsError}</Text>
              <Pressable onPress={onRequestAvailableLocations} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoadingAvailableLocations &&
          !availableLocationsError &&
          searchQuery.trim().length === 0 ? (
            <Text style={styles.searchStateText}>
              Start typing a location title or ID to add it to this journey.
            </Text>
          ) : null}

          {!isLoadingAvailableLocations &&
          !availableLocationsError &&
          searchQuery.trim().length > 0 &&
          filteredAvailableLocations.length === 0 ? (
            <Text style={styles.searchStateText}>
              No matching locations were found.
            </Text>
          ) : null}

          {filteredAvailableLocations.length > 0 ? (
            <View style={styles.searchResults}>
              {filteredAvailableLocations.map((location) => (
                <View key={location.id} style={styles.searchResultRow}>
                  <View style={styles.searchResultCopy}>
                    <Text numberOfLines={1} style={styles.searchResultTitle}>
                      {location.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.searchResultMeta}>
                      ID {location.id} | {normalizeCounty(location.county)} |{" "}
                      {normalizeCategory(location.category)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => addLocation(location)}
                    style={({ pressed }) => [
                      styles.searchResultAction,
                      pressed && styles.searchResultActionPressed,
                    ]}
                  >
                    <Text style={styles.searchResultActionText}>Add</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.listCard,
          {
            height: Math.max(orderedLocations.length * ROW_HEIGHT, ROW_HEIGHT),
          },
        ]}
      >
        {orderedLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No locations are attached to this journey yet.
            </Text>
          </View>
        ) : (
          orderedLocations.map((location, index) => {
            const isDragging = location.locationId === draggingLocationId;

            return (
              <View
                key={location.locationId}
                style={[
                  styles.rowSlot,
                  isDragging && styles.rowSlotPlaceholder,
                ]}
              >
                <JourneyLocationRow
                  canDrag={canDrag}
                  index={index}
                  isEditing={isEditing}
                  isHidden={isDragging}
                  location={location}
                  onDragBegin={beginDrag}
                  onDragEnd={endDrag}
                  onDragMove={updateDrag}
                  onRemoveLocation={removeLocation}
                  verticalOffset={getRowVerticalOffset({
                    dragSourceIndex: dragStartIndex,
                    dragTargetIndex,
                    index,
                    isDragging,
                  })}
                />
              </View>
            );
          })
        )}

        {draggingLocation && dragStartIndex !== null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dragOverlay,
              {
                top: dragStartIndex * ROW_HEIGHT,
                transform: [{ translateY: dragOffsetY }],
              },
            ]}
          >
            <JourneyLocationOverlayRow location={draggingLocation} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

type JourneyLocationRowProps = {
  canDrag: boolean;
  index: number;
  isEditing: boolean;
  isHidden?: boolean;
  location: JourneyLocation;
  onDragBegin: (locationId: number, index: number) => void;
  onDragEnd: () => void;
  onDragMove: (translationY: number) => void;
  onRemoveLocation: (locationId: number) => void;
  verticalOffset?: number;
};

function JourneyLocationRow({
  canDrag,
  index,
  isEditing,
  isHidden = false,
  location,
  onDragBegin,
  onDragEnd,
  onDragMove,
  onRemoveLocation,
  verticalOffset = 0,
}: JourneyLocationRowProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getEditorColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categoryLabel = normalizeCategory(location.category);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => canDrag,
        onStartShouldSetPanResponder: () => canDrag,
        onMoveShouldSetPanResponderCapture: () => canDrag,
        onMoveShouldSetPanResponder: () => canDrag,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          onDragBegin(location.locationId, index);
        },
        onPanResponderMove: (_, gestureState) => {
          onDragMove(gestureState.dy);
        },
        onPanResponderRelease: () => {
          onDragEnd();
        },
        onPanResponderTerminate: () => {
          onDragEnd();
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [canDrag, index, location.locationId, onDragBegin, onDragEnd, onDragMove],
  );

  return (
    <View
      style={[
        styles.row,
        isHidden && styles.rowHidden,
        verticalOffset !== 0 && {
          transform: [{ translateY: verticalOffset }],
        },
      ]}
    >
      {isEditing ? (
        <View
          accessibilityLabel={
            canDrag ? `Drag to reorder ${location.title}` : "Reorder disabled"
          }
          accessibilityRole="button"
          style={[
            styles.handle,
            !canDrag && styles.handleDisabled,
          ]}
          {...panResponder.panHandlers}
        >
          <Ionicons
            color={canDrag ? colors.handleIcon : colors.handleIconDisabled}
            name="reorder-three-outline"
            size={20}
          />
        </View>
      ) : null}

      <View style={styles.indexBadge}>
        <Text style={styles.indexBadgeText}>{index + 1}</Text>
      </View>

      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {location.title}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          ID {location.locationId} | {normalizeCounty(location.county)} |{" "}
          {categoryLabel}
        </Text>
      </View>

      {isEditing ? (
        <Pressable
          accessibilityLabel={`Remove ${location.title} from journey`}
          onPress={() => onRemoveLocation(location.locationId)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
        >
          <Ionicons color={colors.removeIcon} name="close" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

function JourneyLocationOverlayRow({
  location,
}: {
  location: JourneyLocation;
}) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getEditorColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, styles.rowDragging]}>
      <View style={styles.handle}>
        <Ionicons
          color={colors.handleIcon}
          name="reorder-three-outline"
          size={20}
        />
      </View>

      <View style={styles.indexBadge}>
        <Text style={styles.indexBadgeText}>#</Text>
      </View>

      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {location.title}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          ID {location.locationId} | {normalizeCounty(location.county)} |{" "}
          {normalizeCategory(location.category)}
        </Text>
      </View>

      <View style={styles.removeButtonGhost} />
    </View>
  );
}

function createJourneyLocationFromLocation(
  location: Location,
  journeyId: number,
  sortOrder: number,
): JourneyLocation {
  return {
    id: -location.id,
    journeyId,
    locationId: location.id,
    title: location.title,
    description: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    county: location.county,
    category: location.category,
    imageUrl: location.imageUrl,
    experience: location.experience,
    difficulty: location.difficulty,
    notes: location.notes,
    status: location.status,
    sortOrder,
  };
}

function normalizeJourneyLocationSortOrder(locations: JourneyLocation[]) {
  return locations.map((location, index) => ({
    ...location,
    sortOrder: index,
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRowVerticalOffset({
  dragSourceIndex,
  dragTargetIndex,
  index,
  isDragging,
}: {
  dragSourceIndex: number | null;
  dragTargetIndex: number | null;
  index: number;
  isDragging: boolean;
}) {
  if (
    isDragging ||
    dragSourceIndex === null ||
    dragTargetIndex === null ||
    dragSourceIndex === dragTargetIndex
  ) {
    return 0;
  }

  if (
    dragTargetIndex > dragSourceIndex &&
    index > dragSourceIndex &&
    index <= dragTargetIndex
  ) {
    return -ROW_HEIGHT;
  }

  if (
    dragTargetIndex < dragSourceIndex &&
    index >= dragTargetIndex &&
    index < dragSourceIndex
  ) {
    return ROW_HEIGHT;
  }

  return 0;
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

type EditorColors = ReturnType<typeof getEditorColors>;

function getEditorColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      border: "#1E293B",
      card: "#111827",
      surface: "#0F172A",
      elevated: "#111827",
      accent: ACTIVE_STATE_ACCENT,
      accentSoft: activeStateColors.softBackground,
      title: "#F8FAFC",
      body: "#CBD5E1",
      muted: "#94A3B8",
      inputBackground: "#020617",
      inputBorder: "#334155",
      searchPlaceholder: "#94A3B8",
      addButtonBackground: "#111827",
      addButtonBorder: "#334155",
      addButtonText: "#E2E8F0",
      retryButtonBackground: "#111827",
      retryButtonBorder: "#334155",
      retryButtonText: "#E2E8F0",
      indexBadgeBackground: activeStateColors.softBackground,
      indexBadgeText: ACTIVE_STATE_ACCENT,
      removeBackground: "#1E293B",
      removeIcon: "#CBD5E1",
      handleIcon: "#CBD5E1",
      handleIconDisabled: "#64748B",
      divider: "#1E293B",
      dragShadow: "#020617",
    };
  }

  return {
    border: "#E2E8F0",
    card: "#FFFFFF",
    surface: "#FEFCF8",
    elevated: "#FFFFFF",
    accent: ACTIVE_STATE_ACCENT,
    accentSoft: activeStateColors.softBackground,
    title: "#0F172A",
    body: "#475569",
    muted: "#64748B",
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    searchPlaceholder: "#94A3B8",
    addButtonBackground: "#FFFFFF",
    addButtonBorder: "#CBD5E1",
    addButtonText: "#334155",
    retryButtonBackground: "#FFFFFF",
    retryButtonBorder: "#CBD5E1",
    retryButtonText: "#334155",
    indexBadgeBackground: activeStateColors.softBackground,
    indexBadgeText: ACTIVE_STATE_ACCENT,
    removeBackground: "#F8FAFC",
    removeIcon: "#475569",
    handleIcon: "#64748B",
    handleIconDisabled: "#94A3B8",
    divider: "#E2E8F0",
    dragShadow: "#0F172A",
  };
}

function createStyles(colors: EditorColors) {
  return StyleSheet.create({
    root: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    label: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.addButtonBorder,
      backgroundColor: colors.addButtonBackground,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    addButtonPressed: {
      opacity: 0.82,
    },
    addButtonDisabled: {
      opacity: 0.58,
    },
    addButtonText: {
      color: colors.addButtonText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    searchCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    },
    searchInput: {
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      color: colors.title,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchStateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    searchStateText: {
      flex: 1,
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    retryButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.retryButtonBorder,
      backgroundColor: colors.retryButtonBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    retryButtonText: {
      color: colors.retryButtonText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    searchResults: {
      gap: 8,
    },
    searchResultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchResultCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    searchResultTitle: {
      color: colors.title,
      fontSize: 14,
      fontWeight: "700",
    },
    searchResultMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    searchResultAction: {
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchResultActionPressed: {
      opacity: 0.84,
    },
    searchResultActionText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    listCard: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowSlot: {
      height: ROW_HEIGHT,
      justifyContent: "center",
    },
    rowSlotPlaceholder: {
      opacity: 0.18,
    },
    dragOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 2,
    },
    row: {
      flex: 1,
      height: ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
    },
    rowDragging: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevated,
      shadowColor: colors.dragShadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 8,
    },
    rowHidden: {
      opacity: 0,
    },
    handle: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    handleDisabled: {
      opacity: 0.55,
    },
    indexBadge: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.indexBadgeBackground,
    },
    indexBadgeText: {
      color: colors.indexBadgeText,
      fontSize: 12,
      fontWeight: "700",
    },
    rowCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.title,
      fontSize: 15,
      fontWeight: "700",
    },
    rowMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.removeBackground,
    },
    removeButtonPressed: {
      opacity: 0.82,
    },
    removeButtonGhost: {
      width: 28,
      height: 28,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    emptyStateText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
