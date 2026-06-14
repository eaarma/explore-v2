import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, Text, TextInput, View } from "react-native";

import { AdminJourneyLocationEditor } from "@/src/features/admin/components/AdminJourneyLocationEditor";
import {
  formatCoordinate,
  formatDifficulty,
  formatDraftRouteDistance,
  formatWholeNumber,
  getJourneyDescription,
  getJourneyTitle,
  getMultilineValue,
  getRawValue,
  JOURNEY_CATEGORY_OPTIONS,
  JOURNEY_STATUS_OPTIONS,
  normalizeCounty,
  normalizeTraitList,
  normalizeTraitName,
  type JourneyEditDraft,
} from "@/src/features/admin/utils/adminJourneyDetailsModel";
import {
  type AdminJourneyDetailsColors,
  type AdminJourneyDetailsStyles,
} from "@/src/features/admin/utils/adminJourneyDetailsTheme";
import { formatStopCount } from "@/src/features/journeys/components/journeysSectionShared";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type JourneyTrait } from "@/src/features/journeys/types/journeyTypes";
import { type Location } from "@/src/features/locations/types/locationTypes";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";

type AdminJourneyHeroSectionProps = {
  journeyId: number;
  imageUrl: string | null;
  categoryLabel: string;
  editableValues: JourneyEditDraft;
  displayedJourneyLocations: JourneyLocation[];
  publicationStatusLabel: string;
  completionLabel: string;
  isEditing: boolean;
  isSaving: boolean;
  colors: AdminJourneyDetailsColors;
  styles: AdminJourneyDetailsStyles;
  onEditPress: () => void;
  onChangeTitle: (value: string) => void;
};

export function AdminJourneyHeroSection({
  journeyId,
  imageUrl,
  categoryLabel,
  editableValues,
  displayedJourneyLocations,
  publicationStatusLabel,
  completionLabel,
  isEditing,
  isSaving,
  colors,
  styles,
  onEditPress,
  onChangeTitle,
}: AdminJourneyHeroSectionProps) {
  return (
    <View style={styles.heroCard}>
      <AdminJourneyHeroMedia
        imageUrl={imageUrl}
        categoryLabel={categoryLabel}
        styles={styles}
      />

      <View style={styles.heroCopy}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.eyebrow}>Admin journey</Text>

          <Pressable
            onPress={onEditPress}
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
            onChangeText={onChangeTitle}
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
          {formatStopCount(displayedJourneyLocations.length)} | {completionLabel}
        </Text>

        {isEditing ? (
          <Text style={styles.editingHint}>
            Update the fields below and save when you are ready.
          </Text>
        ) : null}

        <View style={styles.metricRow}>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>ID {journeyId}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>{publicationStatusLabel}</Text>
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
  );
}

type AdminJourneyOverviewSectionProps = {
  description: string;
  isEditing: boolean;
  styles: AdminJourneyDetailsStyles;
  placeholderTextColor: string;
  onChangeDescription: (value: string) => void;
};

export function AdminJourneyOverviewSection({
  description,
  isEditing,
  styles,
  placeholderTextColor,
  onChangeDescription,
}: AdminJourneyOverviewSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Overview</Text>
      {isEditing ? (
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Journey description"
          placeholderTextColor={placeholderTextColor}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <Text style={styles.description}>{getJourneyDescription(description)}</Text>
      )}
    </View>
  );
}

type AdminJourneyAtAGlanceSectionProps = {
  distance: string;
  difficulty: string;
  stopCount: number;
  county: string;
  categoryLabel: string;
  completionLabel: string;
  styles: AdminJourneyDetailsStyles;
};

export function AdminJourneyAtAGlanceSection({
  distance,
  difficulty,
  stopCount,
  county,
  categoryLabel,
  completionLabel,
  styles,
}: AdminJourneyAtAGlanceSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>At a glance</Text>

      <View style={styles.metricRow}>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>
            {formatDraftRouteDistance(distance)}
          </Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>Difficulty {difficulty || "?"}</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>{formatStopCount(stopCount)}</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricChipText}>
            {county || "Unknown county"}
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
  );
}

type AdminJourneyMetadataSectionProps = {
  editableValues: JourneyEditDraft;
  rawJourney: {
    title: string | null | undefined;
    county: string | null | undefined;
    category: string | null | undefined;
    status: number | null | undefined;
    distance: number | null | undefined;
    difficulty: number | null | undefined;
    experience: number | null | undefined;
    notes: unknown;
    latitude: number | null | undefined;
    longitude: number | null | undefined;
    polyline: unknown;
  };
  categoryLabel: string;
  publicationStatusLabel: string;
  coordinateSummary: string;
  isEditing: boolean;
  isCategoryMenuOpen: boolean;
  isStatusMenuOpen: boolean;
  styles: AdminJourneyDetailsStyles;
  placeholderTextColor: string;
  onChangeCounty: (value: string) => void;
  onChangeDistance: (value: string) => void;
  onChangeDifficulty: (value: string) => void;
  onChangeExperience: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  onChangePolyline: (value: string) => void;
  onToggleCategoryMenu: () => void;
  onSelectCategory: (value: string) => void;
  onToggleStatusMenu: () => void;
  onSelectStatus: (value: string) => void;
  onOpenMapPicker: () => void;
};

export function AdminJourneyMetadataSection({
  editableValues,
  rawJourney,
  categoryLabel,
  publicationStatusLabel,
  coordinateSummary,
  isEditing,
  isCategoryMenuOpen,
  isStatusMenuOpen,
  styles,
  placeholderTextColor,
  onChangeCounty,
  onChangeDistance,
  onChangeDifficulty,
  onChangeExperience,
  onChangeNotes,
  onChangeLatitude,
  onChangeLongitude,
  onChangePolyline,
  onToggleCategoryMenu,
  onSelectCategory,
  onToggleStatusMenu,
  onSelectStatus,
  onOpenMapPicker,
}: AdminJourneyMetadataSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Journey metadata</Text>

      {isEditing ? (
        <>
          <EditableField
            label="County"
            value={editableValues.county}
            onChangeText={onChangeCounty}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
          />
          <EditableSelectField
            label="Category"
            value={editableValues.category}
            options={JOURNEY_CATEGORY_OPTIONS}
            isOpen={isCategoryMenuOpen}
            onToggle={onToggleCategoryMenu}
            onSelect={onSelectCategory}
            styles={styles}
          />
          <EditableSelectField
            label="Status"
            value={editableValues.status}
            options={JOURNEY_STATUS_OPTIONS}
            isOpen={isStatusMenuOpen}
            onToggle={onToggleStatusMenu}
            onSelect={onSelectStatus}
            styles={styles}
          />
          <EditableField
            label="Distance"
            value={editableValues.distance}
            onChangeText={onChangeDistance}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Difficulty"
            value={editableValues.difficulty}
            onChangeText={onChangeDifficulty}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="number-pad"
          />
          <EditableField
            label="Experience"
            value={editableValues.experience}
            onChangeText={onChangeExperience}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="number-pad"
          />
          <EditableField
            label="Note"
            value={editableValues.notes}
            onChangeText={onChangeNotes}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            multiline
          />
          <EditableField
            label="Latitude"
            value={editableValues.latitude}
            onChangeText={onChangeLatitude}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Longitude"
            value={editableValues.longitude}
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
            value={editableValues.polyline}
            onChangeText={onChangePolyline}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            multiline
          />
        </>
      ) : (
        <>
          <MetadataRow
            label="Title"
            value={getJourneyTitle(rawJourney.title)}
            styles={styles}
          />
          <MetadataRow
            label="County"
            value={normalizeCounty(rawJourney.county)}
            styles={styles}
          />
          <MetadataRow
            label="Category"
            value={categoryLabel}
            styles={styles}
          />
          <MetadataRow
            label="Raw category"
            value={getRawValue(rawJourney.category)}
            styles={styles}
          />
          <MetadataRow
            label="Publication status"
            value={publicationStatusLabel}
            styles={styles}
          />
          <MetadataRow
            label="Status code"
            value={String(rawJourney.status ?? "")}
            styles={styles}
          />
          <MetadataRow
            label="Distance"
            value={formatDraftRouteDistance(String(rawJourney.distance ?? ""))}
            styles={styles}
          />
          <MetadataRow
            label="Difficulty"
            value={formatDifficulty(rawJourney.difficulty)}
            styles={styles}
          />
          <MetadataRow
            label="Experience"
            value={formatWholeNumber(rawJourney.experience)}
            styles={styles}
          />
          <MetadataRow
            label="Note"
            value={getMultilineValue(rawJourney.notes, "No note added.")}
            styles={styles}
            multiline
          />
          <MetadataRow
            label="Latitude"
            value={formatCoordinate(rawJourney.latitude)}
            styles={styles}
          />
          <MetadataRow
            label="Longitude"
            value={formatCoordinate(rawJourney.longitude)}
            styles={styles}
          />
          <MetadataRow
            label="Polyline"
            value={getMultilineValue(
              rawJourney.polyline,
              "No route polyline saved.",
            )}
            styles={styles}
            multiline
          />
        </>
      )}
    </View>
  );
}

type AdminJourneyTraitsSectionProps = {
  traits: string[];
  isEditing: boolean;
  isSaving: boolean;
  styles: AdminJourneyDetailsStyles;
  placeholderTextColor: string;
  onChangeTraits: (traits: string[]) => void;
};

export function AdminJourneyTraitsSection({
  traits,
  isEditing,
  isSaving,
  styles,
  placeholderTextColor,
  onChangeTraits,
}: AdminJourneyTraitsSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionLabel}>Traits</Text>

      {isEditing ? (
        <JourneyTraitsEditor
          traits={traits}
          isDisabled={isSaving}
          placeholderTextColor={placeholderTextColor}
          styles={styles}
          onChangeTraits={onChangeTraits}
        />
      ) : (
        <JourneyTraitBubbles traits={traits} styles={styles} />
      )}
    </View>
  );
}

type AdminJourneyRouteSectionProps = {
  availableLocations: Location[];
  availableLocationsError: string | null;
  isEditing: boolean;
  isLoadingAvailableLocations: boolean;
  isSaving: boolean;
  journeyId: number;
  locations: JourneyLocation[];
  styles: AdminJourneyDetailsStyles;
  onLocationsChange: (locations: JourneyLocation[] | null) => void;
  onRequestAvailableLocations: () => void;
};

export function AdminJourneyRouteSection({
  availableLocations,
  availableLocationsError,
  isEditing,
  isLoadingAvailableLocations,
  isSaving,
  journeyId,
  locations,
  styles,
  onLocationsChange,
  onRequestAvailableLocations,
}: AdminJourneyRouteSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <AdminJourneyLocationEditor
        availableLocations={availableLocations}
        availableLocationsError={availableLocationsError}
        isEditing={isEditing}
        isLoadingAvailableLocations={isLoadingAvailableLocations}
        isSaving={isSaving}
        journeyId={journeyId}
        locations={locations}
        onLocationsChange={onLocationsChange}
        onRequestAvailableLocations={onRequestAvailableLocations}
      />
    </View>
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
      (trait) =>
        trait.trim().toLowerCase() === normalizedNextTrait.toLowerCase(),
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

function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? value;
}
