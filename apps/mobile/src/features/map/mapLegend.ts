export type MapLegendSwatchConfig =
  | {
      kind: "fill";
      color: string;
      borderColor?: string;
    }
  | {
      kind: "line";
      color: string;
      casingColor?: string;
    }
  | {
      kind: "ring";
      color: string;
      borderColor?: string;
    }
  | {
      kind: "marker";
      color: string;
      borderColor: string;
      shape: "circle" | "diamond";
    };

type MapLegendItem = {
  label: string;
  detail: string;
  swatch: MapLegendSwatchConfig;
};

type MapLegendSection = {
  title: string;
  items: MapLegendItem[];
};

export const MAP_LEGEND_SECTIONS: MapLegendSection[] = [
  {
    title: "Markers",
    items: [
      {
        label: "Location marker",
        detail: "Category marker for an individual location.",
        swatch: {
          kind: "marker",
          color: "#292df8",
          borderColor: "#CCFBF1",
          shape: "circle",
        },
      },
      {
        label: "Journey marker",
        detail: "Journey markers sit above locations when they overlap.",
        swatch: {
          kind: "marker",
          color: "#fb7202",
          borderColor: "#DBEAFE",
          shape: "diamond",
        },
      },
      {
        label: "Active item ring",
        detail: "Gold halo for the currently active highlight.",
        swatch: {
          kind: "ring",
          color: "rgba(250, 204, 21, 0.2)",
          borderColor: "#FACC15",
        },
      },
      {
        label: "Active trip ring",
        detail: "Purple halo for locations and journeys in the selected trip.",
        swatch: {
          kind: "ring",
          color: "rgba(147, 51, 234, 0.18)",
          borderColor: "#A855F7",
        },
      },
    ],
  },
  {
    title: "Terrain and trails",
    items: [
      {
        label: "Hillshade",
        detail: "Grey terrain shading to reveal ridges, slopes, and relief.",
        swatch: {
          kind: "fill",
          color: "#7C8796",
          borderColor: "#5B6674",
        },
      },
      {
        label: "Hiking path",
        detail: "Local footways, tracks, steps, and paths.",
        swatch: {
          kind: "line",
          color: "#84CC16",
          casingColor: "#1F2937",
        },
      },
      {
        label: "Marked trail route",
        detail: "Named or color-coded hiking route from trail data.",
        swatch: {
          kind: "line",
          color: "#F59E0B",
          casingColor: "#111827",
        },
      },
      {
        label: "Trail name",
        detail: "Dynamic label placed along the hiking trail line.",
        swatch: {
          kind: "fill",
          color: "#14532D",
          borderColor: "#DCFCE7",
        },
      },
    ],
  },
  {
    title: "Nature overlays",
    items: [
      {
        label: "Protected areas",
        detail: "National parks, reserves, and other protected nature zones.",
        swatch: {
          kind: "fill",
          color: "#74C69D",
          borderColor: "#2F855A",
        },
      },
      {
        label: "Wetlands",
        detail: "Bogs, marshes, swamps, reedbeds, and other wet ground.",
        swatch: {
          kind: "fill",
          color: "#6BA39B",
          borderColor: "#3A6F68",
        },
      },
    ],
  },
  {
    title: "Water and hydrology",
    items: [
      {
        label: "Water body",
        detail: "Lakes, river polygons, shoreline water, and small basins.",
        swatch: {
          kind: "fill",
          color: "#9DD7F5",
          borderColor: "#4B9FD3",
        },
      },
      {
        label: "River or stream",
        detail:
          "Streams, rivers, canals, drains, ditches, and similar flow lines.",
        swatch: {
          kind: "line",
          color: "#4EA8DE",
          casingColor: "#1E5E86",
        },
      },
      {
        label: "Shoreline",
        detail: "Edge highlight for lakes and other mapped water polygons.",
        swatch: {
          kind: "line",
          color: "#4B9FD3",
        },
      },
    ],
  },
  {
    title: "Land cover",
    items: [
      {
        label: "Forest and wood",
        detail: "Forest, woodland, scrub, and related natural cover.",
        swatch: {
          kind: "fill",
          color: "#5C8B57",
          borderColor: "#3F6B42",
        },
      },
      {
        label: "Grassland and meadow",
        detail: "Open grassy terrain, meadow, and similar low vegetation.",
        swatch: {
          kind: "fill",
          color: "#ABD88B",
          borderColor: "#99C979",
        },
      },
      {
        label: "Fields and agriculture",
        detail: "Farmland, orchard, vineyard, and other cultivated ground.",
        swatch: {
          kind: "fill",
          color: "#D6C178",
          borderColor: "#AE9851",
        },
      },
      {
        label: "Urban land",
        detail: "Commercial, industrial, retail, and built-up city surfaces.",
        swatch: {
          kind: "fill",
          color: "#CBD5E1",
          borderColor: "#B8B1BE",
        },
      },
    ],
  },
];
