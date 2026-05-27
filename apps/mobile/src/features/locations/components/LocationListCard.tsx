import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import {
  formatDistance,
  normalizeCategory,
  useLocationSectionColors,
  useLocationSectionStyles,
} from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";

type LocationListCardProps = {
  location: Location;
  distanceKm: number | null;
  showDistance: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleActive: () => void;
  onShowOnMap: () => void;
  onViewDetails: () => void;
  onAddToTrip?: (() => void) | null;
  isActiveTogglePending?: boolean;
  showActiveToggle?: boolean;
  viewDetailsLabel?: string;
};

export function LocationListCard({
  location,
  distanceKm,
  showDistance,
  isExpanded,
  onToggle,
  onToggleActive,
  onShowOnMap,
  onViewDetails,
  onAddToTrip = null,
  isActiveTogglePending = false,
  showActiveToggle = true,
  viewDetailsLabel = "View details",
}: LocationListCardProps) {
  const styles = useLocationSectionStyles();
  const colors = useLocationSectionColors();
  const categoryLabel = normalizeCategory(location.category);
  const isActive = location.active === true;
  const isDiscovered = location.discovered === true;
  const decisionLineParts = [
    showDistance && distanceKm !== null ? formatDistance(distanceKm) : null,
    `Difficulty ${location.difficulty}`,
  ].filter(Boolean);

  function renderActiveToggleButton() {
    return (
      <Pressable
        accessibilityLabel={
          isActive
            ? "Remove location from active items"
            : "Add location to active items"
        }
        accessibilityRole="button"
        disabled={isActiveTogglePending}
        onPress={(event) => {
          event.stopPropagation();
          onToggleActive();
        }}
        style={({ pressed }) => [
          styles.locationActiveToggleButton,
          isActive && styles.locationActiveToggleButtonActive,
          pressed && styles.locationActiveToggleButtonPressed,
          isActiveTogglePending && styles.locationActiveToggleButtonDisabled,
        ]}
      >
        <Ionicons
          color={
            isActive ? colors.activeToggleActiveIcon : colors.activeToggleIcon
          }
          name={isActive ? "remove" : "add"}
          size={20}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.locationCard}>
      <Pressable onPress={onToggle} style={styles.locationCardPressable}>
        <LocationThumbnail
          imageUrl={location.imageUrl}
          categoryLabel={categoryLabel}
          size="small"
        />

        <View style={styles.locationSummary}>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationTitle} numberOfLines={2}>
              {location.title}
            </Text>
          </View>

          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.locationCounty}
          >
            {[location.county, categoryLabel].filter(Boolean).join(" | ")}
          </Text>

          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.locationDecisionLine}
          >
            {decisionLineParts.join(" | ")}
          </Text>
        </View>

        <View style={styles.locationHeaderAside}>
          {showActiveToggle ? renderActiveToggleButton() : null}

          <View
            style={[
              styles.locationStatusPill,
              isDiscovered
                ? styles.locationStatusPillPositive
                : styles.locationStatusPillPending,
            ]}
          >
            <Text
              style={[
                styles.locationStatusPillText,
                isDiscovered
                  ? styles.locationStatusPillTextPositive
                  : styles.locationStatusPillTextPending,
              ]}
            >
              {isDiscovered ? "Discovered" : "Undiscovered"}
            </Text>
          </View>
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.locationExpandedContent}>
          <LocationThumbnail
            imageUrl={location.imageUrl}
            categoryLabel={categoryLabel}
            size="large"
          />

          <Text style={styles.locationDescription} numberOfLines={4}>
            {location.description}
          </Text>

          <View style={styles.metricRow}>
            {showDistance && distanceKm !== null ? (
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>
                  {formatDistance(distanceKm)}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.locationActionRow}>
            <Pressable
              onPress={onShowOnMap}
              style={[
                styles.locationActionButton,
                styles.locationActionButtonPrimary,
              ]}
            >
              <Text
                style={[
                  styles.locationActionButtonText,
                  styles.locationActionButtonTextPrimary,
                ]}
              >
                Show on map
              </Text>
            </Pressable>

            {onAddToTrip ? (
              <Pressable
                onPress={onAddToTrip}
                style={[
                  styles.locationActionButton,
                  styles.locationActionButtonSecondary,
                ]}
              >
                <Text
                  style={[
                    styles.locationActionButtonText,
                    styles.locationActionButtonTextSecondary,
                  ]}
                >
                  Add to trip
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onViewDetails}
              style={[
                styles.locationActionButton,
                styles.locationActionButtonSecondary,
              ]}
            >
              <Text
                style={[
                  styles.locationActionButtonText,
                  styles.locationActionButtonTextSecondary,
                ]}
              >
                {viewDetailsLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type LocationThumbnailProps = {
  imageUrl: string | null;
  categoryLabel: string;
  size: "small" | "large";
};

function LocationThumbnail({
  imageUrl,
  categoryLabel,
  size,
}: LocationThumbnailProps) {
  const styles = useLocationSectionStyles();
  const containerStyle =
    size === "small"
      ? styles.locationThumbnailSmall
      : styles.locationThumbnailLarge;

  if (!imageUrl) {
    return (
      <CategoryImagePlaceholder
        categoryLabel={categoryLabel}
        size={size}
        style={containerStyle}
      />
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.locationImage}
        contentFit="cover"
      />
    </View>
  );
}
