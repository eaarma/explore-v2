import { Ionicons } from "@expo/vector-icons";
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
import {
  Location,
  type LocationTrait,
} from "@/src/features/locations/types/locationTypes";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";
import {
  ContentNoteDialog,
  hasContentNote,
} from "@/src/shared/components/ContentNoteDialog";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  getCachedLocationById,
  initializeContentCache,
} from "@/src/shared/storage/contentCache";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";

export function LocationDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getLocationDetailsColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [isNoteDialogVisible, setIsNoteDialogVisible] = useState(false);
  const [autoOpenedNoteLocationId, setAutoOpenedNoteLocationId] = useState<
    number | null
  >(null);

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

        try {
          nextLocation = await getLocationById(resolvedLocationId);
          nextLocation = await hydrateLocationWithProgress(
            user?.id,
            nextLocation,
          );
        } catch {
          if (!nextLocation) {
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
  const locationTraits = normalizeLocationTraits(location?.traits);
  const shouldShowNoteButton = hasContentNote(location?.notes);

  useEffect(() => {
    if (!location || !hasContentNote(location.notes)) {
      return;
    }

    if (autoOpenedNoteLocationId === location.id) {
      return;
    }

    setIsNoteDialogVisible(true);
    setAutoOpenedNoteLocationId(location.id);
  }, [autoOpenedNoteLocationId, location]);

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
              <LocationImageGallery
                imageUrls={resolveLocationImageUrls(location)}
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

                {shouldShowNoteButton ? (
                  <Pressable
                    accessibilityLabel="Show location note"
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
              <Text style={styles.description}>{location.description}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Traits</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipText}>
                    Difficulty {location.difficulty}
                  </Text>
                </View>

                {locationTraits.map((trait) => (
                  <View key={trait.id} style={styles.metricChip}>
                    <Text style={styles.metricChipText}>{trait.name}</Text>
                  </View>
                ))}
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

      <ContentNoteDialog
        visible={isNoteDialogVisible}
        title={`${screenTitle} note`}
        note={location?.notes}
        onClose={() => setIsNoteDialogVisible(false)}
      />
    </>
  );
}

type LocationHeroImageProps = {
  imageUrls: string[];
  categoryLabel: string;
  styles: LocationDetailsStyles;
};

function LocationImageGallery({
  imageUrls,
  categoryLabel,
  styles,
}: LocationHeroImageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const hasMultipleImages = imageUrls.length > 1;
  const selectedImageUrl = imageUrls[selectedImageIndex] ?? null;

  useEffect(() => {
    if (selectedImageIndex < imageUrls.length) {
      return;
    }

    setSelectedImageIndex(0);
  }, [imageUrls, selectedImageIndex]);

  if (!selectedImageUrl) {
    return (
      <CategoryImagePlaceholder
        categoryLabel={categoryLabel}
        size="large"
        style={styles.heroImage}
      />
    );
  }

  return (
    <View style={hasMultipleImages ? styles.gallery : undefined}>
      <Image
        source={{ uri: selectedImageUrl }}
        style={styles.heroImage}
        contentFit="cover"
      />

      {hasMultipleImages ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryThumbnailRow}
        >
          {imageUrls.map((imageUrl, index) => {
            const isSelected = index === selectedImageIndex;

            return (
              <Pressable
                key={`${imageUrl}-${index}`}
                onPress={() => setSelectedImageIndex(index)}
                style={({ pressed }) => [
                  styles.galleryThumbnailButton,
                  isSelected && styles.galleryThumbnailButtonSelected,
                  pressed && styles.galleryThumbnailButtonPressed,
                ]}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.galleryThumbnailImage}
                  contentFit="cover"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

function resolveLocationImageUrls(location: Location) {
  const normalizedImageUrls = (location.imageUrls ?? [])
    .map((imageUrl) => imageUrl?.trim() ?? "")
    .filter((imageUrl) => imageUrl.length > 0);

  if (normalizedImageUrls.length > 0) {
    return normalizedImageUrls;
  }

  const fallbackImageUrl = location.imageUrl?.trim() ?? "";

  if (fallbackImageUrl.length > 0) {
    return [fallbackImageUrl];
  }

  return [];
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

function normalizeLocationTraits(traits: LocationTrait[] | undefined) {
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
    gallery: {
      gap: 12,
      paddingBottom: 16,
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
    galleryThumbnailRow: {
      gap: 10,
      paddingHorizontal: 16,
    },
    galleryThumbnailButton: {
      width: 84,
      height: 84,
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    galleryThumbnailButtonSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    galleryThumbnailButtonPressed: {
      opacity: 0.86,
    },
    galleryThumbnailImage: {
      width: "100%",
      height: "100%",
    },
    heroCopy: {
      position: "relative",
      paddingHorizontal: 20,
      paddingRight: 84,
      paddingBottom: 20,
      gap: 8,
    },
    locationTitle: {
      color: colors.title,
      fontSize: 28,
      fontWeight: "700",
      marginTop: 12,
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
