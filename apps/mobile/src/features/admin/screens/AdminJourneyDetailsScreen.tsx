import { useMemo } from "react";
import { useRouter } from "expo-router";

import { AdminDetailActionBar } from "@/src/features/admin/components/AdminDetailActionBar";
import { AdminDetailScreenShell } from "@/src/features/admin/components/AdminDetailScreenShell";
import { AdminJourneyCoordinatePickerModal } from "@/src/features/admin/components/AdminJourneyCoordinatePickerModal";
import {
  AdminJourneyAtAGlanceSection,
  AdminJourneyHeroSection,
  AdminJourneyMetadataSection,
  AdminJourneyOverviewSection,
  AdminJourneyRouteSection,
  AdminJourneyTraitsSection,
} from "@/src/features/admin/components/AdminJourneyDetailsSections";
import { useAdminJourneyDetailsScreen } from "@/src/features/admin/hooks/useAdminJourneyDetailsScreen";
import {
  createAdminJourneyDetailsStyles,
  getAdminJourneyDetailsColors,
} from "@/src/features/admin/utils/adminJourneyDetailsTheme";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { showJourneyOptionsDialog } from "@/src/shared/utils/locationActions";

export function AdminJourneyDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getAdminJourneyDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(
    () => createAdminJourneyDetailsStyles(colors),
    [colors],
  );
  const router = useRouter();
  const {
    data: {
      journey,
      availableLocations,
      editableValues,
      displayedJourneyLocations,
    },
    derived: {
      screenTitle,
      categoryLabel,
      previewImageUrl,
      publicationStatusLabel,
      completionLabel,
      coordinateSummary,
      initialMapPickerCoordinates,
    },
    ui: {
      isLoadingAvailableLocations,
      availableLocationsError,
      isEditing,
      isSaving,
      isCategoryMenuOpen,
      isStatusMenuOpen,
      isMapPickerOpen,
      isLoadingJourney,
      journeyError,
      formError,
    },
    actions: {
      updateDraft,
      setRouteDraftLocations,
      handleEditPress,
      toggleCategoryMenu,
      selectCategory,
      toggleStatusMenu,
      selectStatus,
      openMapPicker,
      closeMapPicker,
      handleConfirmCoordinates,
      loadAvailableLocations,
      handleSavePress,
    },
  } = useAdminJourneyDetailsScreen();

  return (
    <>
      <AdminDetailScreenShell
        title={screenTitle}
        colors={{
          background: colors.background,
          surface: colors.surface,
          border: colors.border,
          title: colors.title,
          body: colors.body,
          stateBorder: colors.stateBorder,
          stateCopy: colors.subtle,
        }}
        isLoading={isLoadingJourney}
        isSaving={isSaving}
        savingTitle="Saving journey"
        savingCopy="Please wait while we save your journey changes."
        loadingTitle="Loading admin details"
        loadingCopy="Pulling the journey details for the admin screen."
        errorTitle="Journey unavailable"
        errorMessage={journeyError}
        isReady={Boolean(journey && editableValues)}
      >
        {journey && editableValues ? (
          <>
            <AdminJourneyHeroSection
              journeyId={journey.id}
              imageUrl={previewImageUrl}
              categoryLabel={categoryLabel}
              editableValues={editableValues}
              displayedJourneyLocations={displayedJourneyLocations}
              publicationStatusLabel={publicationStatusLabel}
              completionLabel={completionLabel}
              isEditing={isEditing}
              isSaving={isSaving}
              colors={colors}
              styles={styles}
              onEditPress={handleEditPress}
              onChangeTitle={(value) => updateDraft("title", value)}
            />

            <AdminJourneyOverviewSection
              description={isEditing ? editableValues.description : journey.description ?? ""}
              isEditing={isEditing}
              styles={styles}
              placeholderTextColor={colors.inputPlaceholder}
              onChangeDescription={(value) => updateDraft("description", value)}
            />

            <AdminJourneyAtAGlanceSection
              distance={editableValues.distance}
              difficulty={editableValues.difficulty}
              stopCount={displayedJourneyLocations.length}
              county={editableValues.county}
              categoryLabel={categoryLabel}
              completionLabel={completionLabel}
              styles={styles}
            />

            <AdminJourneyMetadataSection
              editableValues={editableValues}
              rawJourney={{
                title: journey.title,
                county: journey.county,
                category: journey.category,
                status: journey.status,
                distance: journey.distance,
                difficulty: journey.difficulty,
                experience: journey.experience,
                notes: journey.notes,
                latitude: journey.latitude,
                longitude: journey.longitude,
                polyline: journey.polyline,
              }}
              categoryLabel={categoryLabel}
              publicationStatusLabel={publicationStatusLabel}
              coordinateSummary={coordinateSummary}
              isEditing={isEditing}
              isCategoryMenuOpen={isCategoryMenuOpen}
              isStatusMenuOpen={isStatusMenuOpen}
              styles={styles}
              placeholderTextColor={colors.inputPlaceholder}
              onChangeCounty={(value) => updateDraft("county", value)}
              onChangeDistance={(value) => updateDraft("distance", value)}
              onChangeDifficulty={(value) => updateDraft("difficulty", value)}
              onChangeExperience={(value) => updateDraft("experience", value)}
              onChangeNotes={(value) => updateDraft("notes", value)}
              onChangeLatitude={(value) => updateDraft("latitude", value)}
              onChangeLongitude={(value) => updateDraft("longitude", value)}
              onChangePolyline={(value) => updateDraft("polyline", value)}
              onToggleCategoryMenu={toggleCategoryMenu}
              onSelectCategory={selectCategory}
              onToggleStatusMenu={toggleStatusMenu}
              onSelectStatus={selectStatus}
              onOpenMapPicker={openMapPicker}
            />

            <AdminJourneyTraitsSection
              traits={editableValues.traits}
              isEditing={isEditing}
              isSaving={isSaving}
              styles={styles}
              placeholderTextColor={colors.inputPlaceholder}
              onChangeTraits={(traits) => updateDraft("traits", traits)}
            />

            <AdminJourneyRouteSection
              availableLocations={availableLocations}
              availableLocationsError={availableLocationsError}
              isEditing={isEditing}
              isLoadingAvailableLocations={isLoadingAvailableLocations}
              isSaving={isSaving}
              journeyId={journey.id}
              locations={displayedJourneyLocations}
              styles={styles}
              onLocationsChange={setRouteDraftLocations}
              onRequestAvailableLocations={() => void loadAvailableLocations()}
            />

            <AdminDetailActionBar
              formError={formError}
              isEditing={isEditing}
              isSaving={isSaving}
              moreActionsAccessibilityLabel="More journey actions"
              secondaryIconColor={colors.secondaryActionText}
              onSave={() => void handleSavePress()}
              onPrimaryViewAction={() =>
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
              onMoreActions={() => showJourneyOptionsDialog(journey)}
              onBack={() => router.back()}
              styles={styles}
            />
          </>
        ) : null}
      </AdminDetailScreenShell>

      <AdminJourneyCoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={initialMapPickerCoordinates}
        colors={colors}
        styles={styles}
        onClose={closeMapPicker}
        onConfirm={handleConfirmCoordinates}
      />
    </>
  );
}
