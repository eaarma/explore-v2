import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import {
  formatDistance,
  formatRouteDistance,
  formatStopCount,
  normalizeCategory,
  useJourneySectionColors,
  useJourneySectionStyles,
} from "@/src/features/journeys/components/journeysSectionShared";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";

type JourneyListCardProps = {
  journey: Journey;
  distanceKm: number | null;
  showDistance: boolean;
  stopCount: number;
  previewImageUrl: string | null;
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

export function JourneyListCard({
  journey,
  distanceKm,
  showDistance,
  stopCount,
  previewImageUrl,
  isExpanded,
  onToggle,
  onToggleActive,
  onShowOnMap,
  onViewDetails,
  onAddToTrip = null,
  isActiveTogglePending = false,
  showActiveToggle = true,
  viewDetailsLabel = "View details",
}: JourneyListCardProps) {
  const styles = useJourneySectionStyles();
  const colors = useJourneySectionColors();
  const categoryLabel = normalizeCategory(journey.category);
  const isActive = journey.active === true;
  const isCompleted = journey.completed === true;
  const topDecisionLine = [
    showDistance && distanceKm !== null ? formatDistance(distanceKm) : null,
    formatRouteDistance(journey.distance),
  ].filter(Boolean);

  function renderActiveToggleButton() {
    return (
      <Pressable
        accessibilityLabel={
          isActive
            ? "Remove journey from active items"
            : "Add journey to active items"
        }
        accessibilityRole="button"
        disabled={isActiveTogglePending}
        onPress={(event) => {
          event.stopPropagation();
          onToggleActive();
        }}
        style={({ pressed }) => [
          styles.journeyActiveToggleButton,
          isActive && styles.journeyActiveToggleButtonActive,
          pressed && styles.journeyActiveToggleButtonPressed,
          isActiveTogglePending && styles.journeyActiveToggleButtonDisabled,
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
    <View style={styles.journeyCard}>
      <Pressable onPress={onToggle} style={styles.journeyCardPressable}>
        <JourneyThumbnail
          imageUrl={previewImageUrl}
          categoryLabel={categoryLabel}
          size="small"
        />

        <View style={styles.journeySummary}>
          <View style={styles.journeyTitleRow}>
            <Text style={styles.journeyTitle} numberOfLines={2}>
              {getJourneyTitle(journey.title)}
            </Text>
          </View>

          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.journeyMeta}
          >
            {normalizeCounty(journey.county)} | {categoryLabel}
          </Text>

          <Text style={styles.journeyDecisionLine}>
            {topDecisionLine.join(" | ")}
          </Text>

          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.journeySecondaryLine}
          >
            Difficulty {formatDifficulty(journey.difficulty)} |{" "}
            {formatStopCount(stopCount)}
          </Text>
        </View>

        <View style={styles.journeyHeaderAside}>
          {showActiveToggle ? renderActiveToggleButton() : null}

          <View
            style={[
              styles.journeyStatusPill,
              isCompleted
                ? styles.journeyStatusPillPositive
                : styles.journeyStatusPillPending,
            ]}
          >
            <Text
              style={[
                styles.journeyStatusPillText,
                isCompleted
                  ? styles.journeyStatusPillTextPositive
                  : styles.journeyStatusPillTextPending,
              ]}
            >
              {isCompleted ? "Completed" : "Incomplete"}
            </Text>
          </View>
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.journeyExpandedContent}>
          <JourneyThumbnail
            imageUrl={previewImageUrl}
            categoryLabel={categoryLabel}
            size="large"
          />

          <Text style={styles.journeyDescription} numberOfLines={4}>
            {getJourneyDescription(journey.description)}
          </Text>

          <View style={styles.metricRow}>
            {showDistance && distanceKm !== null ? (
              <View style={styles.metricChip}>
                <Text style={styles.metricChipText}>
                  {formatDistance(distanceKm)}
                </Text>
              </View>
            ) : null}

            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {formatRouteDistance(journey.distance)}
              </Text>
            </View>

            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                Difficulty {formatDifficulty(journey.difficulty)}
              </Text>
            </View>

            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {formatStopCount(stopCount)}
              </Text>
            </View>

            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>
                {normalizeCounty(journey.county)}
              </Text>
            </View>

            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>{categoryLabel}</Text>
            </View>
          </View>

          <View style={styles.journeyActionRow}>
            <Pressable
              onPress={onShowOnMap}
              style={[
                styles.journeyActionButton,
                styles.journeyActionButtonPrimary,
              ]}
            >
              <Text
                style={[
                  styles.journeyActionButtonText,
                  styles.journeyActionButtonTextPrimary,
                ]}
              >
                Show on map
              </Text>
            </Pressable>

            {onAddToTrip ? (
              <Pressable
                onPress={onAddToTrip}
                style={[
                  styles.journeyActionButton,
                  styles.journeyActionButtonSecondary,
                ]}
              >
                <Text
                  style={[
                    styles.journeyActionButtonText,
                    styles.journeyActionButtonTextSecondary,
                  ]}
                >
                  Add to trip
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onViewDetails}
              style={[
                styles.journeyActionButton,
                styles.journeyActionButtonSecondary,
              ]}
            >
              <Text
                style={[
                  styles.journeyActionButtonText,
                  styles.journeyActionButtonTextSecondary,
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

type JourneyThumbnailProps = {
  imageUrl: string | null;
  categoryLabel: string;
  size: "small" | "large";
};

function JourneyThumbnail({
  imageUrl,
  categoryLabel,
  size,
}: JourneyThumbnailProps) {
  const styles = useJourneySectionStyles();
  const containerStyle =
    size === "small"
      ? styles.journeyThumbnailSmall
      : styles.journeyThumbnailLarge;

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
        style={styles.journeyImage}
        contentFit="cover"
      />
    </View>
  );
}

function getJourneyTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled journey";
  }

  return trimmedTitle;
}

function getJourneyDescription(description: string | null | undefined) {
  const trimmedDescription =
    typeof description === "string" ? description.trim() : "";

  if (!trimmedDescription) {
    return "Journey description is not available yet.";
  }

  return trimmedDescription;
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function formatDifficulty(difficulty: number | null | undefined) {
  if (!Number.isFinite(difficulty)) {
    return "?";
  }

  return Math.max(1, Math.round(Number(difficulty)));
}
