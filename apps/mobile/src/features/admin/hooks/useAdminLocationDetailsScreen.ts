import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { updateAdminLocation } from "@/src/features/admin/api/adminLocationsApi";
import { type AdminLocationImageDraft } from "@/src/features/admin/components/AdminLocationImageManager";
import {
  buildCoordinateSummary,
  buildLocationUpdatePayload,
  createLocationEditDraft,
  getPublicationStatusLabel,
  mergeLocationForAdminView,
  parseDraftCoordinates,
  parseLocationId,
  reconcileCachedLocationsAfterAdminSave,
  type CoordinateSelection,
  type LocationEditDraft,
} from "@/src/features/admin/utils/adminLocationDetailsModel";
import { bootstrapContentCacheIfNeeded } from "@/src/features/content/storage/contentBootstrap";
import { hydrateLocationWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getLocationVisitStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  getActiveLocations,
  getLocationById,
} from "@/src/features/locations/api/locationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";
import {
  cacheActiveContent,
  getCachedJourneys,
  getCachedLocations,
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function useAdminLocationDetailsScreen() {
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const { locationId } = useLocalSearchParams<{
    locationId?: string | string[];
  }>();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [draft, setDraft] = useState<LocationEditDraft | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      setIsLoadingLocation(true);
      setLocationError(null);

      const resolvedLocationId = parseLocationId(locationId);

      if (resolvedLocationId === null) {
        if (isMounted) {
          setLocation(null);
          setLocationError("Location not found.");
          setIsLoadingLocation(false);
        }

        return;
      }

      try {
        let nextLocation: Location | null = null;

        try {
          await initializeContentCache();
          nextLocation = await getCachedLocationById(resolvedLocationId);
          nextLocation = await hydrateLocationWithProgress(
            user?.id,
            nextLocation,
          );
        } catch {
          // Continue with bootstrap and network fallbacks.
        }

        if (!nextLocation) {
          try {
            const { didBootstrap } = await bootstrapContentCacheIfNeeded();

            if (didBootstrap) {
              nextLocation = await getCachedLocationById(resolvedLocationId);
              nextLocation = await hydrateLocationWithProgress(
                user?.id,
                nextLocation,
              );
            }
          } catch {
            // Cache bootstrap should not block details rendering.
          }
        }

        try {
          nextLocation = await getLocationById(resolvedLocationId);
          nextLocation = await hydrateLocationWithProgress(
            user?.id,
            nextLocation,
          );
        } catch {
          if (!nextLocation) {
            const activeLocations = await getActiveLocations();
            nextLocation =
              activeLocations.find(
                (activeLocation) => activeLocation.id === resolvedLocationId,
              ) ?? null;
            nextLocation = await hydrateLocationWithProgress(
              user?.id,
              nextLocation,
            );
          }
        }

        if (!nextLocation) {
          throw new Error("Location not found");
        }

        if (!isMounted) {
          return;
        }

        setLocation(nextLocation);
        setLocationError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setLocation(null);
        setLocationError("Could not load this admin location right now.");
      } finally {
        if (isMounted) {
          setIsLoadingLocation(false);
        }
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, locationId, progressRevision, user?.id]);

  useEffect(() => {
    if (!location) {
      setDraft(null);
      setIsEditing(false);
      setIsMapPickerOpen(false);
      return;
    }

    setDraft(createLocationEditDraft(location));
    setIsEditing(false);
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsMapPickerOpen(false);
  }, [location]);

  const editableValues = location
    ? (draft ?? createLocationEditDraft(location))
    : null;
  const screenTitle = editableValues?.title || location?.title || "Location";
  const categoryLabel = editableValues
    ? normalizeCategory(editableValues.category)
    : location
      ? normalizeCategory(location.category)
      : "";
  const locationStatusLabel = location
    ? getLocationVisitStatusLabel(location)
    : "Location";
  const publicationStatusLabel = editableValues
    ? getPublicationStatusLabel(Number(editableValues.status))
    : location
      ? getPublicationStatusLabel(location.status)
      : "Unknown";

  function updateDraft<Field extends keyof LocationEditDraft>(
    field: Field,
    value: LocationEditDraft[Field],
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

  function updateImageDrafts(
    updater: (
      currentImageDrafts: AdminLocationImageDraft[],
    ) => AdminLocationImageDraft[],
  ) {
    setDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            imageDrafts: updater(currentDraft.imageDrafts),
          }
        : currentDraft,
    );
  }

  function handleEditPress() {
    if (isSaving) {
      return;
    }

    if (isEditing) {
      setDraft(location ? createLocationEditDraft(location) : null);
      setIsEditing(false);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setIsMapPickerOpen(false);
      setFormError(null);
      return;
    }

    if (location) {
      setDraft(createLocationEditDraft(location));
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

  async function handleSavePress() {
    if (!location || !draft) {
      return;
    }

    const payload = buildLocationUpdatePayload(draft);

    if (!payload.success) {
      setFormError(payload.message);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const savedLocation = await updateAdminLocation(
        location.id,
        payload.value,
      );
      const nextLocation = mergeLocationForAdminView(location, savedLocation);

      setLocation(nextLocation);
      setDraft(createLocationEditDraft(nextLocation));
      setIsEditing(false);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setIsMapPickerOpen(false);
      setLocationError(null);

      try {
        const [cachedLocations, cachedJourneys] = await Promise.all([
          getCachedLocations(),
          getCachedJourneys(),
        ]);

        const nextCachedLocations = reconcileCachedLocationsAfterAdminSave(
          cachedLocations,
          nextLocation,
        );

        await cacheActiveContent({
          locations: nextCachedLocations,
          journeys: cachedJourneys,
        });
        markContentUpdated();
      } catch {
        // Keep the saved server state even if local cache refresh fails.
      }

      showAppToast({
        text: "The location changes were saved.",
        tone: "success",
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not save the location changes right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const data = {
    location,
    editableValues,
  };

  const derived = {
    screenTitle,
    categoryLabel,
    locationStatusLabel,
    publicationStatusLabel,
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
    isLoadingLocation,
    locationError,
    formError,
  };

  const actions = {
    updateDraft,
    updateImageDrafts,
    handleEditPress,
    toggleCategoryMenu,
    selectCategory,
    toggleStatusMenu,
    selectStatus,
    openMapPicker,
    closeMapPicker,
    handleConfirmCoordinates,
    handleSavePress,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
