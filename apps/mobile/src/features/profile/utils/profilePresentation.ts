import type { ProfileSnapshot } from "@/src/features/profile/data/profileData";

export function getDisplayName(
  name: string | null | undefined,
  email: string,
) {
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (trimmedName) {
    return trimmedName;
  }

  const emailName = email.split("@")[0]?.trim();

  return emailName || "Explorer";
}

export function formatAccountStatus(status: string | null | undefined) {
  const normalizedStatus =
    typeof status === "string" ? status.trim().toLowerCase() : "";

  if (!normalizedStatus) {
    return "Unknown";
  }

  return normalizedStatus
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getSyncStatusLabel(
  lastContentSyncAt: string | null,
  isOfflineSession: boolean,
  isLoadingProfile: boolean,
) {
  if (isLoadingProfile && !lastContentSyncAt) {
    return "Loading cached totals";
  }

  if (!lastContentSyncAt) {
    return isOfflineSession
      ? "Offline with no completed sync yet"
      : "Waiting for first sync";
  }

  return isOfflineSession
    ? `Offline | last sync ${formatTimestamp(lastContentSyncAt)}`
    : `Last sync ${formatTimestamp(lastContentSyncAt)}`;
}

export function getNextTierProgressLabel(snapshot: ProfileSnapshot) {
  if (!snapshot.progress.nextTier) {
    return "You have reached the highest explorer tier.";
  }

  return `${snapshot.progress.combinedProgressPercent}% combined location and journey progress toward ${snapshot.progress.nextTier}`;
}

export function formatTimestamp(value: string) {
  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return "Unknown";
  }

  return new Date(parsedValue).toLocaleString();
}
