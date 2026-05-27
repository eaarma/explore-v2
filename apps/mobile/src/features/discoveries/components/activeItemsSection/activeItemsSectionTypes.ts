import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";

export type ActiveListItem =
  | {
      key: string;
      kind: "location";
      activeAt: string;
      location: Location;
    }
  | {
      key: string;
      kind: "journey";
      activeAt: string;
      journey: Journey;
      stopCount: number;
      previewImageUrl: string | null;
    };

export type TripSelectionTarget =
  | {
      kind: "location";
      label: string;
      locationId: number;
    }
  | {
      kind: "journey";
      label: string;
      journeyId: number;
    };
