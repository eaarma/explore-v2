import { normalizeCategory as normalizeJourneyCategory } from "@/src/features/journeys/components/journeysSectionShared";
import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { normalizeCategory as normalizeLocationCategory } from "@/src/features/locations/components/locationsSectionShared";
import type { Location } from "@/src/features/locations/types/locationTypes";

export type MapSearchResult = {
  key: string;
  kind: "location" | "journey";
  id: number;
  title: string;
  county: string;
  category: string;
  latitude: number;
  longitude: number;
  score: number;
};

export function buildMapSearchResults(
  locations: Location[],
  journeys: Journey[],
  query: string,
) {
  if (!query) {
    return [];
  }

  const locationResults: MapSearchResult[] = [];

  for (const location of locations) {
    const score = getMapSearchScore(
      {
        title: location.title,
        description: location.description,
        county: location.county,
        category: normalizeLocationCategory(location.category),
      },
      query,
    );

    if (score === null) {
      continue;
    }

    locationResults.push({
      key: `location-${location.id}`,
      kind: "location",
      id: location.id,
      title: location.title,
      county: location.county,
      category: normalizeLocationCategory(location.category),
      latitude: location.latitude,
      longitude: location.longitude,
      score,
    });
  }

  const journeyResults: MapSearchResult[] = [];

  for (const journey of journeys) {
    const score = getMapSearchScore(
      {
        title: journey.title,
        description: journey.description,
        county: journey.county,
        category: normalizeJourneyCategory(journey.category),
      },
      query,
    );

    if (score === null) {
      continue;
    }

    journeyResults.push({
      key: `journey-${journey.id}`,
      kind: "journey",
      id: journey.id,
      title: journey.title,
      county: journey.county,
      category: normalizeJourneyCategory(journey.category),
      latitude: journey.latitude,
      longitude: journey.longitude,
      score,
    });
  }

  return [...locationResults, ...journeyResults].sort((left, right) => {
    if (left.score !== right.score) {
      return left.score - right.score;
    }

    return left.title.localeCompare(right.title);
  });
}

function getMapSearchScore(
  fields: {
    title: string;
    description: string;
    county: string;
    category: string;
  },
  query: string,
) {
  const normalizedTitle = normalizeSearchValue(fields.title);
  const normalizedCounty = normalizeSearchValue(fields.county);
  const normalizedCategory = normalizeSearchValue(fields.category);
  const normalizedDescription = normalizeSearchValue(fields.description);

  if (normalizedTitle.startsWith(query)) {
    return 0;
  }

  if (normalizedTitle.includes(query)) {
    return 1;
  }

  if (normalizedCounty.includes(query)) {
    return 2;
  }

  if (normalizedCategory.includes(query)) {
    return 3;
  }

  if (normalizedDescription.includes(query)) {
    return 4;
  }

  return null;
}

function normalizeSearchValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}
