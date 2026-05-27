import { Text, View } from "react-native";

import { JourneyListCard } from "@/src/features/journeys/components/JourneyListCard";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { LocationListCard } from "@/src/features/locations/components/LocationListCard";
import type { Location } from "@/src/features/locations/types/locationTypes";
import type {
  ActiveItemsSectionStyles,
  SharedLocationSectionStyles,
} from "@/src/features/discoveries/components/activeItemsSection/ActiveItemsSection.styles";
import type { ActiveListItem } from "@/src/features/discoveries/components/activeItemsSection/activeItemsSectionTypes";

type ActiveItemRowProps = {
  isActiveTogglePending: boolean;
  isExpanded: boolean;
  item: ActiveListItem;
  onOpenTripSelection: (item: ActiveListItem) => void;
  onShowJourneyOnMap: (journey: Journey) => void;
  onShowLocationOnMap: (location: Location) => void;
  onToggleActive: (item: ActiveListItem) => void | Promise<void>;
  onToggleExpanded: (itemKey: string) => void;
  onViewJourneyDetails: (journey: Journey) => void;
  onViewLocationDetails: (location: Location) => void;
  sharedStyles: SharedLocationSectionStyles;
  styles: ActiveItemsSectionStyles;
};

export function ActiveItemRow({
  isActiveTogglePending,
  isExpanded,
  item,
  onOpenTripSelection,
  onShowJourneyOnMap,
  onShowLocationOnMap,
  onToggleActive,
  onToggleExpanded,
  onViewJourneyDetails,
  onViewLocationDetails,
  sharedStyles,
  styles,
}: ActiveItemRowProps) {
  if (item.kind === "location") {
    return (
      <View style={sharedStyles.listItemContainer}>
        <View style={styles.itemStack}>
          <View style={styles.kindBadge}>
            <Text style={styles.kindBadgeText}>Location</Text>
          </View>

          <LocationListCard
            distanceKm={null}
            isActiveTogglePending={isActiveTogglePending}
            isExpanded={isExpanded}
            location={item.location}
            onAddToTrip={() => onOpenTripSelection(item)}
            onShowOnMap={() => onShowLocationOnMap(item.location)}
            onToggle={() => onToggleExpanded(item.key)}
            onToggleActive={() => void onToggleActive(item)}
            onViewDetails={() => onViewLocationDetails(item.location)}
            showDistance={false}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={sharedStyles.listItemContainer}>
      <View style={styles.itemStack}>
        <View style={styles.kindBadge}>
          <Text style={styles.kindBadgeText}>Journey</Text>
        </View>

        <JourneyListCard
          distanceKm={null}
          isActiveTogglePending={isActiveTogglePending}
          isExpanded={isExpanded}
          journey={item.journey}
          onAddToTrip={() => onOpenTripSelection(item)}
          onShowOnMap={() => onShowJourneyOnMap(item.journey)}
          onToggle={() => onToggleExpanded(item.key)}
          onToggleActive={() => void onToggleActive(item)}
          onViewDetails={() => onViewJourneyDetails(item.journey)}
          previewImageUrl={item.previewImageUrl}
          showDistance={false}
          stopCount={item.stopCount}
        />
      </View>
    </View>
  );
}
