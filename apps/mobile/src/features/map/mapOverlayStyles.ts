import { buildMapTilerTilesetUrl } from "@/src/features/map/mapConfig";

export const MAPTILER_HILLSHADE_OVERLAY_TILESET_URL =
  buildMapTilerTilesetUrl("hillshade");
export const MAPTILER_OUTDOOR_TILESET_URL =
  buildMapTilerTilesetUrl("outdoor");
export const MAPTILER_OPENMAPTILES_TILESET_URL = buildMapTilerTilesetUrl("v3");
export const MAPTILER_HILLSHADE_ATTRIBUTION = "\u00A9 MapTiler";
export const MAPTILER_OUTDOOR_ATTRIBUTION =
  "\u00A9 MapTiler \u00A9 OpenStreetMap contributors";

export const hillshadeOverlayPaint = {
  "raster-opacity": 0.32,
  "raster-contrast": 0.08,
  "raster-saturation": -1,
  "raster-fade-duration": 0,
} as any;

export const hiddenRasterOverlayPaint = {
  "raster-opacity": 0,
  "raster-fade-duration": 0,
} as any;

export const landcoverOverlayNaturalFilter = [
  "any",
  ["==", ["get", "class"], "wood"],
  ["==", ["get", "class"], "grass"],
  ["==", ["get", "class"], "farmland"],
] as any;

export const landcoverOverlayUrbanFilter = [
  "any",
  ["==", ["get", "class"], "residential"],
  ["==", ["get", "class"], "commercial"],
  ["==", ["get", "class"], "industrial"],
  ["==", ["get", "class"], "retail"],
  ["==", ["get", "class"], "garages"],
  ["==", ["get", "class"], "suburb"],
  ["==", ["get", "class"], "quarter"],
  ["==", ["get", "class"], "neighbourhood"],
] as any;

export const wetlandOverlayFilter = ["==", ["get", "class"], "wetland"] as any;

export const protectedAreaOverlayFilter = ["has", "class"] as any;

export const hydrologyWaterPolygonFilter = [
  "any",
  ["==", ["get", "class"], "lake"],
  ["==", ["get", "class"], "river"],
  ["==", ["get", "class"], "ocean"],
] as any;

export const hydrologyWaterwayFilter = [
  "any",
  ["==", ["get", "class"], "stream"],
  ["==", ["get", "class"], "river"],
  ["==", ["get", "class"], "canal"],
  ["==", ["get", "class"], "drain"],
  ["==", ["get", "class"], "ditch"],
] as any;

export const landcoverOverlaySourceLayerProps = {
  "source-layer": "landcover",
} as any;

export const landuseOverlaySourceLayerProps = {
  "source-layer": "landuse",
} as any;

export const parkOverlaySourceLayerProps = {
  "source-layer": "park",
} as any;

export const waterOverlaySourceLayerProps = {
  "source-layer": "water",
} as any;

export const waterwayOverlaySourceLayerProps = {
  "source-layer": "waterway",
} as any;

export const landcoverOverlayNaturalPaint = {
  "fill-color": [
    "match",
    ["get", "subclass"],
    "forest",
    "#3F6B42",
    "wood",
    "#5C8B57",
    "orchard",
    "#93A64A",
    "vineyard",
    "#AE9851",
    "plant_nursery",
    "#96A96A",
    "grassland",
    "#99C979",
    "meadow",
    "#ABD88B",
    "scrub",
    "#7EA06E",
    "heath",
    "#A7B26A",
    [
      "match",
      ["get", "class"],
      "wood",
      "#5C8B57",
      "grass",
      "#A8D97A",
      "farmland",
      "#D6C178",
      "#7EA06E",
    ],
  ],
  "fill-opacity": 0.24,
} as any;

export const landcoverOverlayUrbanPaint = {
  "fill-color": [
    "match",
    ["get", "class"],
    "commercial",
    "#C7CBD4",
    "industrial",
    "#B8B1BE",
    "retail",
    "#D1C7C2",
    "#CBD5E1",
  ],
  "fill-opacity": 0.18,
} as any;

export const wetlandOverlayFillPaint = {
  "fill-color": [
    "match",
    ["get", "subclass"],
    "bog",
    "#6D8F84",
    "marsh",
    "#72A59A",
    "swamp",
    "#5E8B7E",
    "reedbed",
    "#8AAE72",
    "#6BA39B",
  ],
  "fill-opacity": 0.26,
} as any;

export const wetlandOverlayLinePaint = {
  "line-color": "#3A6F68",
  "line-opacity": 0.44,
  "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 12, 1.2, 15, 1.8],
} as any;

export const protectedAreaOverlayFillPaint = {
  "fill-color": [
    "match",
    ["get", "class"],
    "national_park",
    "#7CCB8A",
    "nature_reserve",
    "#58B98B",
    "protected_area",
    "#74C69D",
    "#84D3A6",
  ],
  "fill-opacity": 0.14,
} as any;

export const protectedAreaOverlayLinePaint = {
  "line-color": [
    "match",
    ["get", "class"],
    "national_park",
    "#2F855A",
    "nature_reserve",
    "#0F766E",
    "protected_area",
    "#2C7A7B",
    "#3F8F6B",
  ],
  "line-opacity": 0.6,
  "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.9, 10, 1.2, 14, 1.8],
} as any;

export const hydrologyWaterFillPaint = {
  "fill-color": [
    "match",
    ["get", "class"],
    "river",
    "#8CCAF2",
    "lake",
    "#9DD7F5",
    "ocean",
    "#A7DCF7",
    "#9DD7F5",
  ],
  "fill-opacity": 0.22,
} as any;

export const hydrologyShorelinePaint = {
  "line-color": "#4B9FD3",
  "line-opacity": 0.42,
  "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 9, 0.9, 13, 1.4],
} as any;

export const hydrologyWaterwayCasingPaint = {
  "line-color": "#1E5E86",
  "line-opacity": 0.28,
  "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.2, 11, 1.8, 14, 2.8],
} as any;

export const hydrologyWaterwayPaint = {
  "line-color": [
    "match",
    ["get", "class"],
    "stream",
    "#7CC9F5",
    "river",
    "#4EA8DE",
    "canal",
    "#3B82C4",
    "drain",
    "#8DCFEA",
    "ditch",
    "#9DD8EE",
    "#66B7E8",
  ],
  "line-opacity": 0.76,
  "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 11, 1.3, 14, 2],
} as any;

export const hikingTrailOverlayLayout = {
  "line-cap": "round",
  "line-join": "round",
} as any;

export const hikingPathOverlayFilter = [
  "any",
  ["==", ["get", "class"], "path"],
  ["==", ["get", "class"], "track"],
  ["==", ["get", "class"], "footway"],
  ["==", ["get", "class"], "steps"],
] as any;

export const hikingTrailOverlayFilter = ["has", "class"] as any;

export const hikingTrailLabelFilter = [
  "all",
  hikingTrailOverlayFilter,
  ["any", ["has", "name"], ["has", "ref"]],
] as any;

export const hikingPathOverlaySourceLayerProps = {
  "source-layer": "transportation",
} as any;

export const hikingTrailOverlaySourceLayerProps = {
  "source-layer": "trail",
} as any;

export const hikingPathOverlayCasingPaint = {
  "line-color": "#1F2937",
  "line-opacity": 0.26,
  "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2.1, 12, 2.8, 15, 3.8],
} as any;

export const hikingPathOverlayPaint = {
  "line-color": "#84CC16",
  "line-opacity": 0.42,
  "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1, 12, 1.4, 15, 2],
} as any;

export const hikingTrailOverlayCasingPaint = {
  "line-color": "#111827",
  "line-opacity": 0.38,
  "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2.8, 12, 3.6, 15, 5],
} as any;

export const hikingTrailOverlayPaint = {
  "line-color": [
    "match",
    ["get", "color"],
    "red",
    "#EF4444",
    "blue",
    "#38BDF8",
    "green",
    "#22C55E",
    "yellow",
    "#FACC15",
    "brown",
    "#B45309",
    "orange",
    "#F97316",
    "purple",
    "#A855F7",
    "black",
    "#0F172A",
    "#F59E0B",
  ],
  "line-opacity": 0.58,
  "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 12, 2.2, 15, 3.2],
} as any;

export const hikingTrailLabelLayout = {
  "symbol-placement": "line",
  "symbol-spacing": 520,
  "text-field": ["coalesce", ["get", "name"], ["get", "ref"]],
  "text-size": [
    "interpolate",
    ["linear"],
    ["zoom"],
    11,
    10.5,
    13,
    11.5,
    15,
    13,
  ],
  "text-letter-spacing": 0.02,
  "text-max-angle": 35,
  "text-keep-upright": true,
  "text-ignore-placement": true,
} as any;

export const hikingTrailLabelPaint = {
  "text-color": "#14532D",
  "text-opacity": 0.9,
  "text-halo-color": "rgba(248, 250, 252, 0.92)",
  "text-halo-width": 1.4,
  "text-halo-blur": 0.6,
} as any;
