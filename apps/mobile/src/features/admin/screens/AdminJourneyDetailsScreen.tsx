import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Modal,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type PressEvent,
} from "@maplibre/maplibre-react-native";

import {
  replaceAdminJourneyLocations,
  type UpdateAdminJourneyRequest,
  updateAdminJourney,
} from "@/src/features/admin/api/adminJourneysApi";
import { AdminJourneyLocationEditor } from "@/src/features/admin/components/AdminJourneyLocationEditor";
import { useAuthStore } from "@/src/features/auth/store/authStore";
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
import {
  formatRouteDistance,
  formatStopCount,
  normalizeCategory,
} from "@/src/features/journeys/components/journeysSectionShared";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Journey, type JourneyTrait } from "@/src/features/journeys/types/journeyTypes";
import { getAllLocations } from "@/src/features/locations/api/locationsApi";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { useMapStyle } from "@/src/features/map/hooks/useMapStyle";
import { DEFAULT_MAP_CENTER } from "@/src/features/map/mapConfig";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import {
  ACTIVE_STATE_ACCENT,
  getActiveStateColors,
} from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
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
import { showJourneyOptionsDialog } from "@/src/shared/utils/locationActions";

type JourneyEditDraft = {
  title: string;
  description: string;
  county: string;
  category: string;
  latitude: string;
  longitude: string;
  status: string;
  experience: string;
  distance: string;
  difficulty: string;
  polyline: string;
  notes: string;
  traits: string[];
};

type CoordinateSelection = {
  latitude: number;
  longitude: number;
};

const JOURNEY_STATUS_OPTIONS = [
  { key: "1", label: "Active" },
  { key: "0", label: "Inactive" },
] as const;

const JOURNEY_CATEGORY_OPTIONS = [
  { key: "Hiking", label: "Hiking" },
  { key: "Historic", label: "Historic" },
  { key: "Urbex", label: "Urbex" },
  { key: "Camping", label: "Camping" },
  { key: "Sightseeing", label: "Sightseeing" },
  { key: "Adventure", label: "Adventure" },
] as const;

export function AdminJourneyDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getAdminJourneyDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
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

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  if (userRole !== "ADMIN") {
    return <Redirect href="/map" />;
  }

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

  function openMapPicker() {
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsMapPickerOpen(true);
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: screenTitle,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingJourney ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin details</Text>
            <Text style={styles.stateCopy}>
              Pulling the journey details for the admin screen.
            </Text>
          </View>
        ) : null}

        {!isLoadingJourney && journeyError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Journey unavailable</Text>
            <Text style={styles.stateCopy}>{journeyError}</Text>
          </View>
        ) : null}

        {!isLoadingJourney && !journeyError && journey && editableValues ? (
          <>
            <View style={styles.heroCard}>
              <AdminJourneyHeroMedia
                imageUrl={previewImageUrl}
                categoryLabel={categoryLabel}
                styles={styles}
              />

              <View style={styles.heroCopy}>
                <View style={styles.heroHeaderRow}>
                  <Text style={styles.eyebrow}>Admin journey</Text>

                  <Pressable
                    onPress={handleEditPress}
                    disabled={isSaving}
                    style={({ pressed }) => [
                      styles.editButton,
                      isSaving && styles.editButtonDisabled,
                      pressed && styles.editButtonPressed,
                    ]}
                  >
                    <Text style={styles.editButtonText}>
                      {isEditing ? "Cancel edit" : "Edit"}
                    </Text>
                  </Pressable>
                </View>

                {isEditing ? (
                  <TextInput
                    value={editableValues.title}
                    onChangeText={(value) => updateDraft("title", value)}
                    style={[styles.textInput, styles.titleInput]}
                    placeholder="Journey title"
                    placeholderTextColor={colors.inputPlaceholder}
                  />
                ) : (
                  <Text style={styles.journeyTitle}>
                    {getJourneyTitle(editableValues.title)}
                  </Text>
                )}

                <Text style={styles.journeyMeta}>
                  {editableValues.county || "Unknown county"} | {categoryLabel}
                </Text>
                <Text style={styles.journeySubcopy}>
                  {formatDraftRouteDistance(editableValues.distance)} |{" "}
                  {formatStopCount(displayedJourneyLocations.length)} |{" "}
                  {completionLabel}
                </Text>

                {isEditing ? (
                  <Text style={styles.editingHint}>
                    Update the fields below and save when you are ready.
                  </Text>
                ) : null}

                <View style={styles.metricRow}>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>ID {journey.id}</Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      {publicationStatusLabel}
                    </Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      Difficulty {editableValues.difficulty || "?"}
                    </Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      Experience {editableValues.experience || "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Overview</Text>
              {isEditing ? (
                <TextInput
                  value={editableValues.description}
                  onChangeText={(value) => updateDraft("description", value)}
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Journey description"
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <Text style={styles.description}>
                  {getJourneyDescription(journey.description)}
                </Text>
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>At a glance</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    {formatDraftRouteDistance(editableValues.distance)}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    Difficulty {editableValues.difficulty || "?"}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    {formatStopCount(displayedJourneyLocations.length)}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    {editableValues.county || "Unknown county"}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>{categoryLabel}</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>{completionLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Journey metadata</Text>

              {isEditing ? (
                <>
                  <EditableField
                    label="County"
                    value={editableValues.county}
                    onChangeText={(value) => updateDraft("county", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                  />
                  <EditableSelectField
                    label="Category"
                    value={editableValues.category}
                    options={JOURNEY_CATEGORY_OPTIONS}
                    isOpen={isCategoryMenuOpen}
                    onToggle={() => {
                      setIsCategoryMenuOpen((currentValue) => !currentValue);
                      setIsStatusMenuOpen(false);
                    }}
                    onSelect={(value) => {
                      updateDraft("category", value);
                      setIsCategoryMenuOpen(false);
                    }}
                    styles={styles}
                  />
                  <EditableSelectField
                    label="Status"
                    value={editableValues.status}
                    options={JOURNEY_STATUS_OPTIONS}
                    isOpen={isStatusMenuOpen}
                    onToggle={() => {
                      setIsStatusMenuOpen((currentValue) => !currentValue);
                      setIsCategoryMenuOpen(false);
                    }}
                    onSelect={(value) => {
                      updateDraft("status", value);
                      setIsStatusMenuOpen(false);
                    }}
                    styles={styles}
                  />
                  <EditableField
                    label="Distance"
                    value={editableValues.distance}
                    onChangeText={(value) => updateDraft("distance", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="decimal-pad"
                  />
                  <EditableField
                    label="Difficulty"
                    value={editableValues.difficulty}
                    onChangeText={(value) => updateDraft("difficulty", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="number-pad"
                  />
                  <EditableField
                    label="Experience"
                    value={editableValues.experience}
                    onChangeText={(value) => updateDraft("experience", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="number-pad"
                  />
                  <EditableField
                    label="Note"
                    value={editableValues.notes}
                    onChangeText={(value) => updateDraft("notes", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                  />
                  <EditableField
                    label="Latitude"
                    value={editableValues.latitude}
                    onChangeText={(value) => updateDraft("latitude", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="decimal-pad"
                  />
                  <EditableField
                    label="Longitude"
                    value={editableValues.longitude}
                    onChangeText={(value) => updateDraft("longitude", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.coordinateSummaryRow}>
                    <Text style={styles.coordinateSummaryText}>
                      {buildCoordinateSummary(
                        editableValues.latitude,
                        editableValues.longitude,
                      )}
                    </Text>

                    <Pressable
                      onPress={openMapPicker}
                      style={({ pressed }) => [
                        styles.inlineButton,
                        pressed && styles.inlineButtonPressed,
                      ]}
                    >
                      <Text style={styles.inlineButtonText}>Pick on map</Text>
                    </Pressable>
                  </View>
                  <EditableField
                    label="Polyline"
                    value={editableValues.polyline}
                    onChangeText={(value) => updateDraft("polyline", value)}
                    styles={styles}
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                  />
                </>
              ) : (
                <>
                  <MetadataRow
                    label="Title"
                    value={getJourneyTitle(journey.title)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="County"
                    value={normalizeCounty(journey.county)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Category"
                    value={categoryLabel}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Raw category"
                    value={getRawValue(journey.category)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Publication status"
                    value={publicationStatusLabel}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Status code"
                    value={String(journey.status)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Distance"
                    value={formatRouteDistance(journey.distance)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Difficulty"
                    value={formatDifficulty(journey.difficulty)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Experience"
                    value={formatWholeNumber(journey.experience)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Note"
                    value={getMultilineValue(journey.notes, "No note added.")}
                    styles={styles}
                    multiline
                  />
                  <MetadataRow
                    label="Latitude"
                    value={formatCoordinate(journey.latitude)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Longitude"
                    value={formatCoordinate(journey.longitude)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Polyline"
                    value={getMultilineValue(
                      journey.polyline,
                      "No route polyline saved.",
                    )}
                    styles={styles}
                    multiline
                  />
                </>
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Traits</Text>

              {isEditing ? (
                <JourneyTraitsEditor
                  traits={editableValues.traits}
                  isDisabled={isSaving}
                  placeholderTextColor={colors.inputPlaceholder}
                  styles={styles}
                  onChangeTraits={(traits) => updateDraft("traits", traits)}
                />
              ) : (
                <JourneyTraitBubbles
                  traits={editableValues.traits}
                  styles={styles}
                />
              )}
            </View>

            <View style={styles.detailsCard}>
              <AdminJourneyLocationEditor
                availableLocations={availableLocations}
                availableLocationsError={availableLocationsError}
                isEditing={isEditing}
                isLoadingAvailableLocations={isLoadingAvailableLocations}
                isSaving={isSaving}
                journeyId={journey.id}
                locations={displayedJourneyLocations}
                onLocationsChange={setRouteDraftLocations}
                onRequestAvailableLocations={() =>
                  void loadAvailableLocations()
                }
              />
            </View>

            {formError ? <InlineFeedbackCard message={formError} /> : null}

            <View style={styles.actionRow}>
              {isEditing ? (
                <Pressable
                  onPress={() => void handleSavePress()}
                  disabled={isSaving}
                  style={[
                    styles.actionButton,
                    styles.actionButtonPrimary,
                    isSaving && styles.actionButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextPrimary,
                    ]}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/map",
                      params: {
                        focusLatitude: String(journey.latitude),
                        focusLongitude: String(journey.longitude),
                        focusAt: String(Date.now()),
                        focusKind: "journey",
                        focusItemId: String(journey.id),
                      },
                    })
                  }
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextPrimary,
                    ]}
                  >
                    Show on map
                  </Text>
                </Pressable>
              )}

              {!isEditing ? (
                <Pressable
                  accessibilityLabel="More journey actions"
                  accessibilityRole="button"
                  onPress={() => showJourneyOptionsDialog(journey)}
                  style={[
                    styles.actionButton,
                    styles.actionButtonSecondary,
                    styles.actionIconButton,
                  ]}
                >
                  <Ionicons
                    color={colors.secondaryActionText}
                    name="ellipsis-horizontal"
                    size={20}
                  />
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => router.back()}
                disabled={isSaving}
                style={[styles.actionButton, styles.actionButtonSecondary]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextSecondary,
                  ]}
                >
                  Back
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      <CoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={
          editableValues ? parseDraftCoordinates(editableValues) : null
        }
        colors={colors}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleConfirmCoordinates}
      />
    </>
  );
}

type AdminJourneyHeroMediaProps = {
  imageUrl: string | null;
  categoryLabel: string;
  styles: AdminJourneyDetailsStyles;
};

function AdminJourneyHeroMedia({
  imageUrl,
  categoryLabel,
  styles,
}: AdminJourneyHeroMediaProps) {
  if (!imageUrl) {
    return (
      <CategoryImagePlaceholder
        categoryLabel={categoryLabel}
        size="large"
        style={styles.heroImage}
      />
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.heroImage}
      contentFit="cover"
    />
  );
}

type MetadataRowProps = {
  label: string;
  value: string;
  styles: AdminJourneyDetailsStyles;
  multiline?: boolean;
};

function MetadataRow({
  label,
  value,
  styles,
  multiline = false,
}: MetadataRowProps) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text
        style={[
          styles.metadataValue,
          multiline && styles.metadataValueMultiline,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type EditableFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  styles: AdminJourneyDetailsStyles;
  placeholderTextColor: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
};

function EditableField({
  label,
  value,
  onChangeText,
  styles,
  placeholderTextColor,
  multiline = false,
  keyboardType = "default",
}: EditableFieldProps) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.textInput, multiline && styles.multilineInput]}
        placeholder={label}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

type EditableSelectFieldProps = {
  label: string;
  value: string;
  options: readonly { key: string; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  styles: AdminJourneyDetailsStyles;
};

function EditableSelectField({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  styles,
}: EditableSelectFieldProps) {
  const selectedLabel = getSelectOptionLabel(value, options);

  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selectButton,
          isOpen && styles.selectButtonOpen,
          pressed && styles.selectButtonPressed,
        ]}
      >
        <Text style={styles.selectButtonText}>{selectedLabel}</Text>
        <Text style={styles.selectButtonChevron}>{isOpen ? "^" : "v"}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const isSelected = option.key === value;

            return (
              <Pressable
                key={option.key}
                onPress={() => onSelect(option.key)}
                style={({ pressed }) => [
                  styles.selectOption,
                  isSelected && styles.selectOptionSelected,
                  pressed && styles.selectOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    isSelected && styles.selectOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type JourneyTraitsEditorProps = {
  traits: string[];
  isDisabled: boolean;
  placeholderTextColor: string;
  styles: AdminJourneyDetailsStyles;
  onChangeTraits: (traits: string[]) => void;
};

function JourneyTraitsEditor({
  traits,
  isDisabled,
  placeholderTextColor,
  styles,
  onChangeTraits,
}: JourneyTraitsEditorProps) {
  const [nextTrait, setNextTrait] = useState("");
  const normalizedNextTrait = normalizeTraitName(nextTrait);
  const canAddTrait =
    !isDisabled &&
    normalizedNextTrait.length > 0 &&
    !traits.some(
      (trait) => trait.trim().toLowerCase() === normalizedNextTrait.toLowerCase(),
    );

  function handleAddTrait() {
    if (!canAddTrait) {
      return;
    }

    onChangeTraits([...traits, normalizedNextTrait]);
    setNextTrait("");
  }

  function handleRemoveTrait(indexToRemove: number) {
    if (isDisabled) {
      return;
    }

    onChangeTraits(traits.filter((_, index) => index !== indexToRemove));
  }

  return (
    <View style={styles.traitsEditorGroup}>
      {traits.length > 0 ? (
        <JourneyTraitBubbles
          traits={traits}
          styles={styles}
          onRemoveTrait={handleRemoveTrait}
          isEditable
          isDisabled={isDisabled}
        />
      ) : (
        <Text style={styles.emptyStateCopy}>
          Add traits like scenic, beginner-friendly, or muddy trail.
        </Text>
      )}

      <View style={styles.traitInputRow}>
        <TextInput
          value={nextTrait}
          onChangeText={setNextTrait}
          editable={!isDisabled}
          style={[styles.textInput, styles.traitInput]}
          placeholder="Add a trait"
          placeholderTextColor={placeholderTextColor}
          returnKeyType="done"
          onSubmitEditing={handleAddTrait}
        />

        <Pressable
          disabled={!canAddTrait}
          onPress={handleAddTrait}
          style={({ pressed }) => [
            styles.traitAddButton,
            pressed && styles.traitAddButtonPressed,
            !canAddTrait && styles.traitAddButtonDisabled,
          ]}
        >
          <Text style={styles.traitAddButtonText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

type JourneyTraitBubblesProps = {
  traits: string[] | JourneyTrait[] | undefined;
  styles: AdminJourneyDetailsStyles;
  onRemoveTrait?: (index: number) => void;
  isEditable?: boolean;
  isDisabled?: boolean;
};

function JourneyTraitBubbles({
  traits,
  styles,
  onRemoveTrait,
  isEditable = false,
  isDisabled = false,
}: JourneyTraitBubblesProps) {
  const normalizedTraits = normalizeTraitList(traits);

  if (normalizedTraits.length === 0) {
    return <Text style={styles.emptyStateCopy}>No traits added yet.</Text>;
  }

  return (
    <View style={styles.traitsWrap}>
      {normalizedTraits.map((trait, index) => (
        <View key={`${trait}-${index}`} style={styles.traitChip}>
          <Text style={styles.traitChipText}>{trait}</Text>

          {isEditable && onRemoveTrait ? (
            <Pressable
              accessibilityLabel={`Remove ${trait} trait`}
              accessibilityRole="button"
              disabled={isDisabled}
              hitSlop={6}
              onPress={() => onRemoveTrait(index)}
              style={({ pressed }) => [
                styles.traitRemoveButton,
                pressed && styles.traitRemoveButtonPressed,
                isDisabled && styles.traitRemoveButtonDisabled,
              ]}
            >
              <Text style={styles.traitRemoveButtonText}>x</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

type CoordinatePickerModalProps = {
  visible: boolean;
  initialCoordinates: CoordinateSelection | null;
  colors: AdminJourneyDetailsColors;
  onClose: () => void;
  onConfirm: (coordinates: CoordinateSelection) => void;
};

function CoordinatePickerModal({
  visible,
  initialCoordinates,
  colors,
  onClose,
  onConfirm,
}: CoordinatePickerModalProps) {
  const selectedMapStyle = useAppSettingsStore(
    (state) => state.defaultMapStyle,
  );
  const { resolvedMapStyle } = useMapStyle(selectedMapStyle);
  const cameraRef = useRef<CameraRef>(null);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<CoordinateSelection | null>(initialCoordinates);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedCoordinates(initialCoordinates);
  }, [initialCoordinates, visible]);

  const markerGeoJson = useMemo(
    () => buildSelectedCoordinateFeatureCollection(selectedCoordinates),
    [selectedCoordinates],
  );
  const initialCenter = DEFAULT_MAP_CENTER;
  const initialZoom = 7;

  function handleMapPress(event: NativeSyntheticEvent<PressEvent>) {
    const [longitude, latitude] = event.nativeEvent.lngLat;

    setSelectedCoordinates({
      latitude,
      longitude,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick on map</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryPillButton,
              pressed && styles.secondaryPillButtonPressed,
            ]}
          >
            <Text style={styles.secondaryPillButtonText}>Close</Text>
          </Pressable>
        </View>

        <Text style={styles.modalCopy}>
          Tap the map to place a marker, then confirm to fill the coordinates
          back into the form.
        </Text>

        <View style={styles.mapFrame}>
          <MapLibreMap
            style={styles.map}
            mapStyle={resolvedMapStyle}
            androidView="texture"
            attribution
            compass={false}
            logo={false}
            onPress={handleMapPress}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: initialCenter,
                zoom: initialZoom,
              }}
            />

            <GeoJSONSource id="admin-journey-picker-point" data={markerGeoJson}>
              <Layer
                id="admin-journey-picker-glow"
                type="circle"
                paint={{
                  "circle-radius": 16,
                  "circle-color": colors.accent,
                  "circle-opacity": 0.22,
                }}
              />
              <Layer
                id="admin-journey-picker-dot"
                type="circle"
                paint={{
                  "circle-radius": 7,
                  "circle-color": colors.accent,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#FFFFFF",
                }}
              />
            </GeoJSONSource>
          </MapLibreMap>
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.coordinateSummaryText}>
            {selectedCoordinates
              ? `${selectedCoordinates.latitude.toFixed(6)}, ${selectedCoordinates.longitude.toFixed(6)}`
              : "No marker placed yet."}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[styles.actionButton, styles.actionButtonSecondary]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextSecondary,
                ]}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                selectedCoordinates ? onConfirm(selectedCoordinates) : undefined
              }
              disabled={!selectedCoordinates}
              style={[
                styles.actionButton,
                styles.actionButtonPrimary,
                !selectedCoordinates && styles.actionButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextPrimary,
                ]}
              >
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parseJourneyId(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(firstValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function createJourneyEditDraft(journey: Journey): JourneyEditDraft {
  return {
    title: journey.title ?? "",
    description: journey.description ?? "",
    county: journey.county ?? "",
    category: normalizeJourneyCategoryValue(journey.category),
    latitude: String(journey.latitude),
    longitude: String(journey.longitude),
    status: String(journey.status),
    experience: String(journey.experience),
    distance: String(journey.distance),
    difficulty: String(journey.difficulty),
    polyline: journey.polyline ?? "",
    notes: normalizeOptionalText(journey.notes),
    traits: normalizeTraitList(journey.traits),
  };
}

function buildJourneyUpdatePayload(
  draft: JourneyEditDraft,
):
  | { success: true; value: UpdateAdminJourneyRequest }
  | { success: false; message: string } {
  const latitude = parseRequiredNumber(draft.latitude, "Latitude");
  if (!latitude.success) {
    return latitude;
  }

  const longitude = parseRequiredNumber(draft.longitude, "Longitude");
  if (!longitude.success) {
    return longitude;
  }

  const distance = parseRequiredNumber(draft.distance, "Distance");
  if (!distance.success) {
    return distance;
  }

  const status = parseJourneyStatusValue(draft.status);
  if (!status.success) {
    return status;
  }

  const category = parseJourneyCategoryValue(draft.category);
  if (!category.success) {
    return category;
  }

  const difficulty = parseRequiredInteger(draft.difficulty, "Difficulty");
  if (!difficulty.success) {
    return difficulty;
  }

  const experience = parseRequiredInteger(draft.experience, "Experience");
  if (!experience.success) {
    return experience;
  }

  return {
    success: true,
    value: {
      title: draft.title,
      description: draft.description,
      latitude: latitude.value,
      longitude: longitude.value,
      county: draft.county,
      category: category.value,
      experience: experience.value,
      distance: distance.value,
      difficulty: difficulty.value,
      polyline: draft.polyline,
      traits: draft.traits.map((trait) => ({ name: trait })),
      notes: draft.notes,
      status: status.value,
    },
  };
}

function parseRequiredNumber(
  rawValue: string,
  fieldLabel: string,
): { success: true; value: number } | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return {
      success: false,
      message: `${fieldLabel} is required.`,
    };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue)) {
    return {
      success: false,
      message: `${fieldLabel} must be a valid number.`,
    };
  }

  return {
    success: true,
    value: parsedValue,
  };
}

function parseRequiredInteger(
  rawValue: string,
  fieldLabel: string,
): { success: true; value: number } | { success: false; message: string } {
  const parsedValue = parseRequiredNumber(rawValue, fieldLabel);

  if (!parsedValue.success) {
    return parsedValue;
  }

  if (!Number.isInteger(parsedValue.value)) {
    return {
      success: false,
      message: `${fieldLabel} must be a whole number.`,
    };
  }

  return parsedValue;
}

function parseJourneyStatusValue(
  rawValue: string,
): { success: true; value: number } | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (JOURNEY_STATUS_OPTIONS.some((option) => option.key === trimmedValue)) {
    return {
      success: true,
      value: Number(trimmedValue),
    };
  }

  return {
    success: false,
    message: "Status must be Active or Inactive.",
  };
}

function parseJourneyCategoryValue(
  rawValue: string,
): { success: true; value: string } | { success: false; message: string } {
  const normalizedValue = normalizeJourneyCategoryValue(rawValue);

  if (
    JOURNEY_CATEGORY_OPTIONS.some((option) => option.key === normalizedValue)
  ) {
    return {
      success: true,
      value: normalizedValue,
    };
  }

  return {
    success: false,
    message:
      "Category must be Hiking, Historic, Urbex, Camping, Sightseeing, or Adventure.",
  };
}

function mergeJourneyForAdminView(
  previousJourney: Journey,
  savedJourney: Journey,
): Journey {
  return {
    ...savedJourney,
    completed: previousJourney.completed,
    completedAt: previousJourney.completedAt,
    active: previousJourney.active,
    activeAt: previousJourney.activeAt,
  };
}

function reconcileCachedJourneysAfterAdminSave(
  cachedJourneys: Journey[],
  nextJourney: Journey,
) {
  const journeysWithoutSavedJourney = cachedJourneys.filter(
    (cachedJourney) => cachedJourney.id !== nextJourney.id,
  );

  if (nextJourney.status !== 1) {
    return journeysWithoutSavedJourney;
  }

  return [...journeysWithoutSavedJourney, nextJourney];
}

function reconcileCachedJourneyLocationsAfterAdminSave(
  cachedJourneyLocations: JourneyLocation[],
  nextJourney: Journey,
  nextRouteLocations: JourneyLocation[],
) {
  const locationsWithoutJourney = cachedJourneyLocations.filter(
    (journeyLocation) => journeyLocation.journeyId !== nextJourney.id,
  );

  if (nextJourney.status !== 1) {
    return locationsWithoutJourney;
  }

  return [
    ...locationsWithoutJourney,
    ...normalizeJourneyLocationSortOrder(nextRouteLocations),
  ].sort((left, right) => {
    if (left.journeyId !== right.journeyId) {
      return left.journeyId - right.journeyId;
    }

    return compareJourneyLocations(left, right);
  });
}

function normalizeJourneyLocationSortOrder(locations: JourneyLocation[]) {
  return locations.map((location, index) => ({
    ...location,
    sortOrder: index,
  }));
}

function compareJourneyLocations(
  left: JourneyLocation,
  right: JourneyLocation,
) {
  const leftOrder = Number.isFinite(left.sortOrder) ? left.sortOrder : Infinity;
  const rightOrder = Number.isFinite(right.sortOrder)
    ? right.sortOrder
    : Infinity;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.id - right.id;
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function getJourneyTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}

function getJourneyDescription(description: string | null | undefined) {
  const trimmedDescription =
    typeof description === "string" ? description.trim() : "";

  if (!trimmedDescription) {
    return "Journey description is not available yet.";
  }

  return trimmedDescription;
}

function getPublicationStatusLabel(status: number | null | undefined) {
  if (status === 1) {
    return "Active";
  }

  if (status === 0) {
    return "Inactive";
  }

  return "Unknown";
}

function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? value;
}

function normalizeJourneyCategoryValue(value: string | null | undefined) {
  const normalizedValue = normalizeCategory(value);

  return (
    JOURNEY_CATEGORY_OPTIONS.find((option) => option.label === normalizedValue)
      ?.key ?? normalizedValue
  );
}

function parseDraftCoordinates(
  draft: Pick<JourneyEditDraft, "latitude" | "longitude">,
) {
  const latitude = Number(draft.latitude.trim());
  const longitude = Number(draft.longitude.trim());

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function buildCoordinateSummary(latitude: string, longitude: string) {
  const parsedCoordinates = parseDraftCoordinates({ latitude, longitude });

  if (!parsedCoordinates) {
    return "Add latitude and longitude manually or place a marker on the map.";
  }

  return `${parsedCoordinates.latitude.toFixed(6)}, ${parsedCoordinates.longitude.toFixed(6)}`;
}

function buildSelectedCoordinateFeatureCollection(
  selectedCoordinates: CoordinateSelection | null,
) {
  if (!selectedCoordinates) {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [
            selectedCoordinates.longitude,
            selectedCoordinates.latitude,
          ] as [number, number],
        },
      },
    ],
  };
}

function formatDifficulty(difficulty: number | null | undefined) {
  if (!Number.isFinite(difficulty)) {
    return "?";
  }

  return String(Math.max(1, Math.round(Number(difficulty))));
}

function formatWholeNumber(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "Unknown";
  }

  return String(Math.round(Number(value)));
}

function formatCoordinate(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "Unknown";
  }

  return Number(value).toFixed(6);
}

function formatDraftRouteDistance(rawValue: string) {
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return "Route length unknown";
  }

  return formatRouteDistance(parsedValue);
}

function getRawValue(value: string | null | undefined) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return "Unknown";
  }

  return trimmedValue;
}

function getMultilineValue(
  value: unknown,
  emptyValueText: string,
) {
  const trimmedValue = normalizeOptionalText(value).trim();

  if (!trimmedValue) {
    return emptyValueText;
  }

  return trimmedValue;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function normalizeTraitName(value: unknown) {
  return normalizeOptionalText(value).trim();
}

function normalizeTraitList(traits: string[] | JourneyTrait[] | undefined) {
  if (!traits || traits.length === 0) {
    return [];
  }

  const normalizedTraits: string[] = [];
  const seenTraits = new Set<string>();

  for (const trait of traits) {
    const rawName = typeof trait === "string" ? trait : trait?.name;
    const normalizedName = normalizeTraitName(rawName);

    if (!normalizedName) {
      continue;
    }

    const dedupeKey = normalizedName.toLowerCase();

    if (seenTraits.has(dedupeKey)) {
      continue;
    }

    seenTraits.add(dedupeKey);
    normalizedTraits.push(normalizedName);
  }

  return normalizedTraits;
}

type AdminJourneyDetailsColors = ReturnType<
  typeof getAdminJourneyDetailsColors
>;
type AdminJourneyDetailsStyles = ReturnType<typeof createStyles>;

function getAdminJourneyDetailsColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      elevatedSurface: "#111827",
      border: "#1E293B",
      stateBorder: "#1E293B",
      shadow: "#020617",
      title: "#F8FAFC",
      body: "#E2E8F0",
      muted: "#94A3B8",
      subtle: "#CBD5E1",
      accent: ACTIVE_STATE_ACCENT,
      inputBackground: "#111827",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#94A3B8",
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      stopBadgeBackground: activeStateColors.softBackground,
      stopBadgeText: ACTIVE_STATE_ACCENT,
      primaryActionBackground: "#115E59",
      primaryActionText: "#FFFFFF",
      secondaryActionBorder: "#334155",
      secondaryActionBackground: "#111827",
      secondaryActionText: "#E2E8F0",
      editButtonBackground: "#111827",
      editButtonBorder: "#334155",
      editButtonText: "#E2E8F0",
      secondaryPillBackground: "#111827",
      secondaryPillBorder: "#334155",
      secondaryPillText: "#E2E8F0",
      modalBackground: "#020617",
      mapFrameBackground: "#0B1220",
    };
  }

  return {
    background: "#F4EFE6",
    surface: "#FEFCF8",
    elevatedSurface: "#FFFFFF",
    border: "#E7E1D7",
    stateBorder: "#CFE6E2",
    shadow: "#1E293B",
    title: "#0F172A",
    body: "#334155",
    muted: "#64748B",
    subtle: "#475569",
    accent: ACTIVE_STATE_ACCENT,
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    inputText: "#0F172A",
    inputPlaceholder: "#94A3B8",
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    stopBadgeBackground: activeStateColors.softBackground,
    stopBadgeText: ACTIVE_STATE_ACCENT,
    primaryActionBackground: "#0F766E",
    primaryActionText: "#FFFFFF",
    secondaryActionBorder: "#CBD5E1",
    secondaryActionBackground: "#FFFFFF",
    secondaryActionText: "#334155",
    editButtonBackground: "#FFFFFF",
    editButtonBorder: "#CBD5E1",
    editButtonText: "#334155",
    secondaryPillBackground: "#FFFFFF",
    secondaryPillBorder: "#CBD5E1",
    secondaryPillText: "#334155",
    modalBackground: "#F4EFE6",
    mapFrameBackground: "#E2E8F0",
  };
}

function createStyles(colors: AdminJourneyDetailsColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    stateCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.stateBorder,
      backgroundColor: colors.surface,
      padding: 20,
    },
    stateTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    stateCopy: {
      marginTop: 8,
      color: colors.subtle,
      fontSize: 15,
      lineHeight: 22,
    },
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    heroImage: {
      width: "100%",
      height: 240,
    },
    heroCopy: {
      padding: 22,
      gap: 10,
    },
    heroHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    editButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.editButtonBorder,
      backgroundColor: colors.editButtonBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    editButtonPressed: {
      opacity: 0.82,
    },
    editButtonDisabled: {
      opacity: 0.58,
    },
    editButtonText: {
      color: colors.editButtonText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    journeyTitle: {
      color: colors.title,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    titleInput: {
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 32,
    },
    journeyMeta: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    journeySubcopy: {
      color: colors.subtle,
      fontSize: 14,
      fontWeight: "600",
    },
    editingHint: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    detailsCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 14,
    },
    sectionLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    description: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 23,
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricChip: {
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    metricChipText: {
      color: colors.chipText,
      fontSize: 13,
      fontWeight: "600",
    },
    metadataRow: {
      gap: 6,
    },
    metadataLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metadataValue: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    metadataValueMultiline: {
      flexShrink: 1,
    },
    emptyStateCopy: {
      color: colors.subtle,
      fontSize: 15,
      lineHeight: 22,
    },
    textInput: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    multilineInput: {
      minHeight: 104,
      lineHeight: 22,
      paddingTop: 12,
      paddingBottom: 12,
    },
    traitsEditorGroup: {
      gap: 12,
    },
    traitInputRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    traitInput: {
      flex: 1,
    },
    traitsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    traitChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingLeft: 12,
      paddingRight: 8,
      paddingVertical: 8,
    },
    traitChipText: {
      color: colors.chipText,
      fontSize: 14,
      fontWeight: "600",
    },
    traitRemoveButton: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
    },
    traitRemoveButtonPressed: {
      opacity: 0.84,
    },
    traitRemoveButtonDisabled: {
      opacity: 0.52,
    },
    traitRemoveButtonText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 15,
      textTransform: "uppercase",
    },
    traitAddButton: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.primaryActionBackground,
      paddingHorizontal: 16,
    },
    traitAddButtonPressed: {
      opacity: 0.88,
    },
    traitAddButtonDisabled: {
      opacity: 0.56,
    },
    traitAddButtonText: {
      color: colors.primaryActionText,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    selectButton: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    selectButtonOpen: {
      borderColor: colors.accent,
    },
    selectButtonPressed: {
      opacity: 0.86,
    },
    selectButtonText: {
      flex: 1,
      color: colors.inputText,
      fontSize: 15,
    },
    selectButtonChevron: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
    },
    selectMenu: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      overflow: "hidden",
    },
    selectOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectOptionSelected: {
      backgroundColor: colors.chipBackground,
    },
    selectOptionPressed: {
      opacity: 0.86,
    },
    selectOptionText: {
      color: colors.inputText,
      fontSize: 15,
      fontWeight: "500",
    },
    selectOptionTextSelected: {
      color: colors.accent,
      fontWeight: "700",
    },
    coordinateSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    coordinateSummaryText: {
      flex: 1,
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    inlineButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    inlineButtonPressed: {
      opacity: 0.86,
    },
    inlineButtonText: {
      color: colors.secondaryActionText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    secondaryPillButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondaryPillBorder,
      backgroundColor: colors.secondaryPillBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    secondaryPillButtonPressed: {
      opacity: 0.82,
    },
    secondaryPillButtonText: {
      color: colors.secondaryPillText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    stopList: {
      gap: 12,
    },
    stopCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevatedSurface,
      padding: 14,
    },
    stopIndexBadge: {
      width: 30,
      height: 30,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.stopBadgeBackground,
    },
    stopIndexBadgeText: {
      color: colors.stopBadgeText,
      fontSize: 13,
      fontWeight: "700",
    },
    stopCopy: {
      flex: 1,
      gap: 6,
    },
    stopTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    stopMeta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    stopDescription: {
      color: colors.subtle,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyCopy: {
      color: colors.subtle,
      fontSize: 15,
      lineHeight: 22,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      paddingBottom: 12,
    },
    actionButton: {
      flexGrow: 1,
      minWidth: 120,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    actionIconButton: {
      flexGrow: 0,
      minWidth: 52,
      paddingHorizontal: 0,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primaryActionBackground,
    },
    actionButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
    },
    actionButtonTextPrimary: {
      color: colors.primaryActionText,
    },
    actionButtonTextSecondary: {
      color: colors.secondaryActionText,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.modalBackground,
      padding: 20,
      gap: 14,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 20,
    },
    modalTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
    },
    modalCopy: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    mapFrame: {
      flex: 1,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.mapFrameBackground,
      minHeight: 320,
    },
    map: {
      flex: 1,
    },
    modalFooter: {
      gap: 14,
      paddingBottom: 12,
    },
  });
}
