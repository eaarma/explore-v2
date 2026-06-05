import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  bootstrapContentCacheIfNeeded,
  bootstrapJourneyLocationsCacheIfNeeded,
} from "@/src/features/content/storage/contentBootstrap";
import { hydrateJourneyWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getJourneyCompletionStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  getActiveJourneys,
  getJourneyById,
  getJourneyDetail,
  getJourneyLocations,
} from "@/src/features/journeys/api/journeysApi";
import {
  formatRouteDistance,
  formatStopCount,
  normalizeCategory,
} from "@/src/features/journeys/components/journeysSectionShared";
import { JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { Journey, type JourneyTrait } from "@/src/features/journeys/types/journeyTypes";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  getCachedJourneyById,
  getCachedJourneyLocationsByJourneyId,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import {
  ContentNoteDialog,
  hasContentNote,
} from "@/src/shared/components/ContentNoteDialog";

export function JourneyDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getJourneyDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const { journeyId } = useLocalSearchParams<{
    journeyId?: string | string[];
  }>();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [journeyLocations, setJourneyLocations] = useState<JourneyLocation[]>(
    [],
  );
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [isNoteDialogVisible, setIsNoteDialogVisible] = useState(false);
  const [autoOpenedNoteJourneyId, setAutoOpenedNoteJourneyId] = useState<
    number | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJourney() {
      setIsLoadingJourney(true);
      setJourneyError(null);

      const resolvedJourneyId = parseJourneyId(journeyId);

      if (resolvedJourneyId === null) {
        if (isMounted) {
          setJourney(null);
          setJourneyLocations([]);
          setJourneyError("Journey not found.");
          setIsLoadingJourney(false);
        }

        return;
      }

      try {
        let nextJourney: Journey | null = null;
        let nextJourneyLocations: JourneyLocation[] = [];

        try {
          await initializeContentCache();
          nextJourney = await getCachedJourneyById(resolvedJourneyId);
          nextJourney = await hydrateJourneyWithProgress(user?.id, nextJourney);
          nextJourneyLocations =
            await getCachedJourneyLocationsByJourneyId(resolvedJourneyId);
        } catch {
          // Continue with bootstrap and network fallbacks.
        }

        if (nextJourney && isMounted) {
          setJourney(nextJourney);
          setJourneyLocations(nextJourneyLocations);
          setIsLoadingJourney(false);
        }

        if (!nextJourney) {
          try {
            const { didBootstrap } = await bootstrapContentCacheIfNeeded();

            if (didBootstrap) {
              nextJourney = await getCachedJourneyById(resolvedJourneyId);
              nextJourney = await hydrateJourneyWithProgress(
                user?.id,
                nextJourney,
              );
            }
          } catch {
            // Cache bootstrap should not block details rendering.
          }
        }

        if (nextJourneyLocations.length === 0) {
          try {
            const { didBootstrap } =
              await bootstrapJourneyLocationsCacheIfNeeded();

            if (didBootstrap || nextJourney) {
              nextJourneyLocations =
                await getCachedJourneyLocationsByJourneyId(resolvedJourneyId);
            }
          } catch {
            // Cache bootstrap should not block details rendering.
          }
        }

        if (!nextJourney || nextJourneyLocations.length === 0) {
          try {
            const journeyDetail = await getJourneyDetail(resolvedJourneyId);
            nextJourney = await hydrateJourneyWithProgress(
              user?.id,
              journeyDetail,
            );
            nextJourneyLocations = journeyDetail.locations;
          } catch {
            if (!nextJourney) {
              try {
                nextJourney = await getJourneyById(resolvedJourneyId);
                nextJourney = await hydrateJourneyWithProgress(
                  user?.id,
                  nextJourney,
                );
              } catch {
                const activeJourneys = await getActiveJourneys();
                nextJourney =
                  activeJourneys.find(
                    (activeJourney) => activeJourney.id === resolvedJourneyId,
                  ) ?? null;
                nextJourney = await hydrateJourneyWithProgress(
                  user?.id,
                  nextJourney,
                );
              }
            }

            if (nextJourneyLocations.length === 0) {
              try {
                nextJourneyLocations =
                  await getJourneyLocations(resolvedJourneyId);
              } catch {
                nextJourneyLocations = [];
              }
            }
          }
        }

        if (!nextJourney) {
          throw new Error("Journey not found");
        }

        if (!isMounted) {
          return;
        }

        setJourney(nextJourney);
        setJourneyLocations(nextJourneyLocations);
        setJourneyError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setJourney(null);
        setJourneyLocations([]);
        setJourneyError("Could not load this journey right now.");
      } finally {
        if (isMounted) {
          setIsLoadingJourney(false);
        }
      }
    }

    loadJourney();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, journeyId, progressRevision, user?.id]);

  const screenTitle = journey?.title ?? "Journey";
  const categoryLabel = journey ? normalizeCategory(journey.category) : "";
  const journeyTraits = normalizeJourneyTraits(journey?.traits);
  const shouldShowNoteButton = hasContentNote(journey?.notes);
  const previewImageUrl = useMemo(
    () =>
      journeyLocations.find((journeyLocation) => journeyLocation.imageUrl)
        ?.imageUrl ?? null,
    [journeyLocations],
  );

  useEffect(() => {
    if (!journey || !hasContentNote(journey.notes)) {
      return;
    }

    if (autoOpenedNoteJourneyId === journey.id) {
      return;
    }

    setIsNoteDialogVisible(true);
    setAutoOpenedNoteJourneyId(journey.id);
  }, [autoOpenedNoteJourneyId, journey]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: screenTitle,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingJourney ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading journey</Text>
            <Text style={styles.stateCopy}>
              Pulling the saved route details from your local cache.
            </Text>
          </View>
        ) : null}

        {!isLoadingJourney && journeyError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Journey unavailable</Text>
            <Text style={styles.stateCopy}>{journeyError}</Text>
          </View>
        ) : null}

        {!isLoadingJourney && !journeyError && journey ? (
          <>
            <View style={styles.heroCard}>
              <JourneyHeroImage
                imageUrl={previewImageUrl}
                categoryLabel={categoryLabel}
                styles={styles}
              />

              <View style={styles.heroCopy}>
                <Text style={styles.journeyTitle}>{journey.title}</Text>
                <Text style={styles.journeyMeta}>
                  {normalizeCounty(journey.county)} | {categoryLabel}
                </Text>
                <Text style={styles.journeySubcopy}>
                  {formatRouteDistance(journey.distance)} |{" "}
                  {formatStopCount(journeyLocations.length)} |{" "}
                  {getJourneyCompletionStatusLabel(journey)}
                </Text>

                {shouldShowNoteButton ? (
                  <Pressable
                    accessibilityLabel="Show journey note"
                    accessibilityRole="button"
                    onPress={() => setIsNoteDialogVisible(true)}
                    style={({ pressed }) => [
                      styles.heroInfoButton,
                      pressed && styles.heroInfoButtonPressed,
                    ]}
                  >
                    <Ionicons
                      color={colors.accent}
                      name="information"
                      size={20}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Overview</Text>
              <Text style={styles.description}>
                {getJourneyDescription(journey.description)}
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Traits</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    Difficulty {formatDifficulty(journey.difficulty)}
                  </Text>
                </View>

                {journeyTraits.map((trait) => (
                  <View key={trait.id} style={styles.metricChip}>
                    <Text style={styles.metricChipText}>{trait.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Route stops</Text>

              {journeyLocations.length > 0 ? (
                <View style={styles.stopList}>
                  {journeyLocations.map((journeyLocation, index) => (
                    <View key={journeyLocation.id} style={styles.stopCard}>
                      <View style={styles.stopIndexBadge}>
                        <Text style={styles.stopIndexBadgeText}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={styles.stopCopy}>
                        <Text style={styles.stopTitle}>
                          {getStopTitle(journeyLocation.title)}
                        </Text>
                        <Text style={styles.stopMeta}>
                          {normalizeCounty(journeyLocation.county)} |{" "}
                          {normalizeLocationCategory(journeyLocation.category)}
                        </Text>
                        <Text style={styles.stopDescription} numberOfLines={2}>
                          {getJourneyDescription(journeyLocation.description)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyCopy}>
                  No saved stops were found for this journey yet.
                </Text>
              )}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
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
                style={[styles.actionButton, styles.actionButtonPrimary]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextPrimary,
                  ]}
                >
                  Show on map
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={[styles.actionButton, styles.actionButtonSecondary]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextSecondary,
                  ]}
                >
                  Back
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      <ContentNoteDialog
        visible={isNoteDialogVisible}
        title={`${screenTitle} note`}
        note={journey?.notes}
        onClose={() => setIsNoteDialogVisible(false)}
      />
    </>
  );
}

type JourneyHeroImageProps = {
  imageUrl: string | null;
  categoryLabel: string;
  styles: JourneyDetailsStyles;
};

function JourneyHeroImage({
  imageUrl,
  categoryLabel,
  styles,
}: JourneyHeroImageProps) {
  if (!imageUrl) {
    return (
      <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
        <Text style={styles.heroImagePlaceholderText}>{categoryLabel}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.heroImage}
      contentFit="cover"
    />
  );
}

function parseJourneyId(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(firstValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function normalizeCounty(county: string | null | undefined) {
  const trimmedCounty = typeof county === "string" ? county.trim() : "";

  if (!trimmedCounty) {
    return "Unknown county";
  }

  return trimmedCounty;
}

function getJourneyDescription(description: string | null | undefined) {
  const trimmedDescription =
    typeof description === "string" ? description.trim() : "";

  if (!trimmedDescription) {
    return "Journey description is not available yet.";
  }

  return trimmedDescription;
}

function getStopTitle(title: string | null | undefined) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return "Untitled stop";
  }

  return trimmedTitle;
}

function formatDifficulty(difficulty: number | null | undefined) {
  if (!Number.isFinite(difficulty)) {
    return "?";
  }

  return Math.max(1, Math.round(Number(difficulty)));
}

function normalizeJourneyTraits(traits: JourneyTrait[] | undefined) {
  if (!traits || traits.length === 0) {
    return [];
  }

  return traits
    .filter((trait) => typeof trait?.name === "string")
    .map((trait, index) => ({
      id:
        typeof trait.id === "number" && Number.isFinite(trait.id)
          ? trait.id
          : -(index + 1),
      name: trait.name.trim(),
      sortOrder:
        typeof trait.sortOrder === "number" && Number.isFinite(trait.sortOrder)
          ? trait.sortOrder
          : index,
    }))
    .filter((trait) => trait.name.length > 0)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id - right.id;
    });
}

type JourneyDetailsColors = ReturnType<typeof getJourneyDetailsColors>;
type JourneyDetailsStyles = ReturnType<typeof createStyles>;

function getJourneyDetailsColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      elevatedSurface: "#111827",
      border: "#1E293B",
      stateBorder: "#1E293B",
      shadow: "#020617",
      title: "#F8FAFC",
      body: "#E2E8F0",
      muted: "#94A3B8",
      subtle: "#CBD5E1",
      accent: activeStateColors.tint,
      accentSoft: activeStateColors.softBackground,
      accentSoftText: activeStateColors.tint,
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      stopBadgeBackground: activeStateColors.softBackground,
      stopBadgeText: activeStateColors.tint,
      primaryActionBackground: activeStateColors.buttonBackground,
      primaryActionText: activeStateColors.text,
      secondaryActionBorder: "#334155",
      secondaryActionBackground: "#111827",
      secondaryActionText: "#E2E8F0",
    };
  }

  return {
    background: "#F4EFE6",
    surface: "#FEFCF8",
    elevatedSurface: "#FFFFFF",
    border: "#E7E1D7",
    stateBorder: "#CFE6E2",
    shadow: "#1E293B",
    title: "#0F172A",
    body: "#334155",
    muted: "#64748B",
    subtle: "#475569",
    accent: activeStateColors.tint,
    accentSoft: activeStateColors.softBackground,
    accentSoftText: activeStateColors.tint,
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    stopBadgeBackground: activeStateColors.softBackground,
    stopBadgeText: activeStateColors.tint,
    primaryActionBackground: activeStateColors.buttonBackground,
    primaryActionText: activeStateColors.text,
    secondaryActionBorder: "#CBD5E1",
    secondaryActionBackground: "#FFFFFF",
    secondaryActionText: "#334155",
  };
}

function createStyles(colors: JourneyDetailsColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    stateCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.stateBorder,
      backgroundColor: colors.surface,
      padding: 20,
    },
    stateTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    stateCopy: {
      marginTop: 8,
      color: colors.subtle,
      fontSize: 15,
      lineHeight: 22,
    },
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    heroImage: {
      width: "100%",
      height: 240,
      backgroundColor: colors.accentSoft,
    },
    heroImagePlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    heroImagePlaceholderText: {
      color: colors.accentSoftText,
      fontSize: 16,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    heroCopy: {
      position: "relative",
      padding: 20,
      paddingRight: 84,
      gap: 8,
    },
    journeyTitle: {
      color: colors.title,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    journeyMeta: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    journeySubcopy: {
      color: colors.subtle,
      fontSize: 14,
      fontWeight: "600",
    },
    heroInfoButton: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
    },
    heroInfoButtonPressed: {
      opacity: 0.84,
    },
    detailsCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      gap: 14,
    },
    sectionLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    description: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 23,
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricChip: {
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    metricChipText: {
      color: colors.chipText,
      fontSize: 13,
      fontWeight: "600",
    },
    stopList: {
      gap: 12,
    },
    stopCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevatedSurface,
      padding: 14,
    },
    stopIndexBadge: {
      width: 30,
      height: 30,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.stopBadgeBackground,
    },
    stopIndexBadgeText: {
      color: colors.stopBadgeText,
      fontSize: 13,
      fontWeight: "700",
    },
    stopCopy: {
      flex: 1,
      gap: 4,
    },
    stopTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    stopMeta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    stopDescription: {
      color: colors.subtle,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyCopy: {
      color: colors.subtle,
      fontSize: 15,
      lineHeight: 22,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
      paddingBottom: 12,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primaryActionBackground,
    },
    actionButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
    },
    actionButtonTextPrimary: {
      color: colors.primaryActionText,
    },
    actionButtonTextSecondary: {
      color: colors.secondaryActionText,
    },
  });
}
