import type { ImagePickerAsset } from "expo-image-picker";

import { apiClient } from "@/src/shared/api/apiClient";

type BackendUploadedLocationImage = {
  url: string;
  storagePath: string;
  fileName: string;
};

export type UploadedLocationImage = {
  downloadUrl: string;
  fileName: string;
  storagePath: string;
};

export async function uploadLocationImageAsset(
  locationId: number,
  asset: ImagePickerAsset,
): Promise<UploadedLocationImage> {
  const formData = new FormData();
  const fileName = buildUploadFileName(asset);

  formData.append("file", {
    uri: asset.uri,
    name: fileName,
    type: asset.mimeType?.trim() || "image/jpeg",
  } as never);

  const response = await apiClient.post<BackendUploadedLocationImage>(
    `/admin/locations/${locationId}/images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    },
  );

  return {
    downloadUrl: response.data.url,
    fileName: response.data.fileName,
    storagePath: response.data.storagePath,
  };
}

export async function deleteLocationImageFromBackend(
  locationId: number,
  storagePath: string,
) {
  const trimmedStoragePath = storagePath.trim();

  if (!trimmedStoragePath) {
    return;
  }

  await apiClient.delete(`/admin/locations/${locationId}/images/temp`, {
    params: {
      storagePath: trimmedStoragePath,
    },
  });
}

function buildUploadFileName(asset: ImagePickerAsset) {
  const sanitizedFileName = sanitizeFileName(asset.fileName);

  if (sanitizedFileName) {
    return sanitizedFileName;
  }

  return `location-image.${resolveFileExtension(asset)}`;
}

function sanitizeFileName(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

function resolveFileExtension(asset: ImagePickerAsset) {
  const fileName = asset.fileName?.trim() ?? "";
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex >= 0 && lastDotIndex < fileName.length - 1) {
    return fileName.slice(lastDotIndex + 1).toLowerCase();
  }

  const mimeType = asset.mimeType?.trim().toLowerCase() ?? "";

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return "heic";
  }

  return "jpg";
}
