import { type CreateAdminJourneyRequest } from "@/src/features/admin/api/adminJourneysApi";
import { formatRouteDistance, formatStopCount } from "@/src/features/journeys/components/journeysSectionShared";
import { type JourneyLocation } from "@/src/features/journeys/types/journeyLocationTypes";
import { type Journey } from "@/src/features/journeys/types/journeyTypes";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";

export type JourneyCreateDraft = {
  title: string;
  description: string;
  county: string;
  category: string;
  latitude: string;
  longitude: string;
  status: string;
  experience: string;
  distance: string;
  difficulty: string;
  polyline: string;
  notes: string;
  traits: string[];
};

export type CoordinateSelection = {
  latitude: number;
  longitude: number;
};

export const JOURNEY_STATUS_OPTIONS = [
  { key: "1", label: "Active" },
  { key: "0", label: "Inactive" },
] as const;

export const JOURNEY_CATEGORY_OPTIONS = [
  { key: "Hiking", label: "Hiking" },
  { key: "Historic", label: "Historic" },
  { key: "Urbex", label: "Urbex" },
  { key: "Camping", label: "Camping" },
  { key: "Sightseeing", label: "Sightseeing" },
  { key: "Adventure", label: "Adventure" },
] as const;

export const INITIAL_CREATE_DRAFT: JourneyCreateDraft = {
  title: "",
  description: "",
  county: "",
  category: "Hiking",
  latitude: "",
  longitude: "",
  status: "1",
  experience: "0",
  distance: "0",
  difficulty: "0",
  polyline: "",
  notes: "",
  traits: [],
};

export function buildCreateJourneyPayload(
  draft: JourneyCreateDraft,
):
  | { success: true; value: CreateAdminJourneyRequest }
  | { success: false; message: string } {
  const title = draft.title.trim();

  if (title.length === 0) {
    return {
      success: false,
      message: "Title is required.",
    };
  }

  const latitude = parseRequiredNumber(draft.latitude, "Latitude");
  if (!latitude.success) {
    return latitude;
  }

  const longitude = parseRequiredNumber(draft.longitude, "Longitude");
  if (!longitude.success) {
    return longitude;
  }

  const distance = parseRequiredNumber(draft.distance, "Distance");
  if (!distance.success) {
    return distance;
  }

  const category = parseJourneyCategoryValue(draft.category);
  if (!category.success) {
    return category;
  }

  const status = parseJourneyStatusValue(draft.status);
  if (!status.success) {
    return status;
  }

  const difficulty = parseRequiredInteger(draft.difficulty, "Difficulty");
  if (!difficulty.success) {
    return difficulty;
  }

  const experience = parseRequiredInteger(draft.experience, "Experience");
  if (!experience.success) {
    return experience;
  }

  return {
    success: true,
    value: {
      title,
      description: draft.description,
      latitude: latitude.value,
      longitude: longitude.value,
      county: draft.county,
      category: category.value,
      experience: experience.value,
      distance: distance.value,
      difficulty: difficulty.value,
      polyline: draft.polyline,
      traits: draft.traits.map((trait) => ({ name: trait })),
      notes: draft.notes,
      status: status.value,
    },
  };
}

export function getPublicationStatusLabel(status: number | null | undefined) {
  if (status === 1) {
    return "Active";
  }

  if (status === 0) {
    return "Inactive";
  }

  return "Unknown";
}

export function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? value;
}

export function normalizeJourneyCategoryValue(value: string | null | undefined) {
  const normalizedValue = normalizeCategory(value);

  return (
    JOURNEY_CATEGORY_OPTIONS.find((option) => option.label === normalizedValue)
      ?.key ?? normalizedValue
  );
}

export function normalizeTraitName(value: string) {
  return value.trim();
}

export function parseDraftCoordinates(
  draft: Pick<JourneyCreateDraft, "latitude" | "longitude">,
) {
  const latitude = Number(draft.latitude.trim());
  const longitude = Number(draft.longitude.trim());

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function buildCoordinateSummary(latitude: string, longitude: string) {
  const parsedCoordinates = parseDraftCoordinates({ latitude, longitude });

  if (!parsedCoordinates) {
    return "Add latitude and longitude manually or place a marker on the map.";
  }

  return `${parsedCoordinates.latitude.toFixed(6)}, ${parsedCoordinates.longitude.toFixed(6)}`;
}

export function buildSelectedCoordinateFeatureCollection(
  selectedCoordinates: CoordinateSelection | null,
) {
  if (!selectedCoordinates) {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [
            selectedCoordinates.longitude,
            selectedCoordinates.latitude,
          ] as [number, number],
        },
      },
    ],
  };
}

export function appendCreatedJourneyToActiveCache(
  cachedJourneys: Journey[],
  createdJourney: Journey,
) {
  const journeysWithoutCreatedJourney = cachedJourneys.filter(
    (cachedJourney) => cachedJourney.id !== createdJourney.id,
  );

  if (createdJourney.status !== 1) {
    return journeysWithoutCreatedJourney;
  }

  return [...journeysWithoutCreatedJourney, createdJourney];
}

export function appendCreatedJourneyLocationsToCache(
  cachedJourneyLocations: JourneyLocation[],
  createdJourney: Journey,
  createdJourneyLocations: JourneyLocation[],
) {
  const locationsWithoutJourney = cachedJourneyLocations.filter(
    (journeyLocation) => journeyLocation.journeyId !== createdJourney.id,
  );

  if (createdJourney.status !== 1) {
    return locationsWithoutJourney;
  }

  return [
    ...locationsWithoutJourney,
    ...normalizeJourneyLocationSortOrder(createdJourneyLocations),
  ].sort((left, right) => {
    if (left.journeyId !== right.journeyId) {
      return left.journeyId - right.journeyId;
    }

    return compareJourneyLocations(left, right);
  });
}

export function normalizeJourneyLocationSortOrder(locations: JourneyLocation[]) {
  return locations.map((location, index) => ({
    ...location,
    sortOrder: index,
  }));
}

export function compareJourneyLocations(
  left: JourneyLocation,
  right: JourneyLocation,
) {
  const leftOrder = Number.isFinite(left.sortOrder) ? left.sortOrder : Infinity;
  const rightOrder = Number.isFinite(right.sortOrder)
    ? right.sortOrder
    : Infinity;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.id - right.id;
}

export function formatDraftRouteDistance(rawValue: string) {
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return "Route length unknown";
  }

  return formatRouteDistance(parsedValue);
}

export function formatJourneyCreateStopCount(stopCount: number) {
  return formatStopCount(stopCount);
}

function parseRequiredNumber(
  rawValue: string,
  fieldLabel: string,
):
  | { success: true; value: number }
  | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return {
      success: false,
      message: `${fieldLabel} is required.`,
    };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue)) {
    return {
      success: false,
      message: `${fieldLabel} must be a valid number.`,
    };
  }

  return {
    success: true,
    value: parsedValue,
  };
}

function parseRequiredInteger(
  rawValue: string,
  fieldLabel: string,
):
  | { success: true; value: number }
  | { success: false; message: string } {
  const parsedValue = parseRequiredNumber(rawValue, fieldLabel);

  if (!parsedValue.success) {
    return parsedValue;
  }

  if (!Number.isInteger(parsedValue.value)) {
    return {
      success: false,
      message: `${fieldLabel} must be a whole number.`,
    };
  }

  return parsedValue;
}

function parseJourneyStatusValue(
  rawValue: string,
):
  | { success: true; value: number }
  | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (JOURNEY_STATUS_OPTIONS.some((option) => option.key === trimmedValue)) {
    return {
      success: true,
      value: Number(trimmedValue),
    };
  }

  return {
    success: false,
    message: "Status must be Active or Inactive.",
  };
}

function parseJourneyCategoryValue(
  rawValue: string,
):
  | { success: true; value: string }
  | { success: false; message: string } {
  const normalizedValue = normalizeJourneyCategoryValue(rawValue);

  if (
    JOURNEY_CATEGORY_OPTIONS.some((option) => option.key === normalizedValue)
  ) {
    return {
      success: true,
      value: normalizedValue,
    };
  }

  return {
    success: false,
    message:
      "Category must be Hiking, Historic, Urbex, Camping, Sightseeing, or Adventure.",
  };
}
