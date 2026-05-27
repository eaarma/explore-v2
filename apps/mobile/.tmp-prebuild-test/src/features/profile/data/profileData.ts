import { getCachedDiscoveryProgressSummary, initializeDiscoveryCache } from "@/src/features/discoveries/storage/discoveryCache";
import { DiscoveryActivityItem } from "@/src/features/discoveries/types/discoveryTypes";
import {
  bootstrapContentCacheIfNeeded,
  getCachedContentSummary,
  initializeContentCache,
  syncActiveContentCache,
  syncAllContentCaches,
} from "@/src/shared/storage/contentCache";

type ExplorerTier = {
  label: string;
  minimumCompletionPercent: number;
};

export type ProfileStats = {
  locationsVisited: number;
  totalLocations: number;
  journeysCompleted: number;
  totalJourneys: number;
};

export type ProfileProgressSummary = {
  locationProgressPercent: number;
  journeyProgressPercent: number;
  combinedProgressPercent: number;
  currentTier: string;
  nextTier: string | null;
  progressToNextTierPercent: number;
};

export type ProfileSnapshot = {
  stats: ProfileStats;
  progress: ProfileProgressSummary;
  lastContentSyncAt: string | null;
  recentActivity: DiscoveryActivityItem[];
};

const EXPLORER_TIERS: ExplorerTier[] = [
  { label: "Beginner Explorer", minimumCompletionPercent: 0 },
  { label: "Local Explorer", minimumCompletionPercent: 5 },
  { label: "Trail Seeker", minimumCompletionPercent: 15 },
  { label: "Expeditioner", minimumCompletionPercent: 35 },
  { label: "Master Explorer", minimumCompletionPercent: 70 },
];

export async function getProfileSnapshot(userId?: string | null): Promise<ProfileSnapshot> {
  await Promise.all([initializeContentCache(), initializeDiscoveryCache()]);

  let summary = await getCachedContentSummary();
  let progressSummary = await getCachedDiscoveryProgressSummary(userId);

  try {
    const { didBootstrap } = await bootstrapContentCacheIfNeeded();

    if (didBootstrap) {
      summary = await getCachedContentSummary();
    }
  } catch {
    if (summary.totalLocations === 0 && summary.totalJourneys === 0) {
      try {
        await syncActiveContentCache();
        summary = await getCachedContentSummary();
      } catch {
        // Keep the zero-value placeholder state when content cannot be synced.
      }
    }
  }

  return buildProfileSnapshot(
    progressSummary.locationsVisited,
    summary.totalLocations,
    progressSummary.journeysCompleted,
    summary.totalJourneys,
    summary.lastContentSyncAt,
    progressSummary.recentActivity,
  );
}

export async function refreshProfileSnapshot(
  userId?: string | null,
): Promise<ProfileSnapshot> {
  await Promise.all([initializeContentCache(), initializeDiscoveryCache()]);
  await syncAllContentCaches();

  const [summary, progressSummary] = await Promise.all([
    getCachedContentSummary(),
    getCachedDiscoveryProgressSummary(userId),
  ]);

  return buildProfileSnapshot(
    progressSummary.locationsVisited,
    summary.totalLocations,
    progressSummary.journeysCompleted,
    summary.totalJourneys,
    summary.lastContentSyncAt,
    progressSummary.recentActivity,
  );
}

export function createPlaceholderProfileSnapshot(): ProfileSnapshot {
  return buildProfileSnapshot(0, 0, 0, 0, null, []);
}

function buildProfileSnapshot(
  locationsVisited: number,
  totalLocations: number,
  journeysCompleted: number,
  totalJourneys: number,
  lastContentSyncAt: string | null,
  recentActivity: DiscoveryActivityItem[],
): ProfileSnapshot {
  const stats: ProfileStats = {
    locationsVisited,
    totalLocations,
    journeysCompleted,
    totalJourneys,
  };

  return {
    stats,
    progress: buildProgressSummary(stats),
    lastContentSyncAt,
    recentActivity,
  };
}

function buildProgressSummary(stats: ProfileStats): ProfileProgressSummary {
  const locationProgressPercent = calculateProgressPercent(
    stats.locationsVisited,
    stats.totalLocations,
  );
  const journeyProgressPercent = calculateProgressPercent(
    stats.journeysCompleted,
    stats.totalJourneys,
  );
  const combinedProgressPercent = Math.round(
    (locationProgressPercent + journeyProgressPercent) / 2,
  );
  const currentTierIndex = getCurrentTierIndex(combinedProgressPercent);
  const currentTier = EXPLORER_TIERS[currentTierIndex];
  const nextTier = EXPLORER_TIERS[currentTierIndex + 1] ?? null;
  const progressIntoCurrentTier =
    combinedProgressPercent - currentTier.minimumCompletionPercent;
  const progressNeededForNextTier = nextTier
    ? nextTier.minimumCompletionPercent - currentTier.minimumCompletionPercent
    : null;
  const progressToNextTierPercent = progressNeededForNextTier
    ? clampPercent((progressIntoCurrentTier / progressNeededForNextTier) * 100)
    : 100;

  return {
    locationProgressPercent,
    journeyProgressPercent,
    combinedProgressPercent,
    currentTier: currentTier.label,
    nextTier: nextTier?.label ?? null,
    progressToNextTierPercent,
  };
}

function getCurrentTierIndex(combinedProgressPercent: number) {
  for (let index = EXPLORER_TIERS.length - 1; index >= 0; index -= 1) {
    if (
      combinedProgressPercent >=
      EXPLORER_TIERS[index].minimumCompletionPercent
    ) {
      return index;
    }
  }

  return 0;
}

function calculateProgressPercent(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return clampPercent((completed / total) * 100);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
