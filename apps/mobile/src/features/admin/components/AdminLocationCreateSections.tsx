import { Image } from "expo-image";
import { Pressable, Text, TextInput, View } from "react-native";

import {
  getSelectOptionLabel,
  LOCATION_CATEGORY_OPTIONS,
  LOCATION_STATUS_OPTIONS,
  type LocationCreateDraft,
} from "@/src/features/admin/utils/adminLocationCreateModel";
import { type AdminLocationCreateStyles } from "@/src/features/admin/utils/adminLocationCreateTheme";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";

type AdminLocationCreateHeroSectionProps = {
  draft: LocationCreateDraft;
  imageUrl: string | null;
  categoryLabel: string;
  publicationStatusLabel: string;
  styles: AdminLocationCreateStyles;
  placeholderTextColor: string;
  onChangeTitle: (value: string) => void;
};

export function AdminLocationCreateHeroSection({
  draft,
  imageUrl,
  categoryLabel,
  publicationStatusLabel,
  styles,
  placeholderTextColor,
  onChangeTitle,
}: AdminLocationCreateHeroSectionProps) {
  return (
    <View style={styles.heroCard}>
      <AdminLocationCreateHeroMedia
        imageUrl={imageUrl}
        categoryLabel={categoryLabel}
        styles={styles}
      />

      <View style={styles.heroCopy}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.eyebrow}>Create location</Text>
        </View>

        <TextInput
          value={draft.title}
          onChangeText={onChangeTitle}
          style={[styles.textInput, styles.titleInput]}
          placeholder="Location title"
          placeholderTextColor={placeholderTextColor}
        />

        <Text style={styles.locationMeta}>
          {draft.county.trim() || "Unknown county"} | {categoryLabel}
        </Text>
        <Text style={styles.locationStatus}>{publicationStatusLabel}</Text>

        <View style={styles.metricRow}>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>{publicationStatusLabel}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>Difficulty {draft.difficulty}</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricChipText}>Experience {draft.experience}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type AdminLocationCreateOverviewSectionProps = {
  description: string;
  styles: AdminLocationCreateStyles;
  placeholderTextColor: string;
  onChangeDescription: (value: string) => void;
};

export function AdminLocationCreateOverviewSection({
  description,
  styles,
  placeholderTextColor,
  onChangeDescription,
}: AdminLocationCreateOverviewSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        value={description}
        onChangeText={onChangeDescription}
        style={[styles.textInput, styles.multilineInput]}
        placeholder="Description"
        placeholderTextColor={placeholderTextColor}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

type AdminLocationCreateCoordinatesSectionProps = {
  latitude: string;
  longitude: string;
  coordinateSummary: string;
  styles: AdminLocationCreateStyles;
  placeholderTextColor: string;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  onOpenMapPicker: () => void;
};

export function AdminLocationCreateCoordinatesSection({
  latitude,
  longitude,
  coordinateSummary,
  styles,
  placeholderTextColor,
  onChangeLatitude,
  onChangeLongitude,
  onOpenMapPicker,
}: AdminLocationCreateCoordinatesSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Coordinates</Text>

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
    </View>
  );
}

type AdminLocationCreateMetadataSectionProps = {
  draft: LocationCreateDraft;
  isCategoryMenuOpen: boolean;
  isStatusMenuOpen: boolean;
  styles: AdminLocationCreateStyles;
  placeholderTextColor: string;
  onChangeCounty: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onToggleCategoryMenu: () => void;
  onChangeStatus: (value: string) => void;
  onToggleStatusMenu: () => void;
  onChangeDifficulty: (value: string) => void;
  onChangeExperience: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangeImageUrl: (value: string) => void;
};

export function AdminLocationCreateMetadataSection({
  draft,
  isCategoryMenuOpen,
  isStatusMenuOpen,
  styles,
  placeholderTextColor,
  onChangeCounty,
  onChangeCategory,
  onToggleCategoryMenu,
  onChangeStatus,
  onToggleStatusMenu,
  onChangeDifficulty,
  onChangeExperience,
  onChangeNotes,
  onChangeImageUrl,
}: AdminLocationCreateMetadataSectionProps) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Location metadata</Text>

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
        options={LOCATION_CATEGORY_OPTIONS}
        isOpen={isCategoryMenuOpen}
        onToggle={onToggleCategoryMenu}
        onSelect={onChangeCategory}
        styles={styles}
      />
      <EditableSelectField
        label="Status"
        value={draft.status}
        options={LOCATION_STATUS_OPTIONS}
        isOpen={isStatusMenuOpen}
        onToggle={onToggleStatusMenu}
        onSelect={onChangeStatus}
        styles={styles}
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
        label="Image URL"
        value={draft.imageUrl}
        onChangeText={onChangeImageUrl}
        styles={styles}
        placeholderTextColor={placeholderTextColor}
        multiline
        keyboardType="url"
      />
    </View>
  );
}

type AdminLocationCreateHeroMediaProps = {
  imageUrl: string | null;
  categoryLabel: string;
  styles: AdminLocationCreateStyles;
};

function AdminLocationCreateHeroMedia({
  imageUrl,
  categoryLabel,
  styles,
}: AdminLocationCreateHeroMediaProps) {
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
  styles: AdminLocationCreateStyles;
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
  styles: AdminLocationCreateStyles;
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
