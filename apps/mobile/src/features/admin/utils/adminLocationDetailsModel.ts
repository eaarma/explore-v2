import {
  createAdminLocationImageDrafts,
  getAdminLocationImages,
  getAdminLocationImageUrls,
  getPrimaryAdminLocationImageUrl,
  type AdminLocationImageDraft,
} from "@/src/features/admin/components/AdminLocationImageManager";
import { normalizeCategory } from "@/src/features/locations/components/locationsSectionShared";
import {
  type Location,
  type LocationTrait,
} from "@/src/features/locations/types/locationTypes";
import { type UpdateAdminLocationRequest } from "@/src/features/admin/api/adminLocationsApi";

export type LocationEditDraft = {
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
  traits: string[];
  imageDrafts: AdminLocationImageDraft[];
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

export function parseLocationId(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }

  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(firstValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function createLocationEditDraft(location: Location): LocationEditDraft {
  return {
    title: location.title,
    description: location.description,
    county: location.county,
    category: normalizeLocationCategoryValue(location.category),
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    status: String(location.status),
    difficulty: String(location.difficulty),
    experience: String(location.experience),
    notes: normalizeOptionalText(location.notes),
    traits: normalizeTraitList(location.traits),
    imageDrafts: createAdminLocationImageDrafts(
      location.imageUrls,
      location.imageUrl,
    ),
  };
}

export function parseDraftCoordinates(
  draft: Pick<LocationEditDraft, "latitude" | "longitude">,
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

export function buildLocationUpdatePayload(
  draft: LocationEditDraft,
):
  | { success: true; value: UpdateAdminLocationRequest }
  | { success: false; message: string } {
  if (
    draft.imageDrafts.some(
      (imageDraft) => imageDraft.uploadState === "uploading",
    )
  ) {
    return {
      success: false,
      message: "Wait for the current image upload to finish before saving.",
    };
  }

  if (
    draft.imageDrafts.some((imageDraft) => imageDraft.uploadState === "error")
  ) {
    return {
      success: false,
      message: "Remove failed image uploads before saving the location.",
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

  const status = parseLocationStatusValue(draft.status);
  if (!status.success) {
    return status;
  }

  const category = parseLocationCategoryValue(draft.category);
  if (!category.success) {
    return category;
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
      title: draft.title,
      description: draft.description,
      latitude: latitude.value,
      longitude: longitude.value,
      county: draft.county,
      category: category.value,
      images: getAdminLocationImages(draft.imageDrafts),
      imageUrl: getPrimaryAdminLocationImageUrl(draft.imageDrafts),
      imageUrls: getAdminLocationImageUrls(draft.imageDrafts),
      traits: draft.traits.map((trait) => ({ name: trait })),
      experience: experience.value,
      difficulty: difficulty.value,
      notes: draft.notes,
      status: status.value,
    },
  };
}

export function mergeLocationForAdminView(
  previousLocation: Location,
  savedLocation: Location,
): Location {
  return {
    ...savedLocation,
    discovered: previousLocation.discovered,
    discoveredAt: previousLocation.discoveredAt,
    active: previousLocation.active,
    activeAt: previousLocation.activeAt,
  };
}

export function reconcileCachedLocationsAfterAdminSave(
  cachedLocations: Location[],
  nextLocation: Location,
) {
  const locationsWithoutSavedLocation = cachedLocations.filter(
    (cachedLocation) => cachedLocation.id !== nextLocation.id,
  );

  if (nextLocation.status !== 1) {
    return locationsWithoutSavedLocation;
  }

  return [...locationsWithoutSavedLocation, nextLocation];
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

export function normalizeOptionalText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

export function normalizeTraitName(value: unknown) {
  return normalizeOptionalText(value).trim();
}

export function normalizeTraitList(
  traits: string[] | LocationTrait[] | undefined,
) {
  if (!traits || traits.length === 0) {
    return [];
  }

  const normalizedTraits: string[] = [];
  const seenTraits = new Set<string>();

  for (const trait of traits) {
    const rawName = typeof trait === "string" ? trait : trait?.name;
    const normalizedName = normalizeTraitName(rawName);

    if (!normalizedName) {
      continue;
    }

    const dedupeKey = normalizedName.toLowerCase();

    if (seenTraits.has(dedupeKey)) {
      continue;
    }

    seenTraits.add(dedupeKey);
    normalizedTraits.push(normalizedName);
  }

  return normalizedTraits;
}

function parseRequiredNumber(
  rawValue: string,
  fieldLabel: string,
): { success: true; value: number } | { success: false; message: string } {
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
): { success: true; value: number } | { success: false; message: string } {
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
): { success: true; value: number } | { success: false; message: string } {
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
): { success: true; value: string } | { success: false; message: string } {
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

function normalizeLocationCategoryValue(value: string | null | undefined) {
  const normalizedValue = normalizeCategory(value);

  return (
    LOCATION_CATEGORY_OPTIONS.find((option) => option.label === normalizedValue)
      ?.key ?? normalizedValue
  );
}
