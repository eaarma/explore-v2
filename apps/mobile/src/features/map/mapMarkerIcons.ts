import type { ImageEntry } from "@maplibre/maplibre-react-native";

export type MapMarkerKind = "location" | "journey";

export type MapMarkerState = "default" | "achieved" | "active";

type MarkerVisualCategory =
  | "nature"
  | "hiking"
  | "camping"
  | "sightseeing"
  | "urbex"
  | "adventure";

export type MapMarkerImageId =
  `${MapMarkerKind}-${MarkerVisualCategory}-${MapMarkerState}`;

const VISUAL_CATEGORY_BY_CATEGORY: Record<string, MarkerVisualCategory> = {
  Adventure: "adventure",
  Camping: "camping",
  Hiking: "hiking",
  Historic: "sightseeing",
  Nature: "nature",
  Sightseeing: "sightseeing",
  Unknown: "adventure",
  Urbex: "urbex",
};

export const mapMarkerImages: Record<MapMarkerImageId, ImageEntry> = {
  "location-adventure-default": require("../../../assets/map-markers/location-adventure-default.png"),
  "location-adventure-achieved": require("../../../assets/map-markers/location-adventure-achieved.png"),
  "location-adventure-active": require("../../../assets/map-markers/location-adventure-active.png"),
  "location-camping-default": require("../../../assets/map-markers/location-camping-default.png"),
  "location-camping-achieved": require("../../../assets/map-markers/location-camping-achieved.png"),
  "location-camping-active": require("../../../assets/map-markers/location-camping-active.png"),
  "location-hiking-default": require("../../../assets/map-markers/location-hiking-default.png"),
  "location-hiking-achieved": require("../../../assets/map-markers/location-hiking-achieved.png"),
  "location-hiking-active": require("../../../assets/map-markers/location-hiking-active.png"),
  "location-nature-default": require("../../../assets/map-markers/location-nature-default.png"),
  "location-nature-achieved": require("../../../assets/map-markers/location-nature-achieved.png"),
  "location-nature-active": require("../../../assets/map-markers/location-nature-active.png"),
  "location-sightseeing-default": require("../../../assets/map-markers/location-sightseeing-default.png"),
  "location-sightseeing-achieved": require("../../../assets/map-markers/location-sightseeing-achieved.png"),
  "location-sightseeing-active": require("../../../assets/map-markers/location-sightseeing-active.png"),
  "location-urbex-default": require("../../../assets/map-markers/location-urbex-default.png"),
  "location-urbex-achieved": require("../../../assets/map-markers/location-urbex-achieved.png"),
  "location-urbex-active": require("../../../assets/map-markers/location-urbex-active.png"),
  "journey-adventure-default": require("../../../assets/map-markers/journey-adventure-default.png"),
  "journey-adventure-achieved": require("../../../assets/map-markers/journey-adventure-achieved.png"),
  "journey-adventure-active": require("../../../assets/map-markers/journey-adventure-active.png"),
  "journey-camping-default": require("../../../assets/map-markers/journey-camping-default.png"),
  "journey-camping-achieved": require("../../../assets/map-markers/journey-camping-achieved.png"),
  "journey-camping-active": require("../../../assets/map-markers/journey-camping-active.png"),
  "journey-hiking-default": require("../../../assets/map-markers/journey-hiking-default.png"),
  "journey-hiking-achieved": require("../../../assets/map-markers/journey-hiking-achieved.png"),
  "journey-hiking-active": require("../../../assets/map-markers/journey-hiking-active.png"),
  "journey-nature-default": require("../../../assets/map-markers/journey-nature-default.png"),
  "journey-nature-achieved": require("../../../assets/map-markers/journey-nature-achieved.png"),
  "journey-nature-active": require("../../../assets/map-markers/journey-nature-active.png"),
  "journey-sightseeing-default": require("../../../assets/map-markers/journey-sightseeing-default.png"),
  "journey-sightseeing-achieved": require("../../../assets/map-markers/journey-sightseeing-achieved.png"),
  "journey-sightseeing-active": require("../../../assets/map-markers/journey-sightseeing-active.png"),
  "journey-urbex-default": require("../../../assets/map-markers/journey-urbex-default.png"),
  "journey-urbex-achieved": require("../../../assets/map-markers/journey-urbex-achieved.png"),
  "journey-urbex-active": require("../../../assets/map-markers/journey-urbex-active.png"),
};

export function getMapMarkerState(
  achieved: boolean,
  active: boolean,
): MapMarkerState {
  if (active) {
    return "active";
  }

  if (achieved) {
    return "achieved";
  }

  return "default";
}

export function getMapMarkerImageId(
  kind: MapMarkerKind,
  category: string | null | undefined,
  state: MapMarkerState,
): MapMarkerImageId {
  const visualCategory = VISUAL_CATEGORY_BY_CATEGORY[category ?? ""] ?? "adventure";

  return `${kind}-${visualCategory}-${state}`;
}
