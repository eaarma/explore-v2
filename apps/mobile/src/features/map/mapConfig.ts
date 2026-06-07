import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

const MAPTILER_API_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY?.trim() ?? "";

export const DEFAULT_MAP_CENTER: [number, number] = [25.0136, 58.5953];
export const DEFAULT_MAP_STYLE_KEY = "road";
export const DEFAULT_OFFLINE_ROAD_MAP_BOUNDS = [
  21.45, 57.35, 28.45, 59.95,
] as const;
export const DEFAULT_OFFLINE_ROAD_MAP_MIN_ZOOM = 5;
export const DEFAULT_OFFLINE_ROAD_MAP_MAX_ZOOM = 11;

export const MAP_STYLE_OPTIONS = [
  {
    key: "road",
    label: "Road",
    mapId: "streets-v4",
    icon: "map-outline",
  },
  {
    key: "topography",
    label: "Topography",
    mapId: "topo-v2",
    icon: "triangle-outline",
  },
  {
    key: "satellite",
    label: "Satellite",
    mapId: "satellite",
    icon: "planet-outline",
  },
  {
    key: "hybrid",
    label: "Hybrid",
    mapId: "hybrid-v4",
    icon: "layers-outline",
  },
] as const;

export type MapStyleKey = (typeof MAP_STYLE_OPTIONS)[number]["key"];

export const MAP_OVERLAY_OPTIONS = [
  {
    key: "hillshade",
    label: "Hillshade",
    icon: "partly-sunny-outline",
  },
  {
    key: "hikingTrails",
    label: "Hiking trails",
    icon: "walk-outline",
  },
  {
    key: "protectedAreas",
    label: "Protected areas",
    icon: "shield-outline",
  },
  {
    key: "wetlands",
    label: "Wetlands",
    icon: "rainy-outline",
  },
  {
    key: "hydrology",
    label: "Water / hydrology",
    icon: "water-outline",
  },
  {
    key: "landcover",
    label: "Forest / land cover",
    icon: "leaf-outline",
  },
] as const;

export type MapOverlayKey = (typeof MAP_OVERLAY_OPTIONS)[number]["key"];

const FALLBACK_MAP_STYLE_SOURCES: Record<
  MapStyleKey,
  {
    attribution: string;
    maxzoom: number;
    name: string;
    tiles: string[];
  }
> = {
  road: {
    attribution: "OpenStreetMap contributors",
    maxzoom: 19,
    name: "Fallback Road",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
  },
  topography: {
    attribution: "OpenTopoMap contributors",
    maxzoom: 17,
    name: "Fallback Topography",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
  },
  satellite: {
    attribution: "Esri World Imagery",
    maxzoom: 19,
    name: "Fallback Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
  },
  hybrid: {
    attribution: "Esri World Imagery",
    maxzoom: 19,
    name: "Fallback Hybrid",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
  },
};

export function buildMapStyleUrl(mapStyle: MapStyleKey) {
  const selectedStyle =
    MAP_STYLE_OPTIONS.find((styleOption) => styleOption.key === mapStyle) ??
    MAP_STYLE_OPTIONS[0];

  return `https://api.maptiler.com/maps/${selectedStyle.mapId}/style.json?key=${MAPTILER_API_KEY}`;
}

export function buildFallbackMapStyle(mapStyle: MapStyleKey): StyleSpecification {
  const fallbackSource =
    FALLBACK_MAP_STYLE_SOURCES[mapStyle] ??
    FALLBACK_MAP_STYLE_SOURCES[DEFAULT_MAP_STYLE_KEY];

  return {
    center: DEFAULT_MAP_CENTER,
    layers: [
      {
        id: "fallback-raster-layer",
        source: "fallback-raster-source",
        type: "raster",
      },
    ],
    name: fallbackSource.name,
    sources: {
      "fallback-raster-source": {
        attribution: fallbackSource.attribution,
        maxzoom: fallbackSource.maxzoom,
        tileSize: 256,
        tiles: fallbackSource.tiles,
        type: "raster",
      },
    },
    version: 8,
    zoom: 7,
  } as StyleSpecification;
}

export function buildMapTilerTilesetUrl(tilesetId: string) {
  return `https://api.maptiler.com/tiles/${tilesetId}/tiles.json?key=${MAPTILER_API_KEY}`;
}

export function buildMapRasterTilesUrl(mapId: string) {
  return `https://api.maptiler.com/maps/${mapId}/tiles.json?key=${MAPTILER_API_KEY}`;
}

export function hasConfiguredMapTilerApiKey() {
  return MAPTILER_API_KEY.length > 0;
}
