import {
  DiscoveryCheckResponse,
  DiscoveryProgressSummary,
} from "@/src/features/discoveries/types/discoveryTypes";
import { Journey } from "@/src/features/journeys/types/journeyTypes";
import { Location } from "@/src/features/locations/types/locationTypes";

export function getLocationVisitStatusLabel(
  location: Pick<Location, "discovered" | "discoveredAt">,
) {
  if (!location.discovered) {
    return "Not discovered yet";
  }

  if (!location.discoveredAt) {
    return "Discovered";
  }

  return `Discovered ${formatShortDate(location.discoveredAt)}`;
}

export function getJourneyCompletionStatusLabel(
  journey: Pick<Journey, "completed" | "completedAt">,
) {
  if (!journey.completed) {
    return "Journey not completed yet";
  }

  if (!journey.completedAt) {
    return "Completed";
  }

  return `Completed ${formatShortDate(journey.completedAt)}`;
}

export function getRecentActivityEmptyMessage(
  progressSummary: DiscoveryProgressSummary,
) {
  if (
    progressSummary.locationsVisited === 0 &&
    progressSummary.journeysCompleted === 0
  ) {
    return "Completed journeys, discovered locations, and unlocked milestones will show up here later.";
  }

  return "Your saved discovery history is still building out locally.";
}

export function buildDiscoveryBannerMessage(
  response: DiscoveryCheckResponse,
) {
  const parts: string[] = [];

  if (response.discoveredLocationCount > 0) {
    parts.push(
      `${response.discoveredLocationCount} location${response.discoveredLocationCount === 1 ? "" : "s"} discovered`,
    );
  }

  if (response.completedJourneyCount > 0) {
    parts.push(
      `${response.completedJourneyCount} journey${response.completedJourneyCount === 1 ? "" : "s"} completed`,
    );
  }

  return parts.join(" | ");
}

export function formatShortDate(value: string) {
  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return "recently";
  }

  return new Date(parsedValue).toLocaleDateString();
}
