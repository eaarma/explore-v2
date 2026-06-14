import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import {
  replaceAdminJourneyLocations,
  updateAdminJourney,
} from "@/src/features/admin/api/adminJourneysApi";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import { hydrateJourneyWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getJourneyCompletionStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  getActiveJourneys,
  getJourneyById,
  getJourneyDetail,
  getJourneyLocations,
} from "@/src/features/journeys/api/journeysApi";
import { normalizeCategory } from "@/src/features/journeys/components/journeysSectionShared";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Journey } from "@/src/features/journeys/types/journeyTypes";
import { getAllLocations } from "@/src/features/locations/api/locationsApi";
import { type Location } from "@/src/features/locations/types/locationTypes";
import {
  buildCoordinateSummary,
  buildJourneyUpdatePayload,
  compareJourneyLocations,
  createJourneyEditDraft,
  getPublicationStatusLabel,
  mergeJourneyForAdminView,
  normalizeJourneyLocationSortOrder,
  parseDraftCoordinates,
  parseJourneyId,
  reconcileCachedJourneyLocationsAfterAdminSave,
  reconcileCachedJourneysAfterAdminSave,
  type CoordinateSelection,
  type JourneyEditDraft,
} from "@/src/features/admin/utils/adminJourneyDetailsModel";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";
import {
  cacheActiveContent,
  cacheJourneyLocations,
  getCachedJourneyById,
  getCachedJourneyLocations,
  getCachedJourneyLocationsByJourneyId,
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function useAdminJourneyDetailsScreen() {
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const { journeyId } = useLocalSearchParams<{
    journeyId?: string | string[];
  }>();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [draft, setDraft] = useState<JourneyEditDraft | null>(null);
  const [routeDraftLocations, setRouteDraftLocations] = useState<
    JourneyLocation[] | null
  >(null);
  const [journeyLocations, setJourneyLocations] = useState<JourneyLocation[]>(
    [],
  );
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoadingAvailableLocations, setIsLoadingAvailableLocations] =
    useState(false);
  const [availableLocationsError, setAvailableLocationsError] = useState<
    string | null
  >(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJourney() {
      setIsLoadingJourney(true);
      setJourneyError(null);

      const resolvedJourneyId = parseJourneyId(journeyId);

      if (resolvedJourneyId === null) {
        if (isMounted) {
          setJourney(null);
          setJourneyLocations([]);
          setJourneyError("Journey not found.");
          setIsLoadingJourney(false);
        }

        return;
      }

      try {
        let nextJourney: Journey | null = null;
        let nextJourneyLocations: JourneyLocation[] = [];

        try {
          await initializeContentCache();
          nextJourney = await getCachedJourneyById(resolvedJourneyId);
          nextJourney = await hydrateJourneyWithProgress(user?.id, nextJourney);
          nextJourneyLocations =
            await getCachedJourneyLocationsByJourneyId(resolvedJourneyId);
        } catch {
          // Continue with bootstrap and network fallbacks.
        }

        if (nextJourney && isMounted) {
          setJourney(nextJourney);
          setJourneyLocations(nextJourneyLocations);
          setIsLoadingJourney(false);
        }

        if (!nextJourney) {
          try {
            const { didBootstrap } = await bootstrapContentCacheIfNeeded();

            if (didBootstrap) {
              nextJourney = await getCachedJourneyById(resolvedJourneyId);
              nextJourney = await hydrateJourneyWithProgress(
                user?.id,
                nextJourney,
              );
            }
          } catch {
            // Cache bootstrap should not block details rendering.
          }
        }

        if (nextJourneyLocations.length === 0) {
          try {
            const { didBootstrap } =
              await bootstrapJourneyLocationsCacheIfNeeded();

            if (didBootstrap || nextJourney) {
              nextJourneyLocations =
                await getCachedJourneyLocationsByJourneyId(resolvedJourneyId);
            }
          } catch {
            // Cache bootstrap should not block details rendering.
          }
        }

        if (!nextJourney || nextJourneyLocations.length === 0) {
          try {
            const journeyDetail = await getJourneyDetail(resolvedJourneyId);
            nextJourney = await hydrateJourneyWithProgress(
              user?.id,
              journeyDetail,
            );
            nextJourneyLocations = journeyDetail.locations;
          } catch {
            if (!nextJourney) {
              try {
                nextJourney = await getJourneyById(resolvedJourneyId);
                nextJourney = await hydrateJourneyWithProgress(
                  user?.id,
                  nextJourney,
                );
              } catch {
                const activeJourneys = await getActiveJourneys();
                nextJourney =
                  activeJourneys.find(
                    (activeJourney) => activeJourney.id === resolvedJourneyId,
                  ) ?? null;
                nextJourney = await hydrateJourneyWithProgress(
                  user?.id,
                  nextJourney,
                );
              }
            }

            if (nextJourneyLocations.length === 0) {
              try {
                nextJourneyLocations =
                  await getJourneyLocations(resolvedJourneyId);
              } catch {
                nextJourneyLocations = [];
              }
            }
          }
        }

        if (!nextJourney) {
          throw new Error("Journey not found");
        }

        if (!isMounted) {
          return;
        }

        setJourney(nextJourney);
        setJourneyLocations(nextJourneyLocations);
        setJourneyError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setJourney(null);
        setJourneyLocations([]);
        setJourneyError("Could not load this admin journey right now.");
      } finally {
        if (isMounted) {
          setIsLoadingJourney(false);
        }
      }
    }

    void loadJourney();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, journeyId, progressRevision, user?.id]);

  useEffect(() => {
    if (!journey) {
      setDraft(null);
      setRouteDraftLocations(null);
      setIsEditing(false);
      return;
    }

    setDraft(createJourneyEditDraft(journey));
    setRouteDraftLocations(null);
    setIsEditing(false);
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsMapPickerOpen(false);
  }, [journey]);

  const orderedJourneyLocations = useMemo(
    () => [...journeyLocations].sort(compareJourneyLocations),
    [journeyLocations],
  );
  const editableRouteLocations = useMemo(
    () =>
      normalizeJourneyLocationSortOrder(
        routeDraftLocations
          ? [...routeDraftLocations].sort(compareJourneyLocations)
          : [...orderedJourneyLocations],
      ),
    [orderedJourneyLocations, routeDraftLocations],
  );
  const editableValues = journey
    ? (draft ?? createJourneyEditDraft(journey))
    : null;
  const screenTitle = editableValues?.title || journey?.title || "Journey";
  const categoryLabel = editableValues
    ? normalizeCategory(editableValues.category)
    : journey
      ? normalizeCategory(journey.category)
      : "";
  const displayedJourneyLocations = isEditing
    ? editableRouteLocations
    : orderedJourneyLocations;
  const previewImageUrl = useMemo(
    () =>
      displayedJourneyLocations.find(
        (journeyLocation) => journeyLocation.imageUrl,
      )?.imageUrl ?? null,
    [displayedJourneyLocations],
  );
  const publicationStatusLabel = editableValues
    ? getPublicationStatusLabel(Number(editableValues.status))
    : journey
      ? getPublicationStatusLabel(journey.status)
      : "Unknown";
  const completionLabel = journey
    ? getJourneyCompletionStatusLabel(journey)
    : "Journey";

  function updateDraft<Field extends keyof JourneyEditDraft>(
    field: Field,
    value: JourneyEditDraft[Field],
  ) {
    setDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            [field]: value,
          }
        : currentDraft,
    );
    setFormError(null);
  }

  function handleEditPress() {
    if (isSaving) {
      return;
    }

    if (isEditing) {
      setDraft(journey ? createJourneyEditDraft(journey) : null);
      setRouteDraftLocations(null);
      setIsEditing(false);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setIsMapPickerOpen(false);
      setFormError(null);
      return;
    }

    if (journey) {
      setDraft(createJourneyEditDraft(journey));
      setRouteDraftLocations(orderedJourneyLocations);
      setIsEditing(true);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setIsMapPickerOpen(false);
      setFormError(null);
    }
  }

  function toggleCategoryMenu() {
    setIsCategoryMenuOpen((currentValue) => !currentValue);
    setIsStatusMenuOpen(false);
  }

  function selectCategory(value: string) {
    updateDraft("category", value);
    setIsCategoryMenuOpen(false);
  }

  function toggleStatusMenu() {
    setIsStatusMenuOpen((currentValue) => !currentValue);
    setIsCategoryMenuOpen(false);
  }

  function selectStatus(value: string) {
    updateDraft("status", value);
    setIsStatusMenuOpen(false);
  }

  function openMapPicker() {
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsMapPickerOpen(true);
  }

  function closeMapPicker() {
    setIsMapPickerOpen(false);
  }

  function handleConfirmCoordinates(coordinates: CoordinateSelection) {
    updateDraft("latitude", coordinates.latitude.toFixed(6));
    updateDraft("longitude", coordinates.longitude.toFixed(6));
    setIsMapPickerOpen(false);
  }

  async function loadAvailableLocations() {
    if (isLoadingAvailableLocations) {
      return;
    }

    setIsLoadingAvailableLocations(true);
    setAvailableLocationsError(null);

    try {
      const locations = await getAllLocations();
      setAvailableLocations(
        [...locations].sort((left, right) =>
          left.title.localeCompare(right.title),
        ),
      );
    } catch (error) {
      setAvailableLocationsError(
        getApiErrorMessage(
          error,
          "Could not load locations for journey editing right now.",
        ),
      );
    } finally {
      setIsLoadingAvailableLocations(false);
    }
  }

  async function handleSavePress() {
    if (!journey || !draft) {
      return;
    }

    const payload = buildJourneyUpdatePayload(draft);
    const nextRouteLocations = normalizeJourneyLocationSortOrder(
      routeDraftLocations ?? orderedJourneyLocations,
    );

    if (!payload.success) {
      setFormError(payload.message);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const savedJourney = await updateAdminJourney(journey.id, payload.value);
      const nextJourney = mergeJourneyForAdminView(journey, savedJourney);

      try {
        await replaceAdminJourneyLocations(
          journey.id,
          nextRouteLocations.map((journeyLocation) => ({
            locationId: journeyLocation.locationId,
            sortOrder: journeyLocation.sortOrder,
          })),
        );
      } catch (error) {
        showAppToast({
          text: getApiErrorMessage(
            error,
            "Journey details were saved, but route location changes could not be saved.",
          ),
          tone: "warning",
        });
        return;
      }

      setJourney(nextJourney);
      setJourneyLocations(nextRouteLocations);
      setDraft(createJourneyEditDraft(nextJourney));
      setRouteDraftLocations(null);
      setIsEditing(false);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setIsMapPickerOpen(false);
      setJourneyError(null);

      try {
        const [cachedLocations, cachedJourneys, cachedJourneyLocations] =
          await Promise.all([
            getCachedLocations(),
            getCachedJourneys(),
            getCachedJourneyLocations(),
          ]);

        const nextCachedJourneys = reconcileCachedJourneysAfterAdminSave(
          cachedJourneys,
          nextJourney,
        );
        const nextCachedJourneyLocations =
          reconcileCachedJourneyLocationsAfterAdminSave(
            cachedJourneyLocations,
            nextJourney,
            nextRouteLocations,
          );

        await Promise.all([
          cacheActiveContent({
            locations: cachedLocations,
            journeys: nextCachedJourneys,
          }),
          cacheJourneyLocations(nextCachedJourneyLocations),
        ]);
        markContentUpdated();
      } catch {
        // Keep the saved server state even if local cache refresh fails.
      }

      showAppToast({
        text: "The journey changes were saved.",
        tone: "success",
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not save the journey changes right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const data = {
    journey,
    journeyLocations,
    displayedJourneyLocations,
    availableLocations,
    editableValues,
  };

  const derived = {
    screenTitle,
    categoryLabel,
    previewImageUrl,
    publicationStatusLabel,
    completionLabel,
    coordinateSummary: editableValues
      ? buildCoordinateSummary(editableValues.latitude, editableValues.longitude)
      : buildCoordinateSummary("", ""),
    initialMapPickerCoordinates: editableValues
      ? parseDraftCoordinates(editableValues)
      : null,
  };

  const ui = {
    isEditing,
    isSaving,
    isCategoryMenuOpen,
    isStatusMenuOpen,
    isMapPickerOpen,
    isLoadingJourney,
    journeyError,
    formError,
    isLoadingAvailableLocations,
    availableLocationsError,
  };

  const actions = {
    updateDraft,
    setRouteDraftLocations,
    handleEditPress,
    toggleCategoryMenu,
    selectCategory,
    toggleStatusMenu,
    selectStatus,
    openMapPicker,
    closeMapPicker,
    handleConfirmCoordinates,
    loadAvailableLocations,
    handleSavePress,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
