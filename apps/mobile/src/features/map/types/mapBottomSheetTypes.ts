import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import type { Location } from "@/src/features/locations/types/locationTypes";

export type MapBottomSheetState = "hidden" | "collapsed" | "expanded";

export type MapBottomSheetSelection =
  | {
      kind: "location";
      item: Location;
    }
  | {
      kind: "journey";
      item: Journey;
    };

export type MapSelectionCoordinates = {
  latitude: number;
  longitude: number;
};
