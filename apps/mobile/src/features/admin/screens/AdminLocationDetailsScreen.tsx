import { useEffect, useMemo, useState } from "react";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type UpdateAdminLocationRequest,
  updateAdminLocation,
} from "@/src/features/admin/api/adminLocationsApi";
import {
  AdminLocationImageManager,
  type AdminLocationImageDraft,
  createAdminLocationImageDrafts,
  getAdminLocationImages,
  getAdminLocationImageUrls,
  getPrimaryAdminLocationImageUrl,
} from "@/src/features/admin/components/AdminLocationImageManager";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { bootstrapContentCacheIfNeeded } from "@/src/features/content/storage/contentBootstrap";
import { hydrateLocationWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getLocationVisitStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  getActiveLocations,
  getLocationById,
} from "@/src/features/locations/api/locationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import {
  Location,
  type LocationTrait,
} from "@/src/features/locations/types/locationTypes";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import { ACTIVE_STATE_ACCENT } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";
import {
  cacheActiveContent,
  getCachedJourneys,
  getCachedLocations,
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { showLocationOptionsDialog } from "@/src/shared/utils/locationActions";

type LocationEditDraft = {
  title: string;
  description: string;
  county: string;
  category: string;
  latitude: string;
  longitude: string;
  status: string;
  difficulty: string;
  experience: string;
  notes: string;
  traits: string[];
  imageDrafts: AdminLocationImageDraft[];
};

const LOCATION_STATUS_OPTIONS = [
  { key: "1", label: "Active" },
  { key: "0", label: "Inactive" },
  { key: "2", label: "Disabled" },
] as const;

const LOCATION_CATEGORY_OPTIONS = [
  { key: "Nature", label: "Nature" },
  { key: "Urbex", label: "Urbex" },
  { key: "Camping", label: "Camping" },
  { key: "Sightseeing", label: "Sightseeing" },
] as const;

export function AdminLocationDetailsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = useMemo(
    () => getAdminLocationDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
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
      return;
    }

    setDraft(createLocationEditDraft(location));
    setIsEditing(false);
    setIsCategoryMenuOpen(false);
    setIsStatusMenuOpen(false);
  }, [location]);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  if (userRole !== "ADMIN") {
    return <Redirect href="/map" />;
  }

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
      setFormError(null);
      return;
    }

    if (location) {
      setDraft(createLocationEditDraft(location));
      setIsEditing(true);
      setIsCategoryMenuOpen(false);
      setIsStatusMenuOpen(false);
      setFormError(null);
    }
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
        {isLoadingLocation ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin details</Text>
            <Text style={styles.stateCopy}>
              Pulling the location details for the admin screen.
            </Text>
          </View>
        ) : null}

        {!isLoadingLocation && locationError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Location unavailable</Text>
            <Text style={styles.stateCopy}>{locationError}</Text>
          </View>
        ) : null}

        {!isLoadingLocation && !locationError && location && editableValues ? (
          <>
            <View style={styles.heroCard}>
              <AdminLocationImageManager
                locationId={location.id}
                categoryLabel={categoryLabel}
                imageDrafts={editableValues.imageDrafts}
                isEditing={isEditing}
                isDisabled={isSaving}
                colors={themeColors}
                onChangeImageDrafts={updateImageDrafts}
              />

              <View style={styles.heroCopy}>
                <View style={styles.heroHeaderRow}>
                  <Text style={styles.eyebrow}>Admin location</Text>

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
                    placeholder="Location title"
                    placeholderTextColor={themeColors.inputPlaceholder}
                  />
                ) : (
                  <Text style={styles.locationTitle}>
                    {editableValues.title}
                  </Text>
                )}

                <Text style={styles.locationMeta}>
                  {editableValues.county || "Unknown county"} | {categoryLabel}
                </Text>
                <Text style={styles.locationStatus}>{locationStatusLabel}</Text>

                {isEditing ? (
                  <Text style={styles.editingHint}>
                    Update the fields below and save when you are ready.
                  </Text>
                ) : null}

                <View style={styles.metricRow}>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>ID {location.id}</Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      {publicationStatusLabel}
                    </Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      Difficulty {editableValues.difficulty}
                    </Text>
                  </View>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      Experience {editableValues.experience}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              {isEditing ? (
                <TextInput
                  value={editableValues.description}
                  onChangeText={(value) => updateDraft("description", value)}
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor={themeColors.inputPlaceholder}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <Text style={styles.locationDescription}>
                  {location.description || "No description provided."}
                </Text>
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Coordinates</Text>
              {isEditing ? (
                <>
                  <EditableField
                    label="Latitude"
                    value={editableValues.latitude}
                    onChangeText={(value) => updateDraft("latitude", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                    keyboardType="decimal-pad"
                  />
                  <EditableField
                    label="Longitude"
                    value={editableValues.longitude}
                    onChangeText={(value) => updateDraft("longitude", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                    keyboardType="decimal-pad"
                  />
                </>
              ) : (
                <>
                  <MetadataRow
                    label="Latitude"
                    value={String(location.latitude)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Longitude"
                    value={String(location.longitude)}
                    styles={styles}
                  />
                </>
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Location metadata</Text>
              {isEditing ? (
                <>
                  <EditableField
                    label="County"
                    value={editableValues.county}
                    onChangeText={(value) => updateDraft("county", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                  />
                  <EditableSelectField
                    label="Category"
                    value={editableValues.category}
                    options={LOCATION_CATEGORY_OPTIONS}
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
                    options={LOCATION_STATUS_OPTIONS}
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
                    label="Difficulty"
                    value={editableValues.difficulty}
                    onChangeText={(value) => updateDraft("difficulty", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                    keyboardType="number-pad"
                  />
                  <EditableField
                    label="Experience"
                    value={editableValues.experience}
                    onChangeText={(value) => updateDraft("experience", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                    keyboardType="number-pad"
                  />
                  <EditableField
                    label="Note"
                    value={editableValues.notes}
                    onChangeText={(value) => updateDraft("notes", value)}
                    styles={styles}
                    placeholderTextColor={themeColors.inputPlaceholder}
                    multiline
                  />
                </>
              ) : (
                <>
                  <MetadataRow
                    label="Title"
                    value={location.title}
                    styles={styles}
                  />
                  <MetadataRow
                    label="County"
                    value={location.county}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Category"
                    value={categoryLabel}
                    styles={styles}
                  />

                  <MetadataRow
                    label="Status"
                    value={`${publicationStatusLabel} (${location.status})`}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Difficulty"
                    value={String(location.difficulty)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Experience"
                    value={String(location.experience)}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Note"
                    value={getMultilineTextValue(location.notes, "No note added.")}
                    styles={styles}
                    multiline
                  />
                </>
              )}

            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Traits</Text>
              {isEditing ? (
                <LocationTraitsEditor
                  traits={editableValues.traits}
                  isDisabled={isSaving}
                  placeholderTextColor={themeColors.inputPlaceholder}
                  styles={styles}
                  onChangeTraits={(traits) => updateDraft("traits", traits)}
                />
              ) : (
                <LocationTraitBubbles
                  traits={editableValues.traits}
                  styles={styles}
                />
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Timestamps</Text>
              <MetadataRow
                label="Created at"
                value={formatDateTime(location.createdAt)}
                styles={styles}
              />
              <MetadataRow
                label="Updated at"
              value={formatDateTime(location.updatedAt)}
              styles={styles}
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
                        focusLatitude: String(location.latitude),
                        focusLongitude: String(location.longitude),
                        focusAt: String(Date.now()),
                        focusKind: "location",
                        focusItemId: String(location.id),
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
                  accessibilityLabel="More location actions"
                  accessibilityRole="button"
                  onPress={() => showLocationOptionsDialog(location)}
                  style={[
                    styles.actionButton,
                    styles.actionButtonSecondary,
                    styles.actionIconButton,
                  ]}
                >
                  <Ionicons
                    color={themeColors.secondaryActionText}
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
    </>
  );
}

type MetadataRowProps = {
  label: string;
  value: string;
  styles: AdminLocationDetailsStyles;
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
  styles: AdminLocationDetailsStyles;
  placeholderTextColor: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "url";
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
  styles: AdminLocationDetailsStyles;
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

type LocationTraitsEditorProps = {
  traits: string[];
  isDisabled: boolean;
  placeholderTextColor: string;
  styles: AdminLocationDetailsStyles;
  onChangeTraits: (traits: string[]) => void;
};

function LocationTraitsEditor({
  traits,
  isDisabled,
  placeholderTextColor,
  styles,
  onChangeTraits,
}: LocationTraitsEditorProps) {
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
        <LocationTraitBubbles
          traits={traits}
          styles={styles}
          onRemoveTrait={handleRemoveTrait}
          isEditable
          isDisabled={isDisabled}
        />
      ) : (
        <Text style={styles.emptyStateCopy}>
          Add traits like secluded, family-friendly, or steep climb.
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

type LocationTraitBubblesProps = {
  traits: string[] | LocationTrait[] | undefined;
  styles: AdminLocationDetailsStyles;
  onRemoveTrait?: (index: number) => void;
  isEditable?: boolean;
  isDisabled?: boolean;
};

function LocationTraitBubbles({
  traits,
  styles,
  onRemoveTrait,
  isEditable = false,
  isDisabled = false,
}: LocationTraitBubblesProps) {
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

function parseLocationId(value: string | string[] | undefined) {
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

function createLocationEditDraft(location: Location): LocationEditDraft {
  return {
    title: location.title,
    description: location.description,
    county: location.county,
    category: normalizeLocationCategoryValue(location.category),
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    status: String(location.status),
    difficulty: String(location.difficulty),
    experience: String(location.experience),
    notes: normalizeOptionalText(location.notes),
    traits: normalizeTraitList(location.traits),
    imageDrafts: createAdminLocationImageDrafts(
      location.imageUrls,
      location.imageUrl,
    ),
  };
}

function buildLocationUpdatePayload(
  draft: LocationEditDraft,
):
  | { success: true; value: UpdateAdminLocationRequest }
  | { success: false; message: string } {
  if (draft.imageDrafts.some((imageDraft) => imageDraft.uploadState === "uploading")) {
    return {
      success: false,
      message: "Wait for the current image upload to finish before saving.",
    };
  }

  if (draft.imageDrafts.some((imageDraft) => imageDraft.uploadState === "error")) {
    return {
      success: false,
      message: "Remove failed image uploads before saving the location.",
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

  const status = parseLocationStatusValue(draft.status);
  if (!status.success) {
    return status;
  }

  const category = parseLocationCategoryValue(draft.category);
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
      images: getAdminLocationImages(draft.imageDrafts),
      imageUrl: getPrimaryAdminLocationImageUrl(draft.imageDrafts),
      imageUrls: getAdminLocationImageUrls(draft.imageDrafts),
      traits: draft.traits.map((trait) => ({ name: trait })),
      experience: experience.value,
      difficulty: difficulty.value,
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

function parseLocationStatusValue(
  rawValue: string,
): { success: true; value: number } | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (LOCATION_STATUS_OPTIONS.some((option) => option.key === trimmedValue)) {
    return {
      success: true,
      value: Number(trimmedValue),
    };
  }

  return {
    success: false,
    message: "Status must be Active, Inactive, or Disabled.",
  };
}

function parseLocationCategoryValue(
  rawValue: string,
): { success: true; value: string } | { success: false; message: string } {
  const normalizedValue = normalizeLocationCategoryValue(rawValue);

  if (
    LOCATION_CATEGORY_OPTIONS.some((option) => option.key === normalizedValue)
  ) {
    return {
      success: true,
      value: normalizedValue,
    };
  }

  return {
    success: false,
    message: "Category must be Nature, Urbex, Camping, or Sightseeing.",
  };
}

function mergeLocationForAdminView(
  previousLocation: Location,
  savedLocation: Location,
): Location {
  return {
    ...savedLocation,
    discovered: previousLocation.discovered,
    discoveredAt: previousLocation.discoveredAt,
    active: previousLocation.active,
    activeAt: previousLocation.activeAt,
  };
}

function reconcileCachedLocationsAfterAdminSave(
  cachedLocations: Location[],
  nextLocation: Location,
) {
  const locationsWithoutSavedLocation = cachedLocations.filter(
    (cachedLocation) => cachedLocation.id !== nextLocation.id,
  );

  if (nextLocation.status !== 1) {
    return locationsWithoutSavedLocation;
  }

  return [...locationsWithoutSavedLocation, nextLocation];
}

function getPublicationStatusLabel(status: number | null | undefined) {
  if (status === 1) {
    return "Active";
  }

  if (status === 0) {
    return "Inactive";
  }

  if (status === 2) {
    return "Disabled";
  }

  return "Unknown";
}

function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? "Select";
}

function normalizeLocationCategoryValue(value: string | null | undefined) {
  const normalizedValue = normalizeCategory(value);

  return (
    LOCATION_CATEGORY_OPTIONS.find((option) => option.label === normalizedValue)
      ?.key ?? normalizedValue
  );
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
  const normalizedValue = normalizeOptionalText(value).trim();
  return normalizedValue;
}

function normalizeTraitList(traits: string[] | LocationTrait[] | undefined) {
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

function getMultilineTextValue(value: unknown, emptyValueText: string) {
  const normalizedValue = normalizeOptionalText(value).trim();

  if (!normalizedValue) {
    return emptyValueText;
  }

  return normalizedValue;
}

function formatDateTime(value: string) {
  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return new Date(parsedValue).toLocaleString();
}

type AdminLocationDetailsColors = ReturnType<
  typeof getAdminLocationDetailsColors
>;
type AdminLocationDetailsStyles = ReturnType<typeof createStyles>;

function getAdminLocationDetailsColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      border: "#1E293B",
      title: "#F8FAFC",
      body: "#CBD5E1",
      accent: ACTIVE_STATE_ACCENT,
      muted: "#94A3B8",
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
      editButtonBackground: "#111827",
      editButtonBorder: "#334155",
      editButtonText: "#E2E8F0",
    };
  }

  return {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    title: "#0F172A",
    body: "#475569",
    accent: ACTIVE_STATE_ACCENT,
    muted: "#64748B",
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
    editButtonBackground: "#FFFFFF",
    editButtonBorder: "#CBD5E1",
    editButtonText: "#334155",
  };
}

function createStyles(colors: AdminLocationDetailsColors) {
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
      borderColor: colors.border,
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
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 20,
    },
    heroCopy: {
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
    locationTitle: {
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
    locationMeta: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    locationStatus: {
      color: colors.body,
      fontSize: 14,
      fontWeight: "600",
    },
    editingHint: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    locationDescription: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    detailsCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 14,
    },
    sectionTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
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
      color: colors.body,
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
  });
}
