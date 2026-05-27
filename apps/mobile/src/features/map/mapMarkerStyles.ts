const achievedMarkerExpression = ["boolean", ["get", "achieved"], false] as any;

const activeMarkerExpression = ["boolean", ["get", "active"], false] as any;

export const activeHighlightedFilter = ["==", ["get", "active"], true] as any;

export const tripHighlightedFilter =
  ["==", ["get", "tripHighlighted"], true] as any;

const selectedLocationMarkerIconSizeExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  0.42,
  0.336,
] as any;

const selectedJourneyMarkerIconSizeExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  0.456,
  0.372,
] as any;

const markerSortKeyExpression = [
  "case",
  ["boolean", ["get", "selected"], false],
  2,
  activeMarkerExpression,
  1,
  achievedMarkerExpression,
  0.5,
  0,
] as any;

const baseMarkerLayout = {
  "icon-image": ["get", "markerIcon"],
  "icon-anchor": "center",
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
  "symbol-sort-key": markerSortKeyExpression,
} as any;

export const locationMarkerLayout = {
  ...baseMarkerLayout,
  "icon-size": selectedLocationMarkerIconSizeExpression,
} as any;

export const journeyMarkerLayout = {
  ...baseMarkerLayout,
  "icon-size": selectedJourneyMarkerIconSizeExpression,
} as any;

export const locationActiveGlowPaint = {
  "circle-color": "#FACC15",
  "circle-opacity": 0.18,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 21, 16],
  "circle-blur": 0.9,
} as any;

export const locationActiveHighlightPaint = {
  "circle-color": "#FACC15",
  "circle-opacity": 0.04,
  "circle-radius": [
    "case",
    ["boolean", ["get", "selected"], false],
    16.5,
    12.5,
  ],
  "circle-stroke-color": "#FACC15",
  "circle-stroke-width": [
    "case",
    ["boolean", ["get", "selected"], false],
    4.5,
    3.5,
  ],
  "circle-stroke-opacity": 0.98,
} as any;

export const journeyActiveGlowPaint = {
  "circle-color": "#FACC15",
  "circle-opacity": 0.16,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 22, 17],
  "circle-blur": 0.9,
} as any;

export const journeyActiveHighlightPaint = {
  "circle-color": "#FACC15",
  "circle-opacity": 0.04,
  "circle-radius": [
    "case",
    ["boolean", ["get", "selected"], false],
    17.5,
    13.5,
  ],
  "circle-stroke-color": "#FACC15",
  "circle-stroke-width": [
    "case",
    ["boolean", ["get", "selected"], false],
    4.5,
    3.5,
  ],
  "circle-stroke-opacity": 0.98,
} as any;

export const locationTripGlowPaint = {
  "circle-color": "#9333EA",
  "circle-opacity": 0.17,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 24, 18.5],
  "circle-blur": 0.92,
} as any;

export const locationTripHighlightPaint = {
  "circle-color": "#9333EA",
  "circle-opacity": 0.035,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 19, 14.5],
  "circle-stroke-color": "#A855F7",
  "circle-stroke-width": [
    "case",
    ["boolean", ["get", "selected"], false],
    4.5,
    3.5,
  ],
  "circle-stroke-opacity": 0.98,
} as any;

export const journeyTripGlowPaint = {
  "circle-color": "#9333EA",
  "circle-opacity": 0.16,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 25, 19.5],
  "circle-blur": 0.92,
} as any;

export const journeyTripHighlightPaint = {
  "circle-color": "#9333EA",
  "circle-opacity": 0.035,
  "circle-radius": ["case", ["boolean", ["get", "selected"], false], 20, 15.5],
  "circle-stroke-color": "#A855F7",
  "circle-stroke-width": [
    "case",
    ["boolean", ["get", "selected"], false],
    4.5,
    3.5,
  ],
  "circle-stroke-opacity": 0.98,
} as any;

export const markerHitbox = {
  top: 14,
  right: 14,
  bottom: 14,
  left: 14,
} as const;
