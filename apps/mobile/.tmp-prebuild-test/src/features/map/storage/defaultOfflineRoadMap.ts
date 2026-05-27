import {
  OfflineManager,
  type LngLatBounds,
  type OfflinePack,
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

let ensureDefaultOfflineRoadMapPackPromise: Promise<void> | null = null;

type DefaultOfflineRoadMapMetadata = {
  kind: string;
  version: number;
  coverage: string;
  styleKey: string;
  minZoom: number;
  maxZoom: number;
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

async function doEnsureDefaultOfflineRoadMapPack() {
  if (!hasConfiguredMapTilerApiKey()) {
    return;
  }

  const expectedBounds = [...DEFAULT_OFFLINE_ROAD_MAP_BOUNDS] as LngLatBounds;
  const packs = await OfflineManager.getPacks();

  let matchingPack: OfflinePack | null = null;
  const duplicatePacks: OfflinePack[] = [];
  const outdatedPacks: OfflinePack[] = [];

  for (const pack of packs) {
    if (!isManagedDefaultOfflineRoadMapPack(pack)) {
      continue;
    }

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

  const packStatus = await matchingPack.status();

  if (packStatus.state !== "complete") {
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
