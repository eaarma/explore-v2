import type { DefaultOfflineRoadMapPackSnapshot } from "@/src/features/map/storage/defaultOfflineRoadMap";
import type {
  AppAppearanceSetting,
  ResolvedAppColorScheme,
} from "@/src/features/settings/utils/appAppearance";

export function getAppearanceSummary(
  appearancePreference: AppAppearanceSetting,
  systemResolvedTheme: ResolvedAppColorScheme,
) {
  return appearancePreference === "system"
    ? `Following your device: ${capitalizeLabel(systemResolvedTheme)}`
    : `Locked to ${capitalizeLabel(appearancePreference)}`;
}

export function getOfflineMapStatusLabel(options: {
  hasOfflineMapDownloadSupport: boolean;
  offlineMapSnapshot: DefaultOfflineRoadMapPackSnapshot | null;
  offlineRoadMapEnabled: boolean;
}) {
  const {
    hasOfflineMapDownloadSupport,
    offlineMapSnapshot,
    offlineRoadMapEnabled,
  } = options;

  if (!hasOfflineMapDownloadSupport) {
    return "Unavailable in this build";
  }

  if (!offlineMapSnapshot) {
    return "Checking status";
  }

  if (offlineMapSnapshot.state === "complete") {
    return "Downloaded";
  }

  if (offlineMapSnapshot.state === "active") {
    const roundedProgress = Math.round(offlineMapSnapshot.percentage);
    return roundedProgress > 0
      ? `Downloading (${roundedProgress}%)`
      : "Downloading";
  }

  if (offlineMapSnapshot.state === "inactive") {
    return offlineRoadMapEnabled ? "Ready to resume" : "Stored but disabled";
  }

  return offlineRoadMapEnabled ? "Not downloaded" : "Removed from device";
}

export function getOfflineMapProgressLabel(
  offlineMapSnapshot: DefaultOfflineRoadMapPackSnapshot | null,
) {
  if (!offlineMapSnapshot) {
    return null;
  }

  if (offlineMapSnapshot.requiredResourceCount <= 0) {
    return null;
  }

  return `${offlineMapSnapshot.completedResourceCount} of ${offlineMapSnapshot.requiredResourceCount} resources`;
}

export function getOfflineMapStorageLabel(
  offlineMapSnapshot: DefaultOfflineRoadMapPackSnapshot | null,
) {
  const storageBytes = offlineMapSnapshot?.completedResourceSize ?? 0;

  if (storageBytes <= 0) {
    return null;
  }

  return formatStorageSize(storageBytes);
}

export function capitalizeLabel(value: string) {
  if (!value) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function formatStorageSize(storageBytes: number) {
  if (!Number.isFinite(storageBytes) || storageBytes <= 0) {
    return "0 B";
  }

  if (storageBytes >= 1024 * 1024 * 1024) {
    return `${(storageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  if (storageBytes >= 1024 * 1024) {
    return `${(storageBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (storageBytes >= 1024) {
    return `${Math.round(storageBytes / 1024)} KB`;
  }

  return `${storageBytes} B`;
}
