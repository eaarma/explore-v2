import { Animated } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
  JOURNEY_LOCATION_SEARCH_RESULT_LIMIT,
  clamp,
  createJourneyLocationFromLocation,
  moveItem,
  normalizeJourneyLocationSortOrder,
} from "@/src/features/admin/utils/adminJourneyLocationEditorModel";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Location } from "@/src/features/locations/types/locationTypes";

type UseAdminJourneyLocationEditorParams = {
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

export function useAdminJourneyLocationEditor({
  availableLocations,
  availableLocationsError,
  isEditing,
  isLoadingAvailableLocations,
  isSaving,
  journeyId,
  locations,
  onLocationsChange,
  onRequestAvailableLocations,
}: UseAdminJourneyLocationEditorParams) {
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
      .slice(0, JOURNEY_LOCATION_SEARCH_RESULT_LIMIT);
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

      const minimumTranslationY =
        -dragInitialIndexRef.current * JOURNEY_LOCATION_EDITOR_ROW_HEIGHT;
      const maximumTranslationY =
        (orderedLocationsRef.current.length - 1 - dragInitialIndexRef.current) *
        JOURNEY_LOCATION_EDITOR_ROW_HEIGHT;
      const clampedTranslationY = clamp(
        translationY,
        minimumTranslationY,
        maximumTranslationY,
      );

      dragOffsetY.setValue(clampedTranslationY);

      const targetIndex = clamp(
        Math.round(
          (dragInitialIndexRef.current * JOURNEY_LOCATION_EDITOR_ROW_HEIGHT +
            clampedTranslationY) /
            JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
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

    if (
      nextOpen &&
      availableLocations.length === 0 &&
      !isLoadingAvailableLocations
    ) {
      onRequestAvailableLocations();
    }
  }

  function addLocation(location: Location) {
    const nextLocations = normalizeJourneyLocationSortOrder([
      ...orderedLocations,
      createJourneyLocationFromLocation(
        location,
        journeyId,
        orderedLocations.length,
      ),
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

  const derived = {
    draggingLocation,
    canDrag,
    filteredAvailableLocations,
    isSearchIdle:
      !isLoadingAvailableLocations &&
      !availableLocationsError &&
      searchQuery.trim().length === 0,
    isSearchEmpty:
      !isLoadingAvailableLocations &&
      !availableLocationsError &&
      searchQuery.trim().length > 0 &&
      filteredAvailableLocations.length === 0,
    listHeight: Math.max(
      orderedLocations.length * JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
      JOURNEY_LOCATION_EDITOR_ROW_HEIGHT,
    ),
  };

  const data = {
    orderedLocations,
    draggingLocationId,
    dragStartIndex,
    dragTargetIndex,
    dragOffsetY,
    searchQuery,
  };

  const ui = {
    isAddSearchOpen,
  };

  const actions = {
    setSearchQuery,
    beginDrag,
    updateDrag,
    endDrag,
    toggleAddSearch,
    addLocation,
    removeLocation,
    retryAvailableLocations: onRequestAvailableLocations,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
