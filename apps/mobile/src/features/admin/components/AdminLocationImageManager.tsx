import { useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  deleteLocationImageFromBackend,
  uploadLocationImageAsset,
} from "@/src/features/admin/utils/locationImageStorage";
import { CategoryImagePlaceholder } from "@/src/shared/components/CategoryImagePlaceholder";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import {
  showAppDialog,
  showAppToast,
} from "@/src/shared/store/appFeedbackStore";

export type AdminLocationImageDraft = {
  id: string;
  previewUrl: string;
  downloadUrl: string | null;
  storagePath: string | null;
  fileName: string | null;
  uploadState: "uploaded" | "uploading" | "error";
  source: "existing" | "upload";
  errorMessage: string | null;
};

type AdminLocationImageManagerProps = {
  locationId: number;
  categoryLabel: string;
  imageDrafts: AdminLocationImageDraft[];
  isEditing: boolean;
  isDisabled?: boolean;
  colors: AdminLocationImageManagerColors;
  onChangeImageDrafts: (
    updater: (
      currentImageDrafts: AdminLocationImageDraft[],
    ) => AdminLocationImageDraft[],
  ) => void;
};

type AdminLocationImageManagerColors = {
  surface: string;
  border: string;
  title: string;
  body: string;
  accent: string;
  muted: string;
  chipBackground: string;
  chipText: string;
  primaryActionBackground: string;
  primaryActionText: string;
  secondaryActionBackground: string;
  secondaryActionBorder: string;
  secondaryActionText: string;
};

export function AdminLocationImageManager({
  locationId,
  categoryLabel,
  imageDrafts,
  isEditing,
  isDisabled = false,
  colors,
  onChangeImageDrafts,
}: AdminLocationImageManagerProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    imageDrafts[0]?.id ?? null,
  );

  const imageCountLabel =
    imageDrafts.length === 1
      ? "1 image in lineup"
      : `${imageDrafts.length} images in lineup`;
  const selectedImageDraft =
    imageDrafts.find((imageDraft) => imageDraft.id === selectedImageId) ??
    imageDrafts[0] ??
    null;

  useEffect(() => {
    if (
      selectedImageId &&
      imageDrafts.some((imageDraft) => imageDraft.id === selectedImageId)
    ) {
      return;
    }

    setSelectedImageId(imageDrafts[0]?.id ?? null);
  }, [imageDrafts, selectedImageId]);

  async function handleAddImagePress() {
    if (isDisabled || isPickingImage) {
      return;
    }

    setIsPickingImage(true);

    try {
      const permissionResponse =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResponse.granted) {
        showAppDialog({
          title: "Permission needed",
          message:
            "Photo library access is required to select an image for upload.",
          primaryAction: {
            label: "OK",
          },
        });
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];

      if (selectedAsset.type && selectedAsset.type !== "image") {
        showAppToast({
          text: "Please choose an image file for the location gallery.",
          tone: "warning",
        });
        return;
      }

      const pendingImageDraft = createPendingImageDraft(selectedAsset);
      setSelectedImageId(pendingImageDraft.id);

      onChangeImageDrafts((currentImageDrafts) => [
        ...currentImageDrafts,
        pendingImageDraft,
      ]);

      try {
        const uploadedImage = await uploadLocationImageAsset(
          locationId,
          selectedAsset,
        );

        onChangeImageDrafts((currentImageDrafts) => {
          return currentImageDrafts.map((imageDraft) =>
            imageDraft.id === pendingImageDraft.id
              ? {
                  ...imageDraft,
                  previewUrl: uploadedImage.downloadUrl,
                  downloadUrl: uploadedImage.downloadUrl,
                  storagePath: uploadedImage.storagePath,
                  fileName: uploadedImage.fileName,
                  uploadState: "uploaded",
                  source: "upload",
                  errorMessage: null,
                }
              : imageDraft,
          );
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(
          error,
          "Could not upload the image through the backend right now.",
        );

        onChangeImageDrafts((currentImageDrafts) =>
          currentImageDrafts.map((imageDraft) =>
            imageDraft.id === pendingImageDraft.id
              ? {
                  ...imageDraft,
                  uploadState: "error",
                  errorMessage,
                }
              : imageDraft,
          ),
        );

        showAppToast({
          text: errorMessage,
          tone: "error",
        });
      }
    } finally {
      setIsPickingImage(false);
    }
  }

  async function handleRemoveImagePress(imageDraft: AdminLocationImageDraft) {
    if (isDisabled) {
      return;
    }

    onChangeImageDrafts((currentImageDrafts) =>
      currentImageDrafts.filter(
        (currentImageDraft) => currentImageDraft.id !== imageDraft.id,
      ),
    );

    if (!imageDraft.storagePath) {
      return;
    }

    try {
      await deleteLocationImageFromBackend(locationId, imageDraft.storagePath);
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "The image was removed from the lineup, but backend storage cleanup failed.",
        ),
        tone: "warning",
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Location images</Text>
        <Text style={styles.summary}>{imageCountLabel}</Text>
      </View>

      <View style={styles.mainImageFrame}>
        {selectedImageDraft?.previewUrl ? (
          <Image
            source={{ uri: selectedImageDraft.previewUrl }}
            style={styles.mainImage}
            contentFit="cover"
          />
        ) : (
          <CategoryImagePlaceholder
            categoryLabel={categoryLabel}
            size="large"
            style={styles.mainImage}
          />
        )}

        {selectedImageDraft ? (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>
              {getUploadStateLabel(selectedImageDraft)}
            </Text>
          </View>
        ) : null}
      </View>

      {selectedImageDraft ? (
        <>
          <Text style={styles.fileName} numberOfLines={1}>
            {selectedImageDraft.fileName?.trim() ||
              (selectedImageDraft.source === "existing"
                ? "Current location image"
                : "Uploaded image")}
          </Text>

          {selectedImageDraft.errorMessage ? (
            <Text style={styles.errorCopy} numberOfLines={2}>
              {selectedImageDraft.errorMessage}
            </Text>
          ) : (
            <Text style={styles.helperCopy} numberOfLines={2}>
              {selectedImageDraft.storagePath
                ? selectedImageDraft.storagePath
                : selectedImageDraft.downloadUrl || "Ready for backend linking"}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.emptyCopy}>
          Add a photo to start the location gallery for this stop.
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailRow}
      >
        {imageDrafts.map((imageDraft) => {
          const isSelected = imageDraft.id === selectedImageDraft?.id;

          return (
            <Pressable
              key={imageDraft.id}
              onPress={() => setSelectedImageId(imageDraft.id)}
              style={({ pressed }) => [
                styles.thumbnailButton,
                isSelected && styles.thumbnailButtonSelected,
                pressed && styles.thumbnailButtonPressed,
              ]}
            >
              {imageDraft.previewUrl ? (
                <Image
                  source={{ uri: imageDraft.previewUrl }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              ) : (
                <CategoryImagePlaceholder
                  categoryLabel={categoryLabel}
                  size="large"
                  style={styles.thumbnailImage}
                />
              )}

              {isEditing ? (
                <Pressable
                  onPress={() => void handleRemoveImagePress(imageDraft)}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    styles.thumbnailRemoveButton,
                    pressed && styles.removeButtonPressed,
                  ]}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {isEditing ? (
        <>
          <Pressable
            onPress={() => void handleAddImagePress()}
            disabled={isDisabled || isPickingImage}
            style={({ pressed }) => [
              styles.addButton,
              (isDisabled || isPickingImage) && styles.addButtonDisabled,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Text style={styles.addButtonText}>
              {isPickingImage ? "Picking image..." : "Add image"}
            </Text>
          </Pressable>

          <Text style={styles.footerCopy}>
            Tap a thumbnail to preview it as the main image. Save the location
            to persist the ordered image lineup to the backend.
          </Text>
        </>
      ) : null}
    </View>
  );
}

export function createAdminLocationImageDrafts(
  imageUrls: string[] | null | undefined,
  fallbackImageUrl?: string | null,
) {
  const normalizedImageUrls = normalizeImageUrls(imageUrls, fallbackImageUrl);

  if (normalizedImageUrls.length === 0) {
    return [] satisfies AdminLocationImageDraft[];
  }

  return normalizedImageUrls.map((imageUrl, index) => ({
    id: `existing-${index}-${imageUrl}`,
    previewUrl: imageUrl,
    downloadUrl: imageUrl,
    storagePath: null,
    fileName: getFileNameFromUrl(imageUrl),
    uploadState: "uploaded" as const,
    source: "existing" as const,
    errorMessage: null,
  }));
}

export function getPrimaryAdminLocationImagePreviewUrl(
  imageDrafts: AdminLocationImageDraft[],
) {
  const firstImageWithPreview = imageDrafts.find(
    (imageDraft) => imageDraft.previewUrl.trim().length > 0,
  );

  return firstImageWithPreview?.previewUrl ?? null;
}

export function getPrimaryAdminLocationImageUrl(
  imageDrafts: AdminLocationImageDraft[],
) {
  const imageUrls = getAdminLocationImageUrls(imageDrafts);

  return imageUrls[0] ?? "";
}

export function getAdminLocationImageUrls(
  imageDrafts: AdminLocationImageDraft[],
) {
  return imageDrafts
    .filter(
      (imageDraft) =>
        imageDraft.uploadState === "uploaded" &&
        (imageDraft.downloadUrl?.trim().length ?? 0) > 0,
    )
    .map((imageDraft) => imageDraft.downloadUrl?.trim() ?? "")
    .filter((imageUrl) => imageUrl.length > 0);
}

export function getAdminLocationImages(imageDrafts: AdminLocationImageDraft[]) {
  return imageDrafts
    .filter(
      (imageDraft) =>
        imageDraft.uploadState === "uploaded" &&
        (imageDraft.downloadUrl?.trim().length ?? 0) > 0,
    )
    .map((imageDraft) => ({
      url: imageDraft.downloadUrl?.trim() ?? "",
      storagePath: imageDraft.storagePath?.trim() || null,
    }))
    .filter((image) => image.url.length > 0);
}

function createPendingImageDraft(asset: ImagePicker.ImagePickerAsset) {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    previewUrl: asset.uri,
    downloadUrl: null,
    storagePath: null,
    fileName: asset.fileName?.trim() || null,
    uploadState: "uploading" as const,
    source: "upload" as const,
    errorMessage: null,
  };
}

function getUploadStateLabel(imageDraft: AdminLocationImageDraft) {
  if (imageDraft.uploadState === "uploading") {
    return "Uploading";
  }

  if (imageDraft.uploadState === "error") {
    return "Needs retry";
  }

  if (imageDraft.source === "existing") {
    return "Current";
  }

  return "Uploaded";
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue;
}

function normalizeImageUrls(
  imageUrls: string[] | null | undefined,
  fallbackImageUrl?: string | null,
) {
  const normalizedImageUrls = (imageUrls ?? [])
    .map((imageUrl) => normalizeImageUrl(imageUrl))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

  if (normalizedImageUrls.length > 0) {
    return normalizedImageUrls;
  }

  const normalizedFallbackImageUrl = normalizeImageUrl(fallbackImageUrl);

  return normalizedFallbackImageUrl ? [normalizedFallbackImageUrl] : [];
}

function getFileNameFromUrl(url: string) {
  const cleanUrl = url.split("?")[0] ?? url;
  const pathSegments = cleanUrl.split("/");

  return pathSegments[pathSegments.length - 1] || "location-image";
}

function createStyles(colors: AdminLocationImageManagerColors) {
  return StyleSheet.create({
    container: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    label: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    summary: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    mainImageFrame: {
      height: 240,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      position: "relative",
    },
    mainImage: {
      width: "100%",
      height: "100%",
    },
    thumbnailRow: {
      gap: 12,
      paddingRight: 4,
    },
    thumbnailButton: {
      width: 88,
      height: 88,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      position: "relative",
    },
    thumbnailButtonSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    thumbnailButtonPressed: {
      opacity: 0.86,
    },
    thumbnailImage: {
      width: "100%",
      height: "100%",
    },
    thumbnailRemoveButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(15, 23, 42, 0.78)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.18)",
    },
    removeButtonPressed: {
      opacity: 0.82,
    },
    removeButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    statusChip: {
      position: "absolute",
      left: 10,
      bottom: 10,
      borderRadius: 999,
      backgroundColor: "rgba(15, 23, 42, 0.78)",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusChipText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    fileName: {
      color: colors.title,
      fontSize: 14,
      fontWeight: "700",
    },
    helperCopy: {
      color: colors.body,
      fontSize: 12,
      lineHeight: 18,
    },
    errorCopy: {
      color: "#DC2626",
      fontSize: 12,
      lineHeight: 18,
    },
    emptyCopy: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    addButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.primaryActionBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    addButtonPressed: {
      opacity: 0.86,
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonText: {
      color: colors.primaryActionText,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    footerCopy: {
      color: colors.body,
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
