import { useRouter } from "expo-router";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  addJourneyToTrip,
  addLocationToTrip,
  clearActiveTripSelection,
  clearActiveItem,
  createTrip,
  markActiveItem,
  removeJourneyFromTrip,
  removeLocationFromTrip,
  reorderTripItems,
  setActiveTripSelection,
} from "@/src/features/discoveries/storage/discoveryCache";
import {
  buildTripItemPickerCandidates,
  formatCount,
  resolveActiveListItems,
} from "@/src/features/discoveries/components/activeItemsSection/activeItemsSectionData";
import type {
  ActiveListItem,
  TripSelectionTarget,
} from "@/src/features/discoveries/components/activeItemsSection/activeItemsSectionTypes";
import { useActiveItemsStore } from "@/src/features/discoveries/store/activeItemsStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { useTripsStore } from "@/src/features/trips/store/tripsStore";
import type {
  ResolvedTrip,
  ResolvedTripItem,
} from "@/src/features/trips/types/tripTypes";
import { getDefaultTripName } from "@/src/features/trips/utils/defaultTripName";
import {
  buildResolvedTrip,
  resolveTrips,
} from "@/src/features/trips/utils/resolveTrips";

export function useActiveItemsSectionState() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const activeItemsRevision = useActiveItemsStore((state) => state.revision);
  const tripsRevision = useTripsStore((state) => state.revision);
  const markActiveItemsUpdated = useActiveItemsStore((state) => state.markUpdated);
  const markTripsUpdated = useTripsStore((state) => state.markUpdated);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const [activeItems, setActiveItems] = useState<ActiveListItem[]>([]);
  const [trips, setTrips] = useState<ResolvedTrip[]>([]);
  const [isLoadingActiveTab, setIsLoadingActiveTab] = useState(true);
  const [activeTabError, setActiveTabError] = useState<string | null>(null);
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [activeToggleTargetKey, setActiveToggleTargetKey] = useState<string | null>(
    null,
  );
  const [tripSelectionTarget, setTripSelectionTarget] =
    useState<TripSelectionTarget | null>(null);
  const [tripItemPickerTripId, setTripItemPickerTripId] = useState<number | null>(
    null,
  );
  const [isCreateTripComposerVisible, setIsCreateTripComposerVisible] =
    useState(false);
  const [isTripMutationPending, setIsTripMutationPending] = useState(false);
  const [reorderingTripId, setReorderingTripId] = useState<number | null>(null);
  const [isTripDragActive, setIsTripDragActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveTabData() {
      setIsLoadingActiveTab(true);

      try {
        const [nextItems, nextTrips] = await Promise.all([
          resolveActiveListItems(user?.id),
          resolveTrips(user?.id),
        ]);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setActiveItems(nextItems);
          setTrips(nextTrips);
          setActiveTabError(null);
        });
      } catch {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setActiveTabError("Could not load active items and trips right now.");
        });
      } finally {
        if (isMounted) {
          setIsLoadingActiveTab(false);
        }
      }
    }

    void loadActiveTabData();

    return () => {
      isMounted = false;
    };
  }, [
    activeItemsRevision,
    contentRevision,
    progressRevision,
    tripsRevision,
    user?.id,
  ]);

  useEffect(() => {
    if (!expandedItemKey) {
      return;
    }

    const expandedItemStillExists = activeItems.some(
      (activeItem) => activeItem.key === expandedItemKey,
    );

    if (!expandedItemStillExists) {
      setExpandedItemKey(null);
    }
  }, [activeItems, expandedItemKey]);

  useEffect(() => {
    if (tripItemPickerTripId === null) {
      return;
    }

    const pickerTripStillExists = trips.some(
      (trip) => trip.id === tripItemPickerTripId,
    );

    if (!pickerTripStillExists) {
      setTripItemPickerTripId(null);
    }
  }, [tripItemPickerTripId, trips]);

  const activeSummaryLabel = useMemo(
    () => formatCount(activeItems.length, "active item"),
    [activeItems.length],
  );
  const tripSummaryLabel = useMemo(
    () => formatCount(trips.length, "trip"),
    [trips.length],
  );
  const suggestedTripName = useMemo(() => getDefaultTripName(trips), [trips]);
  const tripItemPickerTrip = useMemo(
    () => trips.find((trip) => trip.id === tripItemPickerTripId) ?? null,
    [tripItemPickerTripId, trips],
  );
  const tripItemPickerCandidates = useMemo(
    () => buildTripItemPickerCandidates(activeItems, tripItemPickerTrip),
    [activeItems, tripItemPickerTrip],
  );

  async function toggleActiveItem(item: ActiveListItem) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    setActiveToggleTargetKey(item.key);

    try {
      if (item.kind === "location") {
        const nextActive = item.location.active !== true;
        const nextActiveAt = nextActive ? new Date().toISOString() : null;

        if (nextActive) {
          await markActiveItem({
            userId: currentUserId,
            itemType: "LOCATION",
            itemId: item.location.id,
            createdAt: nextActiveAt ?? undefined,
          });
        } else {
          await clearActiveItem(currentUserId, "LOCATION", item.location.id);
        }

        setActiveItems((currentItems) =>
          nextActive
            ? currentItems.map((currentItem) =>
                currentItem.key === item.key && currentItem.kind === "location"
                  ? {
                      ...currentItem,
                      activeAt: nextActiveAt ?? currentItem.activeAt,
                      location: {
                        ...currentItem.location,
                        active: true,
                        activeAt: nextActiveAt,
                      },
                    }
                  : currentItem,
              )
            : currentItems.filter((currentItem) => currentItem.key !== item.key),
        );
      } else {
        const nextActive = item.journey.active !== true;
        const nextActiveAt = nextActive ? new Date().toISOString() : null;

        if (nextActive) {
          await markActiveItem({
            userId: currentUserId,
            itemType: "JOURNEY",
            itemId: item.journey.id,
            createdAt: nextActiveAt ?? undefined,
          });
        } else {
          await clearActiveItem(currentUserId, "JOURNEY", item.journey.id);
        }

        setActiveItems((currentItems) =>
          nextActive
            ? currentItems.map((currentItem) =>
                currentItem.key === item.key && currentItem.kind === "journey"
                  ? {
                      ...currentItem,
                      activeAt: nextActiveAt ?? currentItem.activeAt,
                      journey: {
                        ...currentItem.journey,
                        active: true,
                        activeAt: nextActiveAt,
                      },
                    }
                  : currentItem,
              )
            : currentItems.filter((currentItem) => currentItem.key !== item.key),
        );
      }

      markActiveItemsUpdated();
    } finally {
      setActiveToggleTargetKey((currentKey) =>
        currentKey === item.key ? null : currentKey,
      );
    }
  }

  async function handleCreateTrip(name: string) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    setIsTripMutationPending(true);

    try {
      await createTrip({
        userId: currentUserId,
        name,
      });
      setIsCreateTripComposerVisible(false);
      setActiveTabError(null);
      markTripsUpdated();
    } catch {
      setActiveTabError("Could not create a trip right now.");
    } finally {
      setIsTripMutationPending(false);
    }
  }

  function toggleExpandedItem(itemKey: string) {
    setExpandedItemKey((currentKey) =>
      currentKey === itemKey ? null : itemKey,
    );
  }

  function openTripSelection(item: ActiveListItem) {
    if (item.kind === "location") {
      setTripSelectionTarget({
        kind: "location",
        label: item.location.title,
        locationId: item.location.id,
      });
      return;
    }

    setTripSelectionTarget({
      kind: "journey",
      label: item.journey.title,
      journeyId: item.journey.id,
    });
  }

  async function addSelectedItemToTrip(tripId: number) {
    const currentUserId = user?.id ?? "";
    const target = tripSelectionTarget;

    if (!currentUserId || !target) {
      return;
    }

    if (target.kind === "location") {
      await addLocationToTrip({
        userId: currentUserId,
        tripId,
        locationId: target.locationId,
      });
      return;
    }

    await addJourneyToTrip({
      userId: currentUserId,
      tripId,
      journeyId: target.journeyId,
    });
  }

  async function handleSelectTrip(tripId: number) {
    setIsTripMutationPending(true);

    try {
      await addSelectedItemToTrip(tripId);
      setTripSelectionTarget(null);
      setActiveTabError(null);
      markTripsUpdated();
    } catch {
      setActiveTabError("Could not add this item to a trip right now.");
    } finally {
      setIsTripMutationPending(false);
    }
  }

  async function handleCreateTripFromSelection(name: string) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    setIsTripMutationPending(true);

    try {
      const trip = await createTrip({
        userId: currentUserId,
        name,
      });

      if (!trip) {
        throw new Error("Trip was not created.");
      }

      await addSelectedItemToTrip(trip.id);
      setTripSelectionTarget(null);
      setActiveTabError(null);
      markTripsUpdated();
    } catch {
      setActiveTabError("Could not create a trip for this item right now.");
    } finally {
      setIsTripMutationPending(false);
    }
  }

  async function handleReorderTripItems(
    tripId: number,
    reorderedItems: ResolvedTripItem[],
  ) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    const previousTrips = trips;

    setReorderingTripId(tripId);
    setTrips((currentTrips) =>
      currentTrips.map((trip) =>
        trip.id === tripId ? buildResolvedTrip(trip, reorderedItems) : trip,
      ),
    );

    try {
      await reorderTripItems({
        userId: currentUserId,
        tripId,
        itemOrder: reorderedItems.map((item) => ({
          kind: item.kind,
          relationId: item.relationId,
        })),
      });
      setActiveTabError(null);
    } catch {
      setTrips(previousTrips);
      setActiveTabError("Could not save the new trip order right now.");
    } finally {
      setReorderingTripId((currentTripId) =>
        currentTripId === tripId ? null : currentTripId,
      );
    }
  }

  async function handleShowTripOnMap(trip: ResolvedTrip) {
    const currentUserId = user?.id ?? "";

    if (!currentUserId || trip.totalCount === 0) {
      return;
    }

    try {
      await setActiveTripSelection({
        userId: currentUserId,
        tripId: trip.id,
      });
      markTripsUpdated();
      router.push("/(tabs)/map");
    } catch {
      setActiveTabError("Could not show this trip on the map right now.");
    }
  }

  async function handleClearTripMapHighlight() {
    const currentUserId = user?.id ?? "";

    if (!currentUserId) {
      return;
    }

    try {
      await clearActiveTripSelection(currentUserId);
      markTripsUpdated();
    } catch {
      setActiveTabError("Could not clear the active trip map view right now.");
    }
  }

  function openTripItemPicker(tripId: number) {
    setTripItemPickerTripId(tripId);
  }

  async function handleToggleTripItemPickerCandidate(item: {
    isInTrip: boolean;
    kind: "location" | "journey";
    journeyId?: number;
    locationId?: number;
  }) {
    const currentUserId = user?.id ?? "";
    const activeTrip = tripItemPickerTrip;

    if (!currentUserId || !activeTrip) {
      return;
    }

    setIsTripMutationPending(true);

    try {
      if (item.kind === "location" && typeof item.locationId === "number") {
        if (item.isInTrip) {
          await removeLocationFromTrip({
            userId: currentUserId,
            tripId: activeTrip.id,
            locationId: item.locationId,
          });
        } else {
          await addLocationToTrip({
            userId: currentUserId,
            tripId: activeTrip.id,
            locationId: item.locationId,
          });
        }
      } else if (typeof item.journeyId === "number") {
        if (item.isInTrip) {
          await removeJourneyFromTrip({
            userId: currentUserId,
            tripId: activeTrip.id,
            journeyId: item.journeyId,
          });
        } else {
          await addJourneyToTrip({
            userId: currentUserId,
            tripId: activeTrip.id,
            journeyId: item.journeyId,
          });
        }
      }

      const nextTrips = await resolveTrips(currentUserId);

      startTransition(() => {
        setTrips(nextTrips);
        setActiveTabError(null);
      });
      markTripsUpdated();
    } catch {
      setActiveTabError("Could not update this trip right now.");
    } finally {
      setIsTripMutationPending(false);
    }
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

  function viewLocationDetails(location: Location) {
    router.push({
      pathname: "/location/[locationId]",
      params: {
        locationId: String(location.id),
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

  function openCreateTripComposer() {
    setIsCreateTripComposerVisible(true);
  }

  function closeCreateTripComposer() {
    setIsCreateTripComposerVisible(false);
  }

  function closeTripSelection() {
    setTripSelectionTarget(null);
  }

  function closeTripItemPicker() {
    setTripItemPickerTripId(null);
  }

  return {
    activeItems,
    activeSummaryLabel,
    activeTabError,
    activeToggleTargetKey,
    closeCreateTripComposer,
    closeTripItemPicker,
    closeTripSelection,
    expandedItemKey,
    handleClearTripMapHighlight,
    handleCreateTrip,
    handleCreateTripFromSelection,
    handleReorderTripItems,
    handleSelectTrip,
    handleShowTripOnMap,
    handleToggleTripItemPickerCandidate,
    isCreateTripComposerVisible,
    isLoadingActiveTab,
    isTripDragActive,
    isTripMutationPending,
    openCreateTripComposer,
    openTripItemPicker,
    openTripSelection,
    reorderingTripId,
    setIsTripDragActive,
    showJourneyOnMap,
    showLocationOnMap,
    suggestedTripName,
    toggleActiveItem,
    toggleExpandedItem,
    tripItemPickerCandidates,
    tripItemPickerTrip,
    tripSelectionTarget,
    tripSummaryLabel,
    trips,
    viewJourneyDetails,
    viewLocationDetails,
  };
}
