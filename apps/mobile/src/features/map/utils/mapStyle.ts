import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

type RoadLabelLayerCandidate = {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  ["source-layer"]?: string;
};

type StyleSourceCandidate = {
  type?: unknown;
  url?: unknown;
  tiles?: unknown;
  data?: unknown;
};

type StyleLayerCandidate = {
  source?: unknown;
};

export function isRoadLabelLayerCandidate(
  layer: unknown,
): layer is RoadLabelLayerCandidate {
  if (!layer || typeof layer !== "object") {
    return false;
  }

  const id =
    typeof (layer as { id?: unknown }).id === "string"
      ? (layer as { id: string }).id
      : null;
  const type =
    typeof (layer as { type?: unknown }).type === "string"
      ? (layer as { type: string }).type
      : null;
  const sourceLayer =
    typeof (layer as { ["source-layer"]?: unknown })["source-layer"] ===
    "string"
      ? (layer as { ["source-layer"]: string })["source-layer"]
      : null;

  if (!id || type !== "symbol") {
    return false;
  }

  const roadLabelSourceLayers = new Set([
    "road_label",
    "transportation_name",
    "road_name",
  ]);

  if (sourceLayer && roadLabelSourceLayers.has(sourceLayer)) {
    return true;
  }

  const normalizedId = id.toLowerCase();
  return (
    normalizedId.includes("road") &&
    (normalizedId.includes("label") || normalizedId.includes("name"))
  );
}

export function buildAdjustedMapStyle(
  styleSpecification: unknown,
  options: {
    roadLabelSpacingMin: number;
    roadLabelSpacingDelta: number;
  },
): StyleSpecification | string {
  if (
    !styleSpecification ||
    typeof styleSpecification !== "object" ||
    !Array.isArray((styleSpecification as { layers?: unknown[] }).layers)
  ) {
    return typeof styleSpecification === "string" ? styleSpecification : "";
  }

  const sanitizedStyle = sanitizeMapStyle(styleSpecification);
  const layers = sanitizedStyle.layers.map((layer) => {
    if (!isRoadLabelLayerCandidate(layer) || !supportsSymbolSpacing(layer)) {
      return layer;
    }

    const layout = (layer.layout ?? {}) as Record<string, unknown>;
    const currentSpacing =
      typeof layout["symbol-spacing"] === "number"
        ? layout["symbol-spacing"]
        : null;

    return {
      ...layer,
      layout: {
        ...layout,
        "symbol-spacing": Math.max(
          options.roadLabelSpacingMin,
          (currentSpacing ?? 500) + options.roadLabelSpacingDelta,
        ),
      },
    };
  });

  return {
    ...sanitizedStyle,
    layers: layers as StyleSpecification["layers"],
  };
}

export function resolveRoadLabelLayerId(styleSpecification: unknown) {
  if (
    !styleSpecification ||
    typeof styleSpecification !== "object" ||
    !Array.isArray((styleSpecification as { layers?: unknown[] }).layers)
  ) {
    return null;
  }

  for (const layer of (styleSpecification as { layers: unknown[] }).layers) {
    if (isRoadLabelLayerCandidate(layer)) {
      return layer.id;
    }
  }

  return null;
}

function sanitizeMapStyle(styleSpecification: unknown): StyleSpecification {
  const typedStyle = styleSpecification as StyleSpecification & {
    sources?: Record<string, StyleSourceCandidate>;
    layers: (StyleSpecification["layers"][number] & StyleLayerCandidate)[];
  };
  const sourceEntries = Object.entries(typedStyle.sources ?? {});
  const validSourceEntries = sourceEntries.filter(([, source]) =>
    isRenderableSource(source),
  );
  const validSourceIds = new Set(validSourceEntries.map(([sourceId]) => sourceId));
  const filteredLayers = typedStyle.layers.filter((layer) => {
    if (!layer || typeof layer !== "object") {
      return false;
    }

    if (!("source" in layer) || typeof layer.source !== "string") {
      return true;
    }

    return validSourceIds.has(layer.source);
  });

  return {
    ...typedStyle,
    sources: Object.fromEntries(validSourceEntries) as StyleSpecification["sources"],
    layers: filteredLayers as StyleSpecification["layers"],
  };
}

function isRenderableSource(source: StyleSourceCandidate) {
  if (!source || typeof source !== "object") {
    return false;
  }

  if (typeof source.url === "string" && source.url.trim().length > 0) {
    return true;
  }

  if (Array.isArray(source.tiles) && source.tiles.length > 0) {
    return true;
  }

  if ("data" in source) {
    return source.data !== null && source.data !== undefined;
  }

  return false;
}

function supportsSymbolSpacing(layer: RoadLabelLayerCandidate) {
  const symbolPlacement = layer.layout?.["symbol-placement"];
  return symbolPlacement === "line" || symbolPlacement === "line-center";
}
