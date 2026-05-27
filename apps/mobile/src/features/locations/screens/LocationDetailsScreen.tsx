import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import { bootstrapContentCacheIfNeeded } from "@/src/features/content/storage/contentBootstrap";
import { hydrateLocationWithProgress } from "@/src/features/discoveries/storage/discoveryCache";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { getLocationVisitStatusLabel } from "@/src/features/discoveries/utils/discoveryPresentation";
import {
  getActiveLocations,
  getLocationById,
} from "@/src/features/locations/api/locationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { Location } from "@/src/features/locations/types/locationTypes";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function LocationDetailsScreen() {
  const colorScheme = useColorScheme();
  const styles = useMemo(
    () => createStyles(getLocationDetailsColors(colorScheme === "dark")),
    [colorScheme],
  );
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const { locationId } = useLocalSearchParams<{
    locationId?: string | string[];
  }>();

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      setIsLoadingLocation(true);
      setLocationError(null);

      const resolvedLocationId = parseLocationId(locationId);

      if (resolvedLocationId === null) {
        if (isMounted) {
          setLocation(null);
          setLocationError("Location not found.");
          setIsLoadingLocation(false);
        }

        return;
      }

      try {
        let nextLocation: Location | null = null;

        try {
          await initializeContentCache();
          nextLocation = await getCachedLocationById(resolvedLocationId);
          nextLocation = await hydrateLocationWithProgress(
            user?.id,
            nextLocation,
          );
        } catch {
          // If SQLite init/read fails, continue with network fallbacks.
        }

        if (nextLocation && isMounted) {
          setLocation(nextLocation);
          setIsLoadingLocation(false);
        }

        if (!nextLocation) {
          try {
            const { didBootstrap } = await bootstrapContentCacheIfNeeded();

            if (didBootstrap) {
              nextLocation = await getCachedLocationById(resolvedLocationId);
              nextLocation = await hydrateLocationWithProgress(
                user?.id,
                nextLocation,
              );
            }
          } catch {
            // Background cache bootstrap should not block details rendering.
          }
        }

        if (!nextLocation) {
          try {
            nextLocation = await getLocationById(resolvedLocationId);
            nextLocation = await hydrateLocationWithProgress(
              user?.id,
              nextLocation,
            );
          } catch {
            const activeLocations = await getActiveLocations();
            nextLocation =
              activeLocations.find(
                (activeLocation) => activeLocation.id === resolvedLocationId,
              ) ?? null;
            nextLocation = await hydrateLocationWithProgress(
              user?.id,
              nextLocation,
            );
          }
        }

        if (!nextLocation) {
          throw new Error("Location not found");
        }

        if (!isMounted) {
          return;
        }

        setLocation(nextLocation);
        setLocationError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setLocation(null);
        setLocationError("Could not load this location right now.");
      } finally {
        if (isMounted) {
          setIsLoadingLocation(false);
        }
      }
    }

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, [contentRevision, locationId, progressRevision, user?.id]);

  const screenTitle = location?.title ?? "Location";
  const categoryLabel = location ? normalizeCategory(location.category) : "";

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
        {isLoadingLocation ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading location</Text>
            <Text style={styles.stateCopy}>
              Pulling the saved location details from your local cache.
            </Text>
          </View>
        ) : null}

        {!isLoadingLocation && locationError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Location unavailable</Text>
            <Text style={styles.stateCopy}>{locationError}</Text>
          </View>
        ) : null}

        {!isLoadingLocation && !locationError && location ? (
          <>
            <View style={styles.heroCard}>
              <LocationHeroImage
                imageUrl={location.imageUrl}
                categoryLabel={categoryLabel}
                styles={styles}
              />

              <View style={styles.heroCopy}>
                <Text style={styles.locationTitle}>{location.title}</Text>
                <Text style={styles.locationMeta}>
                  {location.county} | {categoryLabel}
                </Text>
                <Text style={styles.locationStatus}>
                  {getLocationVisitStatusLabel(location)}
                </Text>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Overview</Text>
              <Text style={styles.description}>{location.description}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>At a glance</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    Difficulty {location.difficulty}
                  </Text>
                </View>

                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>{location.county}</Text>
                </View>

                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>{categoryLabel}</Text>
                </View>

                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    {location.notes} notes
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
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
    </>
  );
}

type LocationHeroImageProps = {
  imageUrl: string | null;
  categoryLabel: string;
  styles: LocationDetailsStyles;
};

function LocationHeroImage({
  imageUrl,
  categoryLabel,
  styles,
}: LocationHeroImageProps) {
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

function parseLocationId(value: string | string[] | undefined) {
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

type LocationDetailsColors = ReturnType<typeof getLocationDetailsColors>;
type LocationDetailsStyles = ReturnType<typeof createStyles>;

function getLocationDetailsColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      surface: "#0F172A",
      border: "#1E293B",
      stateBorder: "#1E293B",
      shadow: "#020617",
      title: "#F8FAFC",
      body: "#E2E8F0",
      muted: "#94A3B8",
      subtle: "#CBD5E1",
      accent: "#5EEAD4",
      accentSoft: "#123B36",
      accentSoftText: "#99F6E4",
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      primaryActionBackground: "#115E59",
      primaryActionText: "#FFFFFF",
      secondaryActionBorder: "#334155",
      secondaryActionBackground: "#111827",
      secondaryActionText: "#E2E8F0",
    };
  }

  return {
    background: "#F4EFE6",
    surface: "#FEFCF8",
    border: "#E7E1D7",
    stateBorder: "#CFE6E2",
    shadow: "#1E293B",
    title: "#0F172A",
    body: "#334155",
    muted: "#64748B",
    subtle: "#475569",
    accent: "#0F766E",
    accentSoft: "#D7EFEA",
    accentSoftText: "#115E59",
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    primaryActionBackground: "#0F766E",
    primaryActionText: "#FFFFFF",
    secondaryActionBorder: "#CBD5E1",
    secondaryActionBackground: "#FFFFFF",
    secondaryActionText: "#334155",
  };
}

function createStyles(colors: LocationDetailsColors) {
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
      padding: 20,
      gap: 8,
    },
    locationTitle: {
      color: colors.title,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    locationMeta: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    locationStatus: {
      color: colors.subtle,
      fontSize: 14,
      fontWeight: "600",
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
