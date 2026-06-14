import { type CreateAdminLocationRequest } from "@/src/features/admin/api/adminLocationsApi";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import { type Location } from "@/src/features/locations/types/locationTypes";

export type LocationCreateDraft = {
  title: string;
  description: string;
  county: string;
  category: string;
  latitude: string;
  longitude: string;
  status: string;
  difficulty: string;
  experience: string;
  notes: string;
  imageUrl: string;
};

export type CoordinateSelection = {
  latitude: number;
  longitude: number;
};

export const LOCATION_STATUS_OPTIONS = [
  { key: "1", label: "Active" },
  { key: "0", label: "Inactive" },
  { key: "2", label: "Disabled" },
] as const;

export const LOCATION_CATEGORY_OPTIONS = [
  { key: "Nature", label: "Nature" },
  { key: "Urbex", label: "Urbex" },
  { key: "Camping", label: "Camping" },
  { key: "Sightseeing", label: "Sightseeing" },
] as const;

export const INITIAL_CREATE_DRAFT: LocationCreateDraft = {
  title: "",
  description: "",
  county: "",
  category: "Nature",
  latitude: "",
  longitude: "",
  status: "1",
  difficulty: "0",
  experience: "0",
  notes: "",
  imageUrl: "",
};

export function buildCreateLocationPayload(
  draft: LocationCreateDraft,
):
  | { success: true; value: CreateAdminLocationRequest }
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

  const category = parseLocationCategoryValue(draft.category);
  if (!category.success) {
    return category;
  }

  const status = parseLocationStatusValue(draft.status);
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
      imageUrl: draft.imageUrl,
      experience: experience.value,
      difficulty: difficulty.value,
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

  if (status === 2) {
    return "Disabled";
  }

  return "Unknown";
}

export function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? "Select";
}

export function normalizeLocationCategoryValue(value: string | null | undefined) {
  const normalizedValue = normalizeCategory(value);

  return (
    LOCATION_CATEGORY_OPTIONS.find((option) => option.label === normalizedValue)
      ?.key ?? normalizedValue
  );
}

export function toNullableImageUrl(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return trimmedValue;
}

export function parseDraftCoordinates(
  draft: Pick<LocationCreateDraft, "latitude" | "longitude">,
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

export function appendCreatedLocationToActiveCache(
  cachedLocations: Location[],
  createdLocation: Location,
) {
  const locationsWithoutCreatedLocation = cachedLocations.filter(
    (cachedLocation) => cachedLocation.id !== createdLocation.id,
  );

  if (createdLocation.status !== 1) {
    return locationsWithoutCreatedLocation;
  }

  return [...locationsWithoutCreatedLocation, createdLocation];
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

function parseLocationStatusValue(
  rawValue: string,
):
  | { success: true; value: number }
  | { success: false; message: string } {
  const trimmedValue = rawValue.trim();

  if (LOCATION_STATUS_OPTIONS.some((option) => option.key === trimmedValue)) {
    return {
      success: true,
      value: Number(trimmedValue),
    };
  }

  return {
    success: false,
    message: "Status must be Active, Inactive, or Disabled.",
  };
}

function parseLocationCategoryValue(
  rawValue: string,
):
  | { success: true; value: string }
  | { success: false; message: string } {
  const normalizedValue = normalizeLocationCategoryValue(rawValue);

  if (
    LOCATION_CATEGORY_OPTIONS.some((option) => option.key === normalizedValue)
  ) {
    return {
      success: true,
      value: normalizedValue,
    };
  }

  return {
    success: false,
    message: "Category must be Nature, Urbex, Camping, or Sightseeing.",
  };
}
