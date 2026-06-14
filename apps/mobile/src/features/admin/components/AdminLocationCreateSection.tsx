import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { AdminLocationCreateCoordinatePickerModal } from "@/src/features/admin/components/AdminLocationCreateCoordinatePickerModal";
import { AdminSavingOverlay } from "@/src/features/admin/components/AdminSavingOverlay";
import {
  AdminLocationCreateCoordinatesSection,
  AdminLocationCreateHeroSection,
  AdminLocationCreateMetadataSection,
  AdminLocationCreateOverviewSection,
} from "@/src/features/admin/components/AdminLocationCreateSections";
import { useAdminLocationCreateSection } from "@/src/features/admin/hooks/useAdminLocationCreateSection";
import {
  createAdminLocationCreateStyles,
  getAdminLocationCreateColors,
} from "@/src/features/admin/utils/adminLocationCreateTheme";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function AdminLocationCreateSection() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getAdminLocationCreateColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(
    () => createAdminLocationCreateStyles(colors),
    [colors],
  );
  const {
    data: { draft },
    derived: {
      categoryLabel,
      publicationStatusLabel,
      currentImageUrl,
      coordinateSummary,
      initialMapPickerCoordinates,
    },
    ui: {
      isSaving,
      isCategoryMenuOpen,
      isStatusMenuOpen,
      isMapPickerOpen,
      formError,
    },
    actions: {
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
    },
  } = useAdminLocationCreateSection();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AdminLocationCreateHeroSection
          draft={draft}
          imageUrl={currentImageUrl}
          categoryLabel={categoryLabel}
          publicationStatusLabel={publicationStatusLabel}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeTitle={(value) => updateDraft("title", value)}
        />

        <AdminLocationCreateOverviewSection
          description={draft.description}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeDescription={(value) => updateDraft("description", value)}
        />

        <AdminLocationCreateCoordinatesSection
          latitude={draft.latitude}
          longitude={draft.longitude}
          coordinateSummary={coordinateSummary}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeLatitude={(value) => updateDraft("latitude", value)}
          onChangeLongitude={(value) => updateDraft("longitude", value)}
          onOpenMapPicker={openMapPicker}
        />

        <AdminLocationCreateMetadataSection
          draft={draft}
          isCategoryMenuOpen={isCategoryMenuOpen}
          isStatusMenuOpen={isStatusMenuOpen}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeCounty={(value) => updateDraft("county", value)}
          onChangeCategory={selectCategory}
          onToggleCategoryMenu={toggleCategoryMenu}
          onChangeStatus={selectStatus}
          onToggleStatusMenu={toggleStatusMenu}
          onChangeDifficulty={(value) => updateDraft("difficulty", value)}
          onChangeExperience={(value) => updateDraft("experience", value)}
          onChangeNotes={(value) => updateDraft("notes", value)}
          onChangeImageUrl={(value) => updateDraft("imageUrl", value)}
        />

        {formError ? <InlineFeedbackCard message={formError} /> : null}

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => void handleCreateLocation()}
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
              {isSaving ? "Creating..." : "Create location"}
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

      <AdminLocationCreateCoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={initialMapPickerCoordinates}
        colors={colors}
        onClose={closeMapPicker}
        onConfirm={handleConfirmCoordinates}
      />

      <AdminSavingOverlay
        visible={isSaving}
        title="Creating location"
        message="Please wait while we save the new location."
        colors={colors}
      />
    </>
  );
}
