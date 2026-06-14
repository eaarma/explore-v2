import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { AdminJourneyCreateCoordinatePickerModal } from "@/src/features/admin/components/AdminJourneyCreateCoordinatePickerModal";
import { AdminSavingOverlay } from "@/src/features/admin/components/AdminSavingOverlay";
import {
  AdminJourneyCreateAtAGlanceSection,
  AdminJourneyCreateHeroSection,
  AdminJourneyCreateMetadataSection,
  AdminJourneyCreateOverviewSection,
  AdminJourneyCreateRouteSection,
  AdminJourneyCreateTraitsSection,
} from "@/src/features/admin/components/AdminJourneyCreateSections";
import { useAdminJourneyCreateSection } from "@/src/features/admin/hooks/useAdminJourneyCreateSection";
import {
  createAdminJourneyCreateStyles,
  getAdminJourneyCreateColors,
} from "@/src/features/admin/utils/adminJourneyCreateTheme";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function AdminJourneyCreateSection() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getAdminJourneyCreateColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(
    () => createAdminJourneyCreateStyles(colors),
    [colors],
  );
  const {
    data: { draft, routeDraftLocations, availableLocations },
    derived: {
      categoryLabel,
      publicationStatusLabel,
      previewImageUrl,
      coordinateSummary,
      initialMapPickerCoordinates,
    },
    ui: {
      isSaving,
      isCategoryMenuOpen,
      isStatusMenuOpen,
      isMapPickerOpen,
      isLoadingAvailableLocations,
      availableLocationsError,
      formError,
    },
    actions: {
      updateDraft,
      setRouteDraftLocations,
      clearForm,
      toggleCategoryMenu,
      selectCategory,
      toggleStatusMenu,
      selectStatus,
      openMapPicker,
      closeMapPicker,
      handleConfirmCoordinates,
      loadAvailableLocations,
      handleCreateJourney,
    },
  } = useAdminJourneyCreateSection();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AdminJourneyCreateHeroSection
          draft={draft}
          previewImageUrl={previewImageUrl}
          categoryLabel={categoryLabel}
          publicationStatusLabel={publicationStatusLabel}
          routeStopCount={routeDraftLocations.length}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeTitle={(value) => updateDraft("title", value)}
        />

        <AdminJourneyCreateOverviewSection
          description={draft.description}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeDescription={(value) => updateDraft("description", value)}
        />

        <AdminJourneyCreateAtAGlanceSection
          draft={draft}
          categoryLabel={categoryLabel}
          publicationStatusLabel={publicationStatusLabel}
          routeStopCount={routeDraftLocations.length}
          styles={styles}
        />

        <AdminJourneyCreateMetadataSection
          draft={draft}
          isCategoryMenuOpen={isCategoryMenuOpen}
          isStatusMenuOpen={isStatusMenuOpen}
          coordinateSummary={coordinateSummary}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeCounty={(value) => updateDraft("county", value)}
          onChangeCategory={selectCategory}
          onToggleCategoryMenu={toggleCategoryMenu}
          onChangeStatus={selectStatus}
          onToggleStatusMenu={toggleStatusMenu}
          onChangeDistance={(value) => updateDraft("distance", value)}
          onChangeDifficulty={(value) => updateDraft("difficulty", value)}
          onChangeExperience={(value) => updateDraft("experience", value)}
          onChangeNotes={(value) => updateDraft("notes", value)}
          onChangeLatitude={(value) => updateDraft("latitude", value)}
          onChangeLongitude={(value) => updateDraft("longitude", value)}
          onOpenMapPicker={openMapPicker}
          onChangePolyline={(value) => updateDraft("polyline", value)}
        />

        <AdminJourneyCreateTraitsSection
          traits={draft.traits}
          isSaving={isSaving}
          styles={styles}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeTraits={(traits) => updateDraft("traits", traits)}
        />

        <AdminJourneyCreateRouteSection
          availableLocations={availableLocations}
          availableLocationsError={availableLocationsError}
          isLoadingAvailableLocations={isLoadingAvailableLocations}
          isSaving={isSaving}
          routeDraftLocations={routeDraftLocations}
          styles={styles}
          onLocationsChange={setRouteDraftLocations}
          onRequestAvailableLocations={() => void loadAvailableLocations()}
        />

        {formError ? <InlineFeedbackCard message={formError} /> : null}

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

      <AdminJourneyCreateCoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={initialMapPickerCoordinates}
        colors={colors}
        onClose={closeMapPicker}
        onConfirm={handleConfirmCoordinates}
      />

      <AdminSavingOverlay
        visible={isSaving}
        title="Creating journey"
        message="Please wait while we save the new journey."
        colors={colors}
      />
    </>
  );
}
