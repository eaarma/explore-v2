import {
  OfflineManager,
  type LngLatBounds,
  type OfflinePack,
  type OfflinePackDownloadState,
} from "@maplibre/maplibre-react-native";
import {
  buildMapStyleUrl,
  DEFAULT_MAP_STYLE_KEY,
  DEFAULT_OFFLINE_ROAD_MAP_BOUNDS,
  DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM,
  DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM,
  hasConfiguredMapTilerApiKey,
} from "@/src/features/map/mapConfig";

const DEFAULT_OFFLINE_ROAD_MAP_PACK_KIND = "default-offline-road-map";
const DEFAULT_OFFLINE_ROAD_MAP_VERSION = 1;
export const DEFAULT_OFFLINE_ROAD_MAP_LABEL = "Estonia Road z5-z11";

let ensureDefaultOfflineRoadMapPackPromise: Promise<void> | null = null;

type DefaultOfflineRoadMapMetadata = {
  kind: string;
  version: number;
  coverage: string;
  styleKey: string;
  minZoom: number;
  maxZoom: number;
};

export type DefaultOfflineRoadMapPackSnapshot = {
  packId: string | null;
  state: OfflinePackDownloadState | "missing";
  percentage: number;
  completedResourceCount: number;
  completedResourceSize: number;
  requiredResourceCount: number;
};

export async function ensureDefaultOfflineRoadMapPack() {
  if (ensureDefaultOfflineRoadMapPackPromise) {
    return ensureDefaultOfflineRoadMapPackPromise;
  }

  ensureDefaultOfflineRoadMapPackPromise = doEnsureDefaultOfflineRoadMapPack()
    .catch(() => {
      // Keep map browsing available even if offline pack creation fails.
    })
    .finally(() => {
      ensureDefaultOfflineRoadMapPackPromise = null;
    });

  return ensureDefaultOfflineRoadMapPackPromise;
}

export async function getDefaultOfflineRoadMapPackSnapshot(): Promise<DefaultOfflineRoadMapPackSnapshot> {
  const expectedBounds = [...DEFAULT_OFFLINE_ROAD_MAP_BOUNDS] as LngLatBounds;
  const { matchingPack, managedPacks } =
    await resolveManagedDefaultOfflineRoadMapPacks(expectedBounds);
  const snapshotPack = matchingPack ?? managedPacks[0] ?? null;

  if (!snapshotPack) {
    return {
      packId: null,
      state: "missing",
      percentage: 0,
      completedResourceCount: 0,
      completedResourceSize: 0,
      requiredResourceCount: 0,
    };
  }

  const packStatus = await snapshotPack.status();

  return {
    packId: snapshotPack.id,
    state: packStatus.state,
    percentage: packStatus.percentage,
    completedResourceCount: packStatus.completedResourceCount,
    completedResourceSize: packStatus.completedResourceSize,
    requiredResourceCount: packStatus.requiredResourceCount,
  };
}

export async function repairDefaultOfflineRoadMapPack() {
  if (!hasConfiguredMapTilerApiKey()) {
    throw new Error("Offline map downloads are unavailable in this build.");
  }

  await doEnsureDefaultOfflineRoadMapPack({
    revalidateMatchingPack: true,
  });
}

export async function deleteDefaultOfflineRoadMapPack() {
  const expectedBounds = [...DEFAULT_OFFLINE_ROAD_MAP_BOUNDS] as LngLatBounds;
  const { matchingPack, duplicatePacks, outdatedPacks } =
    await resolveManagedDefaultOfflineRoadMapPacks(expectedBounds);
  let firstDeleteError: Error | null = null;

  for (const pack of [
    ...(matchingPack ? [matchingPack] : []),
    ...duplicatePacks,
    ...outdatedPacks,
  ]) {
    try {
      await OfflineManager.deletePack(pack.id);
    } catch (error) {
      if (!firstDeleteError) {
        firstDeleteError =
          error instanceof Error
            ? error
            : new Error("Could not delete the offline road map pack.");
      }
    }
  }

  if (firstDeleteError) {
    throw firstDeleteError;
  }
}

async function doEnsureDefaultOfflineRoadMapPack(options?: {
  revalidateMatchingPack?: boolean;
}) {
  const expectedBounds = [...DEFAULT_OFFLINE_ROAD_MAP_BOUNDS] as LngLatBounds;
  const { matchingPack: resolvedMatchingPack, duplicatePacks, outdatedPacks } =
    await resolveManagedDefaultOfflineRoadMapPacks(expectedBounds);
  const hadMatchingPack = resolvedMatchingPack !== null;
  let matchingPack = resolvedMatchingPack;

  for (const pack of [...duplicatePacks, ...outdatedPacks]) {
    try {
      await OfflineManager.deletePack(pack.id);
    } catch {
      // Keep the current pack if cleanup fails; a fresh download can retry later.
    }
  }

  if (!matchingPack) {
    matchingPack = await OfflineManager.createPack(
      {
        mapStyle: buildMapStyleUrl(DEFAULT_MAP_STYLE_KEY),
        bounds: expectedBounds,
        minZoom: DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM,
        maxZoom: DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM,
        metadata: createDefaultOfflineRoadMapMetadata(),
      },
      () => {
        // Downloads continue in the background; we do not block UI on progress.
      },
      () => {
        // Failures are retried the next time the app is online and foregrounded.
      },
    );
  }

  if (options?.revalidateMatchingPack && hadMatchingPack) {
    await OfflineManager.invalidatePack(matchingPack.id);
  }

  const packStatus = await matchingPack.status();

  if (packStatus.state !== "complete" || options?.revalidateMatchingPack) {
    await matchingPack.resume();
  }
}

function createDefaultOfflineRoadMapMetadata(): DefaultOfflineRoadMapMetadata {
  return {
    kind: DEFAULT_OFFLINE_ROAD_MAP_PACK_KIND,
    version: DEFAULT_OFFLINE_ROAD_MAP_VERSION,
    coverage: "estonia",
    styleKey: DEFAULT_MAP_STYLE_KEY,
    minZoom: DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM,
    maxZoom: DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM,
  };
}

function isManagedDefaultOfflineRoadMapPack(pack: OfflinePack) {
  return getPackMetadata(pack).kind === DEFAULT_OFFLINE_ROAD_MAP_PACK_KIND;
}

function isCurrentDefaultOfflineRoadMapPack(
  pack: OfflinePack,
  expectedBounds: LngLatBounds,
) {
  const metadata = getPackMetadata(pack);

  return (
    metadata.kind === DEFAULT_OFFLINE_ROAD_MAP_PACK_KIND &&
    metadata.version === DEFAULT_OFFLINE_ROAD_MAP_VERSION &&
    metadata.coverage === "estonia" &&
    metadata.styleKey === DEFAULT_MAP_STYLE_KEY &&
    metadata.minZoom === DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM &&
    metadata.maxZoom === DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM &&
    areBoundsEqual(pack.bounds, expectedBounds)
  );
}

function getPackMetadata(pack: OfflinePack): DefaultOfflineRoadMapMetadata {
  const metadata = pack.metadata as Partial<DefaultOfflineRoadMapMetadata>;

  return {
    kind: metadata.kind ?? "",
    version: Number(metadata.version ?? 0),
    coverage: metadata.coverage ?? "",
    styleKey: metadata.styleKey ?? "",
    minZoom: Number(metadata.minZoom ?? 0),
    maxZoom: Number(metadata.maxZoom ?? 0),
  };
}

function areBoundsEqual(left: LngLatBounds, right: LngLatBounds) {
  return left.every(
    (value, index) => Math.abs(value - right[index]) < 0.000001,
  );
}

async function resolveManagedDefaultOfflineRoadMapPacks(
  expectedBounds: LngLatBounds,
) {
  const packs = await OfflineManager.getPacks();
  const managedPacks = packs.filter(isManagedDefaultOfflineRoadMapPack);
  let matchingPack: OfflinePack | null = null;
  const duplicatePacks: OfflinePack[] = [];
  const outdatedPacks: OfflinePack[] = [];

  for (const pack of managedPacks) {
    if (isCurrentDefaultOfflineRoadMapPack(pack, expectedBounds)) {
      if (matchingPack) {
        duplicatePacks.push(pack);
      } else {
        matchingPack = pack;
      }

      continue;
    }

    outdatedPacks.push(pack);
  }

  return {
    managedPacks,
    matchingPack,
    duplicatePacks,
    outdatedPacks,
  };
}
