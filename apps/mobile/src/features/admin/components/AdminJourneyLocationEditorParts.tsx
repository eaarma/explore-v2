import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
  getRowVerticalOffset,
  normalizeJourneyLocationCounty,
} from "@/src/features/admin/utils/adminJourneyLocationEditorModel";
import {
  type AdminJourneyLocationEditorColors,
  type AdminJourneyLocationEditorStyles,
} from "@/src/features/admin/utils/adminJourneyLocationEditorTheme";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";

type AdminJourneyLocationEditorHeaderProps = {
  colors: AdminJourneyLocationEditorColors;
  isEditing: boolean;
  isSaving: boolean;
  isAddSearchOpen: boolean;
  styles: AdminJourneyLocationEditorStyles;
  onToggleAddSearch: () => void;
};

export function AdminJourneyLocationEditorHeader({
  colors,
  isEditing,
  isSaving,
  isAddSearchOpen,
  styles,
  onToggleAddSearch,
}: AdminJourneyLocationEditorHeaderProps) {
  return (
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
          onPress={onToggleAddSearch}
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
  );
}

type AdminJourneyLocationAddSearchProps = {
  availableLocationsError: string | null;
  colors: AdminJourneyLocationEditorColors;
  filteredAvailableLocations: Location[];
  isLoadingAvailableLocations: boolean;
  isSearchEmpty: boolean;
  isSearchIdle: boolean;
  searchQuery: string;
  styles: AdminJourneyLocationEditorStyles;
  onAddLocation: (location: Location) => void;
  onChangeSearchQuery: (value: string) => void;
  onRetry: () => void;
};

export function AdminJourneyLocationAddSearch({
  availableLocationsError,
  colors,
  filteredAvailableLocations,
  isLoadingAvailableLocations,
  isSearchEmpty,
  isSearchIdle,
  searchQuery,
  styles,
  onAddLocation,
  onChangeSearchQuery,
  onRetry,
}: AdminJourneyLocationAddSearchProps) {
  return (
    <View style={styles.searchCard}>
      <TextInput
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        placeholder="Search locations by ID or title"
        placeholderTextColor={colors.searchPlaceholder}
        style={styles.searchInput}
      />

      {isLoadingAvailableLocations ? (
        <Text style={styles.searchStateText}>Loading locations...</Text>
      ) : null}

      {!isLoadingAvailableLocations && availableLocationsError ? (
        <View style={styles.searchStateRow}>
          <Text style={styles.searchStateText}>{availableLocationsError}</Text>
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {isSearchIdle ? (
        <Text style={styles.searchStateText}>
          Start typing a location title or ID to add it to this journey.
        </Text>
      ) : null}

      {isSearchEmpty ? (
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
                  ID {location.id} |{" "}
                  {normalizeJourneyLocationCounty(location.county)} |{" "}
                  {normalizeCategory(location.category)}
                </Text>
              </View>

              <Pressable
                onPress={() => onAddLocation(location)}
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
  );
}

type AdminJourneyLocationListProps = {
  canDrag: boolean;
  colors: AdminJourneyLocationEditorColors;
  dragOffsetY: Animated.Value;
  draggingLocation: JourneyLocation | null;
  draggingLocationId: number | null;
  dragStartIndex: number | null;
  dragTargetIndex: number | null;
  isEditing: boolean;
  listHeight: number;
  orderedLocations: JourneyLocation[];
  styles: AdminJourneyLocationEditorStyles;
  onDragBegin: (locationId: number, index: number) => void;
  onDragEnd: () => void;
  onDragMove: (translationY: number) => void;
  onRemoveLocation: (locationId: number) => void;
};

export function AdminJourneyLocationList({
  canDrag,
  colors,
  dragOffsetY,
  draggingLocation,
  draggingLocationId,
  dragStartIndex,
  dragTargetIndex,
  isEditing,
  listHeight,
  orderedLocations,
  styles,
  onDragBegin,
  onDragEnd,
  onDragMove,
  onRemoveLocation,
}: AdminJourneyLocationListProps) {
  return (
    <View
      style={[
        styles.listCard,
        {
          height: listHeight,
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
                colors={colors}
                index={index}
                isEditing={isEditing}
                isHidden={isDragging}
                location={location}
                styles={styles}
                onDragBegin={onDragBegin}
                onDragEnd={onDragEnd}
                onDragMove={onDragMove}
                onRemoveLocation={onRemoveLocation}
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
              top: dragStartIndex * JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
              transform: [{ translateY: dragOffsetY }],
            },
          ]}
        >
          <JourneyLocationOverlayRow
            colors={colors}
            location={draggingLocation}
            styles={styles}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

type JourneyLocationRowProps = {
  canDrag: boolean;
  colors: AdminJourneyLocationEditorColors;
  index: number;
  isEditing: boolean;
  isHidden?: boolean;
  location: JourneyLocation;
  styles: AdminJourneyLocationEditorStyles;
  onDragBegin: (locationId: number, index: number) => void;
  onDragEnd: () => void;
  onDragMove: (translationY: number) => void;
  onRemoveLocation: (locationId: number) => void;
  verticalOffset?: number;
};

function JourneyLocationRow({
  canDrag,
  colors,
  index,
  isEditing,
  isHidden = false,
  location,
  styles,
  onDragBegin,
  onDragEnd,
  onDragMove,
  onRemoveLocation,
  verticalOffset = 0,
}: JourneyLocationRowProps) {
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
          ID {location.locationId} |{" "}
          {normalizeJourneyLocationCounty(location.county)} |{" "}
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
  colors,
  location,
  styles,
}: {
  colors: AdminJourneyLocationEditorColors;
  location: JourneyLocation;
  styles: AdminJourneyLocationEditorStyles;
}) {
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
          ID {location.locationId} |{" "}
          {normalizeJourneyLocationCounty(location.county)} |{" "}
          {normalizeCategory(location.category)}
        </Text>
      </View>

      <View style={styles.removeButtonGhost} />
    </View>
  );
}
