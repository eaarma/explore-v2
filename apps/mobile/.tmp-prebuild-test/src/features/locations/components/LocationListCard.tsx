import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { getLocationVisitStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  formatDistance,
  normalizeCategory,
  styles,
} from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";

type LocationListCardProps = {
  location: Location;
  distanceKm: number | null;
  showDistance: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleActive: () => void;
  onShowOnMap: () => void;
  onViewDetails: () => void;
  isActiveTogglePending?: boolean;
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
  isActiveTogglePending = false,
}: LocationListCardProps) {
  const categoryLabel = normalizeCategory(location.category);
  const isActive = location.active === true;
  const decisionLineParts = [
    showDistance && distanceKm !== null ? formatDistance(distanceKm) : null,
    `Difficulty ${location.difficulty}`,
  ].filter(Boolean);

  return (
    <View style={styles.locationCard}>
      <Pressable onPress={onToggle} style={styles.locationCardPressable}>
        <View style={styles.locationSummary}>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationTitle} numberOfLines={2}>
              {location.title}
            </Text>

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
                isActiveTogglePending &&
                  styles.locationActiveToggleButtonDisabled,
              ]}
            >
              <Ionicons
                color={isActive ? "#92400E" : "#334155"}
                name={isActive ? "remove" : "add"}
                size={20}
              />
            </Pressable>
          </View>

          <Text style={styles.locationCounty}>
            {location.county} · {categoryLabel}
          </Text>

          <Text style={styles.locationDecisionLine}>
            {decisionLineParts.join(" · ")}
          </Text>

          <Text style={styles.locationVisitStatus}>
            {getLocationVisitStatusLabel(location)}
          </Text>
        </View>

        <LocationThumbnail
          imageUrl={location.imageUrl}
          categoryLabel={categoryLabel}
          size="small"
        />
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
                View details
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
  const containerStyle =
    size === "small"
      ? styles.locationThumbnailSmall
      : styles.locationThumbnailLarge;

  if (!imageUrl) {
    return (
      <View style={[containerStyle, styles.locationImagePlaceholder]}>
        <Text style={styles.locationImagePlaceholderText}>{categoryLabel}</Text>
      </View>
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
