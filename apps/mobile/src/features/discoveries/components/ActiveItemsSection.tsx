import { FlashList } from "@shopify/flash-list";
import { View, Text } from "react-native";

import { ActiveItemRow } from "@/src/features/discoveries/components/activeItemsSection/ActiveItemRow";
import { ActiveItemsOverviewCard } from "@/src/features/discoveries/components/activeItemsSection/ActiveItemsOverviewCard";
import { useActiveItemsSectionStyles } from "@/src/features/discoveries/components/activeItemsSection/ActiveItemsSection.styles";
import type { ActiveListItem } from "@/src/features/discoveries/components/activeItemsSection/activeItemsSectionTypes";
import { useActiveItemsSectionState } from "@/src/features/discoveries/hooks/useActiveItemsSectionState";
import { useLocationSectionStyles } from "@/src/features/locations/components/locationsSectionShared";
import { TripItemPickerModal } from "@/src/features/trips/components/TripItemPickerModal";
import { TripCard } from "@/src/features/trips/components/TripCard";
import { TripSelectionModal } from "@/src/features/trips/components/TripSelectionModal";

export function ActiveItemsSection() {
  const sharedStyles = useLocationSectionStyles();
  const styles = useActiveItemsSectionStyles();
  const {
    activeItems,
    activeSummaryLabel,
    activeTabError,
    activeToggleTargetKey,
    closeCreateTripComposer,
    closeTripItemPicker,
    closeTripSelection,
    expandedItemKey,
    handleClearTripMapHighlight,
    handleCreateTrip,
    handleCreateTripFromSelection,
    handleReorderTripItems,
    handleSelectTrip,
    handleShowTripOnMap,
    handleToggleTripItemPickerCandidate,
    isCreateTripComposerVisible,
    isLoadingActiveTab,
    isTripDragActive,
    isTripMutationPending,
    openCreateTripComposer,
    openTripItemPicker,
    openTripSelection,
    reorderingTripId,
    setIsTripDragActive,
    showJourneyOnMap,
    showLocationOnMap,
    suggestedTripName,
    toggleActiveItem,
    toggleExpandedItem,
    tripItemPickerCandidates,
    tripItemPickerTrip,
    tripSelectionTarget,
    tripSummaryLabel,
    trips,
    viewJourneyDetails,
    viewLocationDetails,
  } = useActiveItemsSectionState();

  return (
    <>
      <FlashList<ActiveListItem>
        contentContainerStyle={sharedStyles.listContent}
        data={!isLoadingActiveTab && !activeTabError ? activeItems : []}
        ItemSeparatorComponent={() => <View style={sharedStyles.listSpacer} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.key}
        ListEmptyComponent={
          !isLoadingActiveTab && !activeTabError ? (
            <View style={sharedStyles.listItemContainer}>
              <View style={sharedStyles.stateCard}>
                <Text style={sharedStyles.emptyCopy}>
                  No active items yet. Use the plus button on a location or
                  journey to pin it here for quick access.
                </Text>
              </View>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={sharedStyles.content}>
            <ActiveItemsOverviewCard
              activeSummaryLabel={activeSummaryLabel}
              isCreateTripComposerVisible={isCreateTripComposerVisible}
              isTripMutationPending={isTripMutationPending}
              onCloseCreateTrip={closeCreateTripComposer}
              onCreateTrip={handleCreateTrip}
              onOpenCreateTrip={openCreateTripComposer}
              sharedStyles={sharedStyles}
              styles={styles}
              suggestedTripName={suggestedTripName}
              tripSummaryLabel={tripSummaryLabel}
            />

            {isLoadingActiveTab ? (
              <View style={sharedStyles.stateCard}>
                <Text style={sharedStyles.stateTitle}>Loading active items</Text>
                <Text style={sharedStyles.stateCopy}>
                  Pulling your saved active locations, journeys, and trips from
                  local storage.
                </Text>
              </View>
            ) : null}

            {!isLoadingActiveTab && activeTabError ? (
              <View style={sharedStyles.stateCard}>
                <Text style={sharedStyles.stateTitle}>
                  Active items unavailable
                </Text>
                <Text style={sharedStyles.stateCopy}>{activeTabError}</Text>
              </View>
            ) : null}

            {!isLoadingActiveTab && !activeTabError && trips.length === 0 ? (
              <View style={sharedStyles.stateCard}>
                <Text style={sharedStyles.stateTitle}>No trips yet</Text>
                <Text style={sharedStyles.stateCopy}>
                  Create a custom trip to group your favorite locations and
                  journeys into one plan.
                </Text>
              </View>
            ) : null}

            {trips.length > 0 ? (
              <View style={styles.tripStack}>
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    isReorderPending={reorderingTripId === trip.id}
                    onClearMapTrip={() => void handleClearTripMapHighlight()}
                    onDragStateChange={setIsTripDragActive}
                    onManageItems={() => openTripItemPicker(trip.id)}
                    onReorderItems={(items) =>
                      void handleReorderTripItems(trip.id, items)
                    }
                    onShowTripOnMap={() => void handleShowTripOnMap(trip)}
                    trip={trip}
                  />
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ActiveItemRow
            isActiveTogglePending={activeToggleTargetKey === item.key}
            isExpanded={expandedItemKey === item.key}
            item={item}
            onOpenTripSelection={openTripSelection}
            onShowJourneyOnMap={showJourneyOnMap}
            onShowLocationOnMap={showLocationOnMap}
            onToggleActive={toggleActiveItem}
            onToggleExpanded={toggleExpandedItem}
            onViewJourneyDetails={viewJourneyDetails}
            onViewLocationDetails={viewLocationDetails}
            sharedStyles={sharedStyles}
            styles={styles}
          />
        )}
        scrollEnabled={!isTripDragActive}
        showsVerticalScrollIndicator={false}
        style={sharedStyles.scrollView}
      />

      <TripSelectionModal
        isSubmitting={isTripMutationPending}
        onClose={closeTripSelection}
        onCreateTrip={handleCreateTripFromSelection}
        onSelectTrip={handleSelectTrip}
        suggestedTripName={suggestedTripName}
        targetLabel={tripSelectionTarget?.label ?? null}
        trips={trips}
        visible={tripSelectionTarget !== null}
      />

      <TripItemPickerModal
        isSubmitting={isTripMutationPending}
        items={tripItemPickerCandidates}
        onClose={closeTripItemPicker}
        onToggleItem={handleToggleTripItemPickerCandidate}
        tripName={tripItemPickerTrip?.name ?? null}
        visible={tripItemPickerTrip !== null}
      />
    </>
  );
}
