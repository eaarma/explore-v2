import { useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Alert,
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
  createAdminJourney,
  type CreateAdminJourneyRequest,
  replaceAdminJourneyLocations,
} from "@/src/features/admin/api/adminJourneysApi";
import { AdminJourneyLocationEditor } from "@/src/features/admin/components/AdminJourneyLocationEditor";
import { useMapStyle } from "@/src/features/map/hooks/useMapStyle";
import { DEFAULT_MAP_CENTER } from "@/src/features/map/mapConfig";
import { getAllLocations } from "@/src/features/locations/api/locationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  cacheActiveContent,
  cacheJourneyLocations,
  getCachedJourneyLocations,
  getCachedJourneys,
  getCachedLocations,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { formatRouteDistance, formatStopCount } from "@/src/features/journeys/components/journeysSectionShared";
import { type Journey } from "@/src/features/journeys/types/journeyTypes";

type JourneyCreateDraft = {
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

const INITIAL_CREATE_DRAFT: JourneyCreateDraft = {
  title: "",
  description: "",
  county: "",
  category: "Hiking",
  latitude: "",
  longitude: "",
  status: "1",
  experience: "0",
  distance: "0",
  difficulty: "0",
  polyline: "",
  notes: "0",
};

export function AdminJourneyCreateSection() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getAdminJourneyCreateColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      Alert.alert("Invalid fields", payload.message);
      return;
    }

    setIsSaving(true);

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
                createdJourney,
              ),
            }),
            cacheJourneyLocations(
              appendCreatedJourneyLocationsToCache(
                cachedJourneyLocations,
                createdJourney,
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
        Alert.alert("Journey created", routeSaveErrorMessage);
      }

      router.push({
        pathname: "/admin-journey/[journeyId]",
        params: {
          journeyId: String(createdJourney.id),
        },
      });
    } catch (error) {
      Alert.alert(
        "Create failed",
        getApiErrorMessage(
          error,
          "Could not create the journey right now.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <AdminJourneyCreateHeroMedia
            imageUrl={previewImageUrl}
            categoryLabel={categoryLabel}
            styles={styles}
          />

          <View style={styles.heroCopy}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.eyebrow}>Create journey</Text>
            </View>

            <TextInput
              value={draft.title}
              onChangeText={(value) => updateDraft("title", value)}
              style={[styles.textInput, styles.titleInput]}
              placeholder="Journey title"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={styles.journeyMeta}>
              {draft.county.trim() || "Unknown county"} | {categoryLabel}
            </Text>
            <Text style={styles.journeySubcopy}>
              {formatDraftRouteDistance(draft.distance)} |{" "}
              {formatStopCount(routeDraftLocations.length)} |{" "}
              {publicationStatusLabel}
            </Text>

            <View style={styles.metricRow}>
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>{publicationStatusLabel}</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>
                  Difficulty {draft.difficulty}
                </Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>
                  Experience {draft.experience}
                </Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>
                  {formatStopCount(routeDraftLocations.length)}
                </Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>{draft.notes} notes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>Overview</Text>
          <TextInput
            value={draft.description}
            onChangeText={(value) => updateDraft("description", value)}
            style={[styles.textInput, styles.multilineInput]}
            placeholder="Journey description"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>At a glance</Text>

          <View style={styles.metricRow}>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {formatDraftRouteDistance(draft.distance)}
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                Difficulty {draft.difficulty}
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {formatStopCount(routeDraftLocations.length)}
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {draft.county.trim() || "Unknown county"}
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>{categoryLabel}</Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>{publicationStatusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>Journey metadata</Text>

          <EditableField
            label="County"
            value={draft.county}
            onChangeText={(value) => updateDraft("county", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
          />
          <EditableSelectField
            label="Category"
            value={draft.category}
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
            value={draft.status}
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
            value={draft.distance}
            onChangeText={(value) => updateDraft("distance", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Difficulty"
            value={draft.difficulty}
            onChangeText={(value) => updateDraft("difficulty", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
          />
          <EditableField
            label="Experience"
            value={draft.experience}
            onChangeText={(value) => updateDraft("experience", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
          />
          <EditableField
            label="Notes count"
            value={draft.notes}
            onChangeText={(value) => updateDraft("notes", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
          />
          <EditableField
            label="Latitude"
            value={draft.latitude}
            onChangeText={(value) => updateDraft("latitude", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Longitude"
            value={draft.longitude}
            onChangeText={(value) => updateDraft("longitude", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="decimal-pad"
          />
          <View style={styles.coordinateSummaryRow}>
            <Text style={styles.coordinateSummaryText}>
              {buildCoordinateSummary(draft.latitude, draft.longitude)}
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
            value={draft.polyline}
            onChangeText={(value) => updateDraft("polyline", value)}
            styles={styles}
            placeholderTextColor={colors.inputPlaceholder}
            multiline
          />
        </View>

        <View style={styles.detailsCard}>
          <AdminJourneyLocationEditor
            availableLocations={availableLocations}
            availableLocationsError={availableLocationsError}
            isEditing
            isLoadingAvailableLocations={isLoadingAvailableLocations}
            isSaving={isSaving}
            journeyId={0}
            locations={routeDraftLocations}
            onLocationsChange={setRouteDraftLocations}
            onRequestAvailableLocations={() => void loadAvailableLocations()}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => void handleCreateJourney()}
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
              {isSaving ? "Creating..." : "Create journey"}
            </Text>
          </Pressable>

          <Pressable
            onPress={clearForm}
            disabled={isSaving}
            style={[styles.actionButton, styles.actionButtonSecondary]}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextSecondary,
              ]}
            >
              Clear
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <CoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={parseDraftCoordinates(draft)}
        colors={colors}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleConfirmCoordinates}
      />
    </>
  );
}

type AdminJourneyCreateHeroMediaProps = {
  imageUrl: string | null;
  categoryLabel: string;
  styles: AdminJourneyCreateStyles;
};

function AdminJourneyCreateHeroMedia({
  imageUrl,
  categoryLabel,
  styles,
}: AdminJourneyCreateHeroMediaProps) {
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

type EditableFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  styles: AdminJourneyCreateStyles;
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
  styles: AdminJourneyCreateStyles;
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

type CoordinatePickerModalProps = {
  visible: boolean;
  initialCoordinates: CoordinateSelection | null;
  colors: AdminJourneyCreateColors;
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

            <GeoJSONSource id="admin-journey-create-picker-point" data={markerGeoJson}>
              <Layer
                id="admin-journey-create-picker-glow"
                type="circle"
                paint={{
                  "circle-radius": 16,
                  "circle-color": colors.accent,
                  "circle-opacity": 0.22,
                }}
              />
              <Layer
                id="admin-journey-create-picker-dot"
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

function buildCreateJourneyPayload(
  draft: JourneyCreateDraft,
):
  | { success: true; value: CreateAdminJourneyRequest }
  | { success: false; message: string } {
  const title = draft.title.trim();

  if (title.length === 0) {
    return {
      success: false,
      message: "Title is required.",
    };
  }

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

  const category = parseJourneyCategoryValue(draft.category);
  if (!category.success) {
    return category;
  }

  const status = parseJourneyStatusValue(draft.status);
  if (!status.success) {
    return status;
  }

  const difficulty = parseRequiredInteger(draft.difficulty, "Difficulty");
  if (!difficulty.success) {
    return difficulty;
  }

  const experience = parseRequiredInteger(draft.experience, "Experience");
  if (!experience.success) {
    return experience;
  }

  const notes = parseRequiredInteger(draft.notes, "Notes count");
  if (!notes.success) {
    return notes;
  }

  return {
    success: true,
    value: {
      title,
      description: draft.description,
      latitude: latitude.value,
      longitude: longitude.value,
      county: draft.county,
      category: category.value,
      experience: experience.value,
      distance: distance.value,
      difficulty: difficulty.value,
      polyline: draft.polyline,
      notes: notes.value,
      status: status.value,
    },
  };
}

function parseRequiredNumber(
  rawValue: string,
  fieldLabel: string,
):
  | { success: true; value: number }
  | { success: false; message: string } {
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
):
  | { success: true; value: number }
  | { success: false; message: string } {
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
):
  | { success: true; value: number }
  | { success: false; message: string } {
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
):
  | { success: true; value: string }
  | { success: false; message: string } {
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
    JOURNEY_CATEGORY_OPTIONS.find(
      (option) => option.label === normalizedValue,
    )?.key ?? normalizedValue
  );
}

function parseDraftCoordinates(
  draft: Pick<JourneyCreateDraft, "latitude" | "longitude">,
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

function appendCreatedJourneyToActiveCache(
  cachedJourneys: Journey[],
  createdJourney: Journey,
) {
  const journeysWithoutCreatedJourney = cachedJourneys.filter(
    (cachedJourney) => cachedJourney.id !== createdJourney.id,
  );

  if (createdJourney.status !== 1) {
    return journeysWithoutCreatedJourney;
  }

  return [...journeysWithoutCreatedJourney, createdJourney];
}

function appendCreatedJourneyLocationsToCache(
  cachedJourneyLocations: JourneyLocation[],
  createdJourney: Journey,
  createdJourneyLocations: JourneyLocation[],
) {
  const locationsWithoutJourney = cachedJourneyLocations.filter(
    (journeyLocation) => journeyLocation.journeyId !== createdJourney.id,
  );

  if (createdJourney.status !== 1) {
    return locationsWithoutJourney;
  }

  return [...locationsWithoutJourney, ...normalizeJourneyLocationSortOrder(createdJourneyLocations)]
    .sort((left, right) => {
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

function formatDraftRouteDistance(rawValue: string) {
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return "Route length unknown";
  }

  return formatRouteDistance(parsedValue);
}

type AdminJourneyCreateColors = ReturnType<typeof getAdminJourneyCreateColors>;
type AdminJourneyCreateStyles = ReturnType<typeof createStyles>;

function getAdminJourneyCreateColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      border: "#1E293B",
      title: "#F8FAFC",
      body: "#E2E8F0",
      muted: "#94A3B8",
      subtle: "#CBD5E1",
      accent: "#5EEAD4",
      inputBackground: "#111827",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#94A3B8",
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      primaryActionBackground: "#115E59",
      primaryActionText: "#FFFFFF",
      secondaryActionBorder: "#334155",
      secondaryActionBackground: "#111827",
      secondaryActionText: "#E2E8F0",
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
    border: "#E7E1D7",
    title: "#0F172A",
    body: "#334155",
    muted: "#64748B",
    subtle: "#475569",
    accent: "#0F766E",
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    inputText: "#0F172A",
    inputPlaceholder: "#94A3B8",
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    primaryActionBackground: "#0F766E",
    primaryActionText: "#FFFFFF",
    secondaryActionBorder: "#CBD5E1",
    secondaryActionBackground: "#FFFFFF",
    secondaryActionText: "#334155",
    secondaryPillBackground: "#FFFFFF",
    secondaryPillBorder: "#CBD5E1",
    secondaryPillText: "#334155",
    modalBackground: "#F4EFE6",
    mapFrameBackground: "#E2E8F0",
  };
}

function createStyles(colors: AdminJourneyCreateColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      gap: 16,
      paddingBottom: 32,
    },
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      height: 220,
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
    actionRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
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
