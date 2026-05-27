import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

type RoadLabelLayerCandidate = {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  ["source-layer"]?: string;
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

  const layers = (styleSpecification as { layers: unknown[] }).layers.map(
    (layer) => {
      if (!isRoadLabelLayerCandidate(layer)) {
        return layer;
      }

      const currentSpacing =
        typeof layer.layout?.["symbol-spacing"] === "number"
          ? layer.layout["symbol-spacing"]
          : null;

      return {
        ...layer,
        layout: {
          ...(layer.layout ?? {}),
          "symbol-spacing": Math.max(
            options.roadLabelSpacingMin,
            (currentSpacing ?? 500) + options.roadLabelSpacingDelta,
          ),
        },
      };
    },
  );

  return {
    ...(styleSpecification as StyleSpecification),
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
