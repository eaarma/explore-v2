import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AdminLocationImageManager } from "@/src/features/admin/components/AdminLocationImageManager";
import {
  LOCATION_CATEGORY_OPTIONS,
  LOCATION_STATUS_OPTIONS,
  normalizeOptionalText,
  normalizeTraitList,
  normalizeTraitName,
  type LocationEditDraft,
} from "@/src/features/admin/utils/adminLocationDetailsModel";
import {
  type AdminLocationDetailsColors,
  type AdminLocationDetailsStyles,
} from "@/src/features/admin/utils/adminLocationDetailsTheme";
import { type LocationTrait } from "@/src/features/locations/types/locationTypes";

type AdminLocationHeroSectionProps = {
  locationId: number;
  categoryLabel: string;
  editableValues: LocationEditDraft;
  locationStatusLabel: string;
  publicationStatusLabel: string;
  isEditing: boolean;
  isSaving: boolean;
  colors: AdminLocationDetailsColors;
  styles: AdminLocationDetailsStyles;
  onChangeImageDrafts: Parameters<typeof AdminLocationImageManager>[0]["onChangeImageDrafts"];
  onEditPress: () => void;
  onChangeTitle: (value: string) => void;
};

export function AdminLocationHeroSection({
  locationId,
  categoryLabel,
  editableValues,
  locationStatusLabel,
  publicationStatusLabel,
  isEditing,
  isSaving,
  colors,
  styles,
  onChangeImageDrafts,
  onEditPress,
  onChangeTitle,
}: AdminLocationHeroSectionProps) {
  return (
    <View style={styles.heroCard}>
      <AdminLocationImageManager
        locationId={locationId}
        categoryLabel={categoryLabel}
        imageDrafts={editableValues.imageDrafts}
        isEditing={isEditing}
        isDisabled={isSaving}
        colors={colors}
        onChangeImageDrafts={onChangeImageDrafts}
      />

      <View style={styles.heroCopy}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.eyebrow}>Admin location</Text>

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
            placeholder="Location title"
            placeholderTextColor={colors.inputPlaceholder}
          />
        ) : (
          <Text style={styles.locationTitle}>{editableValues.title}</Text>
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
            <Text style={styles.metricChipText}>ID {locationId}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>{publicationStatusLabel}</Text>
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
  );
}

type AdminLocationDescriptionSectionProps = {
  description: string;
  isEditing: boolean;
  styles: AdminLocationDetailsStyles;
  placeholderTextColor: string;
  onChangeDescription: (value: string) => void;
};

export function AdminLocationDescriptionSection({
  description,
  isEditing,
  styles,
  placeholderTextColor,
  onChangeDescription,
}: AdminLocationDescriptionSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Description</Text>
      {isEditing ? (
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Description"
          placeholderTextColor={placeholderTextColor}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <Text style={styles.locationDescription}>
          {description || "No description provided."}
        </Text>
      )}
    </View>
  );
}

type AdminLocationCoordinatesSectionProps = {
  latitude: string;
  longitude: string;
  coordinateSummary: string;
  isEditing: boolean;
  styles: AdminLocationDetailsStyles;
  placeholderTextColor: string;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  onOpenMapPicker: () => void;
};

export function AdminLocationCoordinatesSection({
  latitude,
  longitude,
  coordinateSummary,
  isEditing,
  styles,
  placeholderTextColor,
  onChangeLatitude,
  onChangeLongitude,
  onOpenMapPicker,
}: AdminLocationCoordinatesSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Coordinates</Text>
      {isEditing ? (
        <>
          <EditableField
            label="Latitude"
            value={latitude}
            onChangeText={onChangeLatitude}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Longitude"
            value={longitude}
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
        </>
      ) : (
        <>
          <MetadataRow label="Latitude" value={latitude} styles={styles} />
          <MetadataRow label="Longitude" value={longitude} styles={styles} />
        </>
      )}
    </View>
  );
}

type AdminLocationMetadataSectionProps = {
  title: string;
  county: string;
  category: string;
  status: string;
  difficulty: string;
  experience: string;
  notes: string;
  publicationStatusLabel: string;
  isEditing: boolean;
  isCategoryMenuOpen: boolean;
  isStatusMenuOpen: boolean;
  styles: AdminLocationDetailsStyles;
  placeholderTextColor: string;
  onChangeCounty: (value: string) => void;
  onChangeDifficulty: (value: string) => void;
  onChangeExperience: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onToggleCategoryMenu: () => void;
  onSelectCategory: (value: string) => void;
  onToggleStatusMenu: () => void;
  onSelectStatus: (value: string) => void;
};

export function AdminLocationMetadataSection({
  title,
  county,
  category,
  status,
  difficulty,
  experience,
  notes,
  publicationStatusLabel,
  isEditing,
  isCategoryMenuOpen,
  isStatusMenuOpen,
  styles,
  placeholderTextColor,
  onChangeCounty,
  onChangeDifficulty,
  onChangeExperience,
  onChangeNotes,
  onToggleCategoryMenu,
  onSelectCategory,
  onToggleStatusMenu,
  onSelectStatus,
}: AdminLocationMetadataSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Location metadata</Text>
      {isEditing ? (
        <>
          <EditableField
            label="County"
            value={county}
            onChangeText={onChangeCounty}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
          />
          <EditableSelectField
            label="Category"
            value={category}
            options={LOCATION_CATEGORY_OPTIONS}
            isOpen={isCategoryMenuOpen}
            onToggle={onToggleCategoryMenu}
            onSelect={onSelectCategory}
            styles={styles}
          />
          <EditableSelectField
            label="Status"
            value={status}
            options={LOCATION_STATUS_OPTIONS}
            isOpen={isStatusMenuOpen}
            onToggle={onToggleStatusMenu}
            onSelect={onSelectStatus}
            styles={styles}
          />
          <EditableField
            label="Difficulty"
            value={difficulty}
            onChangeText={onChangeDifficulty}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="number-pad"
          />
          <EditableField
            label="Experience"
            value={experience}
            onChangeText={onChangeExperience}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            keyboardType="number-pad"
          />
          <EditableField
            label="Note"
            value={notes}
            onChangeText={onChangeNotes}
            styles={styles}
            placeholderTextColor={placeholderTextColor}
            multiline
          />
        </>
      ) : (
        <>
          <MetadataRow label="Title" value={title} styles={styles} />
          <MetadataRow label="County" value={county} styles={styles} />
          <MetadataRow label="Category" value={category} styles={styles} />
          <MetadataRow
            label="Status"
            value={`${publicationStatusLabel} (${status})`}
            styles={styles}
          />
          <MetadataRow
            label="Difficulty"
            value={difficulty}
            styles={styles}
          />
          <MetadataRow
            label="Experience"
            value={experience}
            styles={styles}
          />
          <MetadataRow
            label="Note"
            value={getMultilineTextValue(notes, "No note added.")}
            styles={styles}
            multiline
          />
        </>
      )}
    </View>
  );
}

type AdminLocationTraitsSectionProps = {
  traits: string[];
  isEditing: boolean;
  isSaving: boolean;
  styles: AdminLocationDetailsStyles;
  placeholderTextColor: string;
  onChangeTraits: (traits: string[]) => void;
};

export function AdminLocationTraitsSection({
  traits,
  isEditing,
  isSaving,
  styles,
  placeholderTextColor,
  onChangeTraits,
}: AdminLocationTraitsSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Traits</Text>
      {isEditing ? (
        <LocationTraitsEditor
          traits={traits}
          isDisabled={isSaving}
          placeholderTextColor={placeholderTextColor}
          styles={styles}
          onChangeTraits={onChangeTraits}
        />
      ) : (
        <LocationTraitBubbles traits={traits} styles={styles} />
      )}
    </View>
  );
}

type AdminLocationTimestampsSectionProps = {
  createdAt: string;
  updatedAt: string;
  styles: AdminLocationDetailsStyles;
};

export function AdminLocationTimestampsSection({
  createdAt,
  updatedAt,
  styles,
}: AdminLocationTimestampsSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Timestamps</Text>
      <MetadataRow
        label="Created at"
        value={formatDateTime(createdAt)}
        styles={styles}
      />
      <MetadataRow
        label="Updated at"
        value={formatDateTime(updatedAt)}
        styles={styles}
      />
    </View>
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

function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? "Select";
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
