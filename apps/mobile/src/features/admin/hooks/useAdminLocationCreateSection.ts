import { useState } from "react";
import { useRouter } from "expo-router";

import { createAdminLocation } from "@/src/features/admin/api/adminLocationsApi";
import {
  appendCreatedLocationToActiveCache,
  buildCoordinateSummary,
  buildCreateLocationPayload,
  getPublicationStatusLabel,
  INITIAL_CREATE_DRAFT,
  parseDraftCoordinates,
  toNullableImageUrl,
  type CoordinateSelection,
  type LocationCreateDraft,
} from "@/src/features/admin/utils/adminLocationCreateModel";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";
import {
  cacheActiveContent,
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function useAdminLocationCreateSection() {
  const router = useRouter();
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const [draft, setDraft] = useState<LocationCreateDraft>(INITIAL_CREATE_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryLabel = normalizeCategory(draft.category);
  const publicationStatusLabel = getPublicationStatusLabel(Number(draft.status));
  const currentImageUrl = toNullableImageUrl(draft.imageUrl);

  function updateDraft<Field extends keyof LocationCreateDraft>(
    field: Field,
    value: LocationCreateDraft[Field],
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

  async function handleCreateLocation() {
    const payload = buildCreateLocationPayload(draft);

    if (!payload.success) {
      setFormError(payload.message);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const createdLocation = await createAdminLocation(payload.value);

      try {
        if (createdLocation.status === 1) {
          await initializeContentCache();

          const [cachedLocations, cachedJourneys] = await Promise.all([
            getCachedLocations(),
            getCachedJourneys(),
          ]);

          await cacheActiveContent({
            locations: appendCreatedLocationToActiveCache(
              cachedLocations,
              createdLocation,
            ),
            journeys: cachedJourneys,
          });
        }

        markContentUpdated();
      } catch {
        // Keep the created server state even if local cache refresh fails.
      }

      clearForm();

      router.push({
        pathname: "/admin-location/[locationId]",
        params: {
          locationId: String(createdLocation.id),
        },
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not create the location right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const data = {
    draft,
  };

  const derived = {
    categoryLabel,
    publicationStatusLabel,
    currentImageUrl,
    coordinateSummary: buildCoordinateSummary(draft.latitude, draft.longitude),
    initialMapPickerCoordinates: parseDraftCoordinates(draft),
  };

  const ui = {
    isSaving,
    isCategoryMenuOpen,
    isStatusMenuOpen,
    isMapPickerOpen,
    formError,
  };

  const actions = {
    updateDraft,
    clearForm,
    toggleCategoryMenu,
    selectCategory,
    toggleStatusMenu,
    selectStatus,
    openMapPicker,
    closeMapPicker,
    handleConfirmCoordinates,
    handleCreateLocation,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
