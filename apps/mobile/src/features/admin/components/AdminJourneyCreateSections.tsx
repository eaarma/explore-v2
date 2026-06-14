import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, Text, TextInput, View } from "react-native";

import { AdminJourneyLocationEditor } from "@/src/features/admin/components/AdminJourneyLocationEditor";
import {
  formatDraftRouteDistance,
  formatJourneyCreateStopCount,
  getSelectOptionLabel,
  JOURNEY_CATEGORY_OPTIONS,
  JOURNEY_STATUS_OPTIONS,
  normalizeTraitName,
  type JourneyCreateDraft,
} from "@/src/features/admin/utils/adminJourneyCreateModel";
import {
  type AdminJourneyCreateStyles,
} from "@/src/features/admin/utils/adminJourneyCreateTheme";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";

type AdminJourneyCreateHeroSectionProps = {
  draft: JourneyCreateDraft;
  previewImageUrl: string | null;
  categoryLabel: string;
  publicationStatusLabel: string;
  routeStopCount: number;
  styles: AdminJourneyCreateStyles;
  placeholderTextColor: string;
  onChangeTitle: (value: string) => void;
};

export function AdminJourneyCreateHeroSection({
  draft,
  previewImageUrl,
  categoryLabel,
  publicationStatusLabel,
  routeStopCount,
  styles,
  placeholderTextColor,
  onChangeTitle,
}: AdminJourneyCreateHeroSectionProps) {
  return (
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
          onChangeText={onChangeTitle}
          style={[styles.textInput, styles.titleInput]}
          placeholder="Journey title"
          placeholderTextColor={placeholderTextColor}
        />

        <Text style={styles.journeyMeta}>
          {draft.county.trim() || "Unknown county"} | {categoryLabel}
        </Text>
        <Text style={styles.journeySubcopy}>
          {formatDraftRouteDistance(draft.distance)} |{" "}
          {formatJourneyCreateStopCount(routeStopCount)} |{" "}
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
              {formatJourneyCreateStopCount(routeStopCount)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type AdminJourneyCreateOverviewSectionProps = {
  description: string;
  styles: AdminJourneyCreateStyles;
  placeholderTextColor: string;
  onChangeDescription: (value: string) => void;
};

export function AdminJourneyCreateOverviewSection({
  description,
  styles,
  placeholderTextColor,
  onChangeDescription,
}: AdminJourneyCreateOverviewSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Overview</Text>
      <TextInput
        value={description}
        onChangeText={onChangeDescription}
        style={[styles.textInput, styles.multilineInput]}
        placeholder="Journey description"
        placeholderTextColor={placeholderTextColor}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

type AdminJourneyCreateAtAGlanceSectionProps = {
  draft: JourneyCreateDraft;
  categoryLabel: string;
  publicationStatusLabel: string;
  routeStopCount: number;
  styles: AdminJourneyCreateStyles;
};

export function AdminJourneyCreateAtAGlanceSection({
  draft,
  categoryLabel,
  publicationStatusLabel,
  routeStopCount,
  styles,
}: AdminJourneyCreateAtAGlanceSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>At a glance</Text>

      <View style={styles.metricRow}>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>
            {formatDraftRouteDistance(draft.distance)}
          </Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>Difficulty {draft.difficulty}</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>
            {formatJourneyCreateStopCount(routeStopCount)}
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
  );
}

type AdminJourneyCreateMetadataSectionProps = {
  draft: JourneyCreateDraft;
  isCategoryMenuOpen: boolean;
  isStatusMenuOpen: boolean;
  coordinateSummary: string;
  styles: AdminJourneyCreateStyles;
  placeholderTextColor: string;
  onChangeCounty: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onToggleCategoryMenu: () => void;
  onChangeStatus: (value: string) => void;
  onToggleStatusMenu: () => void;
  onChangeDistance: (value: string) => void;
  onChangeDifficulty: (value: string) => void;
  onChangeExperience: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  onOpenMapPicker: () => void;
  onChangePolyline: (value: string) => void;
};

export function AdminJourneyCreateMetadataSection({
  draft,
  isCategoryMenuOpen,
  isStatusMenuOpen,
  coordinateSummary,
  styles,
  placeholderTextColor,
  onChangeCounty,
  onChangeCategory,
  onToggleCategoryMenu,
  onChangeStatus,
  onToggleStatusMenu,
  onChangeDistance,
  onChangeDifficulty,
  onChangeExperience,
  onChangeNotes,
  onChangeLatitude,
  onChangeLongitude,
  onOpenMapPicker,
  onChangePolyline,
}: AdminJourneyCreateMetadataSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Journey metadata</Text>

      <EditableField
        label="County"
        value={draft.county}
        onChangeText={onChangeCounty}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
      />
      <EditableSelectField
        label="Category"
        value={draft.category}
        options={JOURNEY_CATEGORY_OPTIONS}
        isOpen={isCategoryMenuOpen}
        onToggle={onToggleCategoryMenu}
        onSelect={onChangeCategory}
        styles={styles}
      />
      <EditableSelectField
        label="Status"
        value={draft.status}
        options={JOURNEY_STATUS_OPTIONS}
        isOpen={isStatusMenuOpen}
        onToggle={onToggleStatusMenu}
        onSelect={onChangeStatus}
        styles={styles}
      />
      <EditableField
        label="Distance"
        value={draft.distance}
        onChangeText={onChangeDistance}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        keyboardType="decimal-pad"
      />
      <EditableField
        label="Difficulty"
        value={draft.difficulty}
        onChangeText={onChangeDifficulty}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        keyboardType="number-pad"
      />
      <EditableField
        label="Experience"
        value={draft.experience}
        onChangeText={onChangeExperience}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        keyboardType="number-pad"
      />
      <EditableField
        label="Note"
        value={draft.notes}
        onChangeText={onChangeNotes}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        multiline
      />
      <EditableField
        label="Latitude"
        value={draft.latitude}
        onChangeText={onChangeLatitude}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        keyboardType="decimal-pad"
      />
      <EditableField
        label="Longitude"
        value={draft.longitude}
        onChangeText={onChangeLongitude}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        keyboardType="decimal-pad"
      />
      <View style={styles.coordinateSummaryRow}>
        <Text style={styles.coordinateSummaryText}>{coordinateSummary}</Text>

        <Pressable
          onPress={onOpenMapPicker}
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
        onChangeText={onChangePolyline}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        multiline
      />
    </View>
  );
}

type AdminJourneyCreateTraitsSectionProps = {
  traits: string[];
  isSaving: boolean;
  styles: AdminJourneyCreateStyles;
  placeholderTextColor: string;
  onChangeTraits: (traits: string[]) => void;
};

export function AdminJourneyCreateTraitsSection({
  traits,
  isSaving,
  styles,
  placeholderTextColor,
  onChangeTraits,
}: AdminJourneyCreateTraitsSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Traits</Text>
      <JourneyTraitsEditor
        traits={traits}
        isDisabled={isSaving}
        placeholderTextColor={placeholderTextColor}
        styles={styles}
        onChangeTraits={onChangeTraits}
      />
    </View>
  );
}

type AdminJourneyCreateRouteSectionProps = {
  availableLocations: Location[];
  availableLocationsError: string | null;
  isLoadingAvailableLocations: boolean;
  isSaving: boolean;
  routeDraftLocations: JourneyLocation[];
  styles: AdminJourneyCreateStyles;
  onLocationsChange: (locations: JourneyLocation[]) => void;
  onRequestAvailableLocations: () => void;
};

export function AdminJourneyCreateRouteSection({
  availableLocations,
  availableLocationsError,
  isLoadingAvailableLocations,
  isSaving,
  routeDraftLocations,
  styles,
  onLocationsChange,
  onRequestAvailableLocations,
}: AdminJourneyCreateRouteSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <AdminJourneyLocationEditor
        availableLocations={availableLocations}
        availableLocationsError={availableLocationsError}
        isEditing
        isLoadingAvailableLocations={isLoadingAvailableLocations}
        isSaving={isSaving}
        journeyId={0}
        locations={routeDraftLocations}
        onLocationsChange={onLocationsChange}
        onRequestAvailableLocations={onRequestAvailableLocations}
      />
    </View>
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

type JourneyTraitsEditorProps = {
  traits: string[];
  isDisabled: boolean;
  placeholderTextColor: string;
  styles: AdminJourneyCreateStyles;
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
  traits: string[];
  styles: AdminJourneyCreateStyles;
  onRemoveTrait?: (index: number) => void;
  isDisabled?: boolean;
};

function JourneyTraitBubbles({
  traits,
  styles,
  onRemoveTrait,
  isDisabled = false,
}: JourneyTraitBubblesProps) {
  if (traits.length === 0) {
    return <Text style={styles.emptyStateCopy}>No traits added yet.</Text>;
  }

  return (
    <View style={styles.traitsWrap}>
      {traits.map((trait, index) => (
        <View key={`${trait}-${index}`} style={styles.traitChip}>
          <Text style={styles.traitChipText}>{trait}</Text>

          {onRemoveTrait ? (
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
