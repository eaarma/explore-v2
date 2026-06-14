import { useState } from "react";
import { useRouter } from "expo-router";

import {
  createAdminJourney,
  replaceAdminJourneyLocations,
} from "@/src/features/admin/api/adminJourneysApi";
import {
  appendCreatedJourneyLocationsToCache,
  appendCreatedJourneyToActiveCache,
  buildCoordinateSummary,
  buildCreateJourneyPayload,
  getPublicationStatusLabel,
  INITIAL_CREATE_DRAFT,
  normalizeJourneyLocationSortOrder,
  parseDraftCoordinates,
  type CoordinateSelection,
  type JourneyCreateDraft,
} from "@/src/features/admin/utils/adminJourneyCreateModel";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Journey } from "@/src/features/journeys/types/journeyTypes";
import { getAllLocations } from "@/src/features/locations/api/locationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";
import {
  cacheActiveContent,
  cacheJourneyLocations,
  getCachedJourneyLocations,
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function useAdminJourneyCreateSection() {
  const router = useRouter();
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const [draft, setDraft] = useState<JourneyCreateDraft>(INITIAL_CREATE_DRAFT);
  const [routeDraftLocations, setRouteDraftLocations] = useState<
    JourneyLocation[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoadingAvailableLocations, setIsLoadingAvailableLocations] =
    useState(false);
  const [availableLocationsError, setAvailableLocationsError] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryLabel = normalizeCategory(draft.category);
  const publicationStatusLabel = getPublicationStatusLabel(Number(draft.status));
  const previewImageUrl =
    routeDraftLocations.find((journeyLocation) => journeyLocation.imageUrl)
      ?.imageUrl ?? null;

  function updateDraft<Field extends keyof JourneyCreateDraft>(
    field: Field,
    value: JourneyCreateDraft[Field],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setFormError(null);
  }

  function clearForm() {
    if (isSaving) {
      return;
    }

    setDraft(INITIAL_CREATE_DRAFT);
    setRouteDraftLocations([]);
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsMapPickerOpen(false);
    setFormError(null);
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
          "Could not load locations for journey creation right now.",
        ),
      );
    } finally {
      setIsLoadingAvailableLocations(false);
    }
  }

  async function handleCreateJourney() {
    const payload = buildCreateJourneyPayload(draft);

    if (!payload.success) {
      setFormError(payload.message);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const createdJourney = await createAdminJourney(payload.value);
      const nextRouteLocations = normalizeJourneyLocationSortOrder(
        routeDraftLocations.map((journeyLocation) => ({
          ...journeyLocation,
          journeyId: createdJourney.id,
        })),
      );
      let routeSaveErrorMessage: string | null = null;

      try {
        await replaceAdminJourneyLocations(
          createdJourney.id,
          nextRouteLocations.map((journeyLocation) => ({
            locationId: journeyLocation.locationId,
            sortOrder: journeyLocation.sortOrder,
          })),
        );
      } catch (error) {
        routeSaveErrorMessage = getApiErrorMessage(
          error,
          "Journey was created, but its route locations could not be saved.",
        );
      }

      try {
        if (createdJourney.status === 1) {
          await initializeContentCache();

          const [cachedLocations, cachedJourneys, cachedJourneyLocations] =
            await Promise.all([
              getCachedLocations(),
              getCachedJourneys(),
              getCachedJourneyLocations(),
            ]);

          await Promise.all([
            cacheActiveContent({
              locations: cachedLocations,
              journeys: appendCreatedJourneyToActiveCache(
                cachedJourneys,
                createdJourney as Journey,
              ),
            }),
            cacheJourneyLocations(
              appendCreatedJourneyLocationsToCache(
                cachedJourneyLocations,
                createdJourney as Journey,
                routeSaveErrorMessage ? [] : nextRouteLocations,
              ),
            ),
          ]);
        }

        markContentUpdated();
      } catch {
        // Keep the created server state even if local cache refresh fails.
      }

      clearForm();

      if (routeSaveErrorMessage) {
        showAppToast({
          text: routeSaveErrorMessage,
          tone: "warning",
        });
      }

      router.push({
        pathname: "/admin-journey/[journeyId]",
        params: {
          journeyId: String(createdJourney.id),
        },
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not create the journey right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const data = {
    draft,
    routeDraftLocations,
    availableLocations,
  };

  const derived = {
    categoryLabel,
    publicationStatusLabel,
    previewImageUrl,
    coordinateSummary: buildCoordinateSummary(draft.latitude, draft.longitude),
    initialMapPickerCoordinates: parseDraftCoordinates(draft),
  };

  const ui = {
    isSaving,
    isCategoryMenuOpen,
    isStatusMenuOpen,
    isMapPickerOpen,
    isLoadingAvailableLocations,
    availableLocationsError,
    formError,
  };

  const actions = {
    updateDraft,
    setRouteDraftLocations,
    clearForm,
    toggleCategoryMenu,
    selectCategory,
    toggleStatusMenu,
    selectStatus,
    openMapPicker,
    closeMapPicker,
    handleConfirmCoordinates,
    loadAvailableLocations,
    handleCreateJourney,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
