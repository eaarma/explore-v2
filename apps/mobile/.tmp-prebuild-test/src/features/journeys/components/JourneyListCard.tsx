import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { getJourneyCompletionStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  formatDistance,
  formatRouteDistance,
  formatStopCount,
  normalizeCategory,
  styles,
} from "@/src/features/journeys/components/journeysSectionShared";
import { Journey } from "@/src/features/journeys/types/journeyTypes";

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
  isActiveTogglePending?: boolean;
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
  isActiveTogglePending = false,
}: JourneyListCardProps) {
  const categoryLabel = normalizeCategory(journey.category);
  const isActive = journey.active === true;
  const topDecisionLine = [
    showDistance && distanceKm !== null ? formatDistance(distanceKm) : null,
    formatRouteDistance(journey.distance),
  ].filter(Boolean);

  return (
    <View style={styles.journeyCard}>
      <Pressable onPress={onToggle} style={styles.journeyCardPressable}>
        <View style={styles.journeySummary}>
          <View style={styles.journeyTitleRow}>
            <Text style={styles.journeyTitle} numberOfLines={2}>
              {getJourneyTitle(journey.title)}
            </Text>

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
                isActiveTogglePending &&
                  styles.journeyActiveToggleButtonDisabled,
              ]}
            >
              <Ionicons
                color={isActive ? "#92400E" : "#334155"}
                name={isActive ? "remove" : "add"}
                size={20}
              />
            </Pressable>
          </View>

          <Text style={styles.journeyMeta}>
            {normalizeCounty(journey.county)} | {categoryLabel}
          </Text>

          <Text style={styles.journeyDecisionLine}>
            {topDecisionLine.join(" | ")}
          </Text>

          <Text style={styles.journeySecondaryLine}>
            Difficulty {formatDifficulty(journey.difficulty)} |{" "}
            {formatStopCount(stopCount)} |{" "}
            {getJourneyCompletionStatusLabel(journey)}
          </Text>
        </View>

        <JourneyThumbnail
          imageUrl={previewImageUrl}
          categoryLabel={categoryLabel}
          size="small"
        />
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
                View details
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
  const containerStyle =
    size === "small"
      ? styles.journeyThumbnailSmall
      : styles.journeyThumbnailLarge;

  if (!imageUrl) {
    return (
      <View style={[containerStyle, styles.journeyImagePlaceholder]}>
        <Text style={styles.journeyImagePlaceholderText}>{categoryLabel}</Text>
      </View>
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
