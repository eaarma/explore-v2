import { View } from "react-native";

import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Location } from "@/src/features/locations/types/locationTypes";
import {
  AdminJourneyLocationAddSearch,
  AdminJourneyLocationEditorHeader,
  AdminJourneyLocationList,
} from "@/src/features/admin/components/AdminJourneyLocationEditorParts";
import { useAdminJourneyLocationEditor } from "@/src/features/admin/hooks/useAdminJourneyLocationEditor";
import { useAdminJourneyLocationEditorTheme } from "@/src/features/admin/utils/adminJourneyLocationEditorTheme";

type AdminJourneyLocationEditorProps = {
  availableLocations: Location[];
  availableLocationsError: string | null;
  isEditing: boolean;
  isLoadingAvailableLocations: boolean;
  isSaving: boolean;
  journeyId: number;
  locations: JourneyLocation[];
  onLocationsChange: (locations: JourneyLocation[]) => void;
  onRequestAvailableLocations: () => void;
};

export function AdminJourneyLocationEditor({
  availableLocations,
  availableLocationsError,
  isEditing,
  isLoadingAvailableLocations,
  isSaving,
  journeyId,
  locations,
  onLocationsChange,
  onRequestAvailableLocations,
}: AdminJourneyLocationEditorProps) {
  const { colors, styles } = useAdminJourneyLocationEditorTheme();
  const {
    data: {
      orderedLocations,
      draggingLocationId,
      dragStartIndex,
      dragTargetIndex,
      dragOffsetY,
      searchQuery,
    },
    derived: {
      draggingLocation,
      canDrag,
      filteredAvailableLocations,
      isSearchIdle,
      isSearchEmpty,
      listHeight,
    },
    ui: {
      isAddSearchOpen,
    },
    actions: {
      setSearchQuery,
      beginDrag,
      updateDrag,
      endDrag,
      toggleAddSearch,
      addLocation,
      removeLocation,
      retryAvailableLocations,
    },
  } = useAdminJourneyLocationEditor({
    availableLocations,
    availableLocationsError,
    isEditing,
    isLoadingAvailableLocations,
    isSaving,
    journeyId,
    locations,
    onLocationsChange,
    onRequestAvailableLocations,
  });

  return (
    <View style={styles.root}>
      <AdminJourneyLocationEditorHeader
        colors={colors}
        isEditing={isEditing}
        isSaving={isSaving}
        isAddSearchOpen={isAddSearchOpen}
        styles={styles}
        onToggleAddSearch={toggleAddSearch}
      />

      {isEditing && isAddSearchOpen ? (
        <AdminJourneyLocationAddSearch
          availableLocationsError={availableLocationsError}
          colors={colors}
          filteredAvailableLocations={filteredAvailableLocations}
          isLoadingAvailableLocations={isLoadingAvailableLocations}
          isSearchEmpty={isSearchEmpty}
          isSearchIdle={isSearchIdle}
          searchQuery={searchQuery}
          styles={styles}
          onAddLocation={addLocation}
          onChangeSearchQuery={setSearchQuery}
          onRetry={retryAvailableLocations}
        />
      ) : null}

      <AdminJourneyLocationList
        canDrag={canDrag}
        colors={colors}
        dragOffsetY={dragOffsetY}
        draggingLocation={draggingLocation}
        draggingLocationId={draggingLocationId}
        dragStartIndex={dragStartIndex}
        dragTargetIndex={dragTargetIndex}
        isEditing={isEditing}
        listHeight={listHeight}
        orderedLocations={orderedLocations}
        styles={styles}
        onDragBegin={beginDrag}
        onDragEnd={endDrag}
        onDragMove={updateDrag}
        onRemoveLocation={removeLocation}
      />
    </View>
  );
}
