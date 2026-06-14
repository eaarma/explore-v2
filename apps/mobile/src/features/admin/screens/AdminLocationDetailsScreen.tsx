import { useMemo } from "react";
import { useRouter } from "expo-router";

import { AdminDetailActionBar } from "@/src/features/admin/components/AdminDetailActionBar";
import { AdminDetailScreenShell } from "@/src/features/admin/components/AdminDetailScreenShell";
import { AdminLocationCoordinatePickerModal } from "@/src/features/admin/components/AdminLocationCoordinatePickerModal";
import {
  AdminLocationCoordinatesSection,
  AdminLocationDescriptionSection,
  AdminLocationHeroSection,
  AdminLocationMetadataSection,
  AdminLocationTimestampsSection,
  AdminLocationTraitsSection,
} from "@/src/features/admin/components/AdminLocationDetailsSections";
import { useAdminLocationDetailsScreen } from "@/src/features/admin/hooks/useAdminLocationDetailsScreen";
import {
  createAdminLocationDetailsStyles,
  getAdminLocationDetailsColors,
} from "@/src/features/admin/utils/adminLocationDetailsTheme";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { showLocationOptionsDialog } from "@/src/shared/utils/locationActions";

export function AdminLocationDetailsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = useMemo(
    () => getAdminLocationDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(
    () => createAdminLocationDetailsStyles(themeColors),
    [themeColors],
  );
  const router = useRouter();
  const {
    data: { location, editableValues },
    derived: {
      screenTitle,
      categoryLabel,
      locationStatusLabel,
      publicationStatusLabel,
      coordinateSummary,
      initialMapPickerCoordinates,
    },
    ui: {
      isEditing,
      isSaving,
      isCategoryMenuOpen,
      isStatusMenuOpen,
      isMapPickerOpen,
      isLoadingLocation,
      locationError,
      formError,
    },
    actions: {
      updateDraft,
      updateImageDrafts,
      handleEditPress,
      toggleCategoryMenu,
      selectCategory,
      toggleStatusMenu,
      selectStatus,
      openMapPicker,
      closeMapPicker,
      handleConfirmCoordinates,
      handleSavePress,
    },
  } = useAdminLocationDetailsScreen();

  return (
    <>
      <AdminDetailScreenShell
        title={screenTitle}
        colors={{
          background: themeColors.background,
          surface: themeColors.surface,
          border: themeColors.border,
          title: themeColors.title,
          body: themeColors.body,
        }}
        isLoading={isLoadingLocation}
        isSaving={isSaving}
        savingTitle="Saving location"
        savingCopy="Please wait while we save your location changes."
        loadingTitle="Loading admin details"
        loadingCopy="Pulling the location details for the admin screen."
        errorTitle="Location unavailable"
        errorMessage={locationError}
        isReady={Boolean(location && editableValues)}
      >
        {location && editableValues ? (
          <>
            <AdminLocationHeroSection
              locationId={location.id}
              categoryLabel={categoryLabel}
              editableValues={editableValues}
              locationStatusLabel={locationStatusLabel}
              publicationStatusLabel={publicationStatusLabel}
              isEditing={isEditing}
              isSaving={isSaving}
              colors={themeColors}
              styles={styles}
              onChangeImageDrafts={updateImageDrafts}
              onEditPress={handleEditPress}
              onChangeTitle={(value) => updateDraft("title", value)}
            />

            <AdminLocationDescriptionSection
              description={isEditing ? editableValues.description : location.description}
              isEditing={isEditing}
              styles={styles}
              placeholderTextColor={themeColors.inputPlaceholder}
              onChangeDescription={(value) => updateDraft("description", value)}
            />

            <AdminLocationCoordinatesSection
              latitude={isEditing ? editableValues.latitude : String(location.latitude)}
              longitude={isEditing ? editableValues.longitude : String(location.longitude)}
              coordinateSummary={coordinateSummary}
              isEditing={isEditing}
              styles={styles}
              placeholderTextColor={themeColors.inputPlaceholder}
              onChangeLatitude={(value) => updateDraft("latitude", value)}
              onChangeLongitude={(value) => updateDraft("longitude", value)}
              onOpenMapPicker={openMapPicker}
            />

            <AdminLocationMetadataSection
              title={location.title}
              county={isEditing ? editableValues.county : location.county}
              category={isEditing ? editableValues.category : categoryLabel}
              status={isEditing ? editableValues.status : String(location.status)}
              difficulty={
                isEditing
                  ? editableValues.difficulty
                  : String(location.difficulty)
              }
              experience={
                isEditing
                  ? editableValues.experience
                  : String(location.experience)
              }
              notes={isEditing ? editableValues.notes : location.notes ?? ""}
              publicationStatusLabel={publicationStatusLabel}
              isEditing={isEditing}
              isCategoryMenuOpen={isCategoryMenuOpen}
              isStatusMenuOpen={isStatusMenuOpen}
              styles={styles}
              placeholderTextColor={themeColors.inputPlaceholder}
              onChangeCounty={(value) => updateDraft("county", value)}
              onChangeDifficulty={(value) => updateDraft("difficulty", value)}
              onChangeExperience={(value) => updateDraft("experience", value)}
              onChangeNotes={(value) => updateDraft("notes", value)}
              onToggleCategoryMenu={toggleCategoryMenu}
              onSelectCategory={selectCategory}
              onToggleStatusMenu={toggleStatusMenu}
              onSelectStatus={selectStatus}
            />

            <AdminLocationTraitsSection
              traits={editableValues.traits}
              isEditing={isEditing}
              isSaving={isSaving}
              styles={styles}
              placeholderTextColor={themeColors.inputPlaceholder}
              onChangeTraits={(traits) => updateDraft("traits", traits)}
            />

            <AdminLocationTimestampsSection
              createdAt={location.createdAt}
              updatedAt={location.updatedAt}
              styles={styles}
            />

            <AdminDetailActionBar
              formError={formError}
              isEditing={isEditing}
              isSaving={isSaving}
              moreActionsAccessibilityLabel="More location actions"
              secondaryIconColor={themeColors.secondaryActionText}
              onSave={() => void handleSavePress()}
              onPrimaryViewAction={() =>
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
              onMoreActions={() => showLocationOptionsDialog(location)}
              onBack={() => router.back()}
              styles={styles}
            />
          </>
        ) : null}
      </AdminDetailScreenShell>

      <AdminLocationCoordinatePickerModal
        visible={isMapPickerOpen}
        initialCoordinates={initialMapPickerCoordinates}
        colors={themeColors}
        styles={styles}
        onClose={closeMapPicker}
        onConfirm={handleConfirmCoordinates}
      />
    </>
  );
}
