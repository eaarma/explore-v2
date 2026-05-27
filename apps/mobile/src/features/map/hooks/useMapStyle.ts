import { useEffect, useState } from "react";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import {
  buildMapStyleUrl,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import {
  buildAdjustedMapStyle,
  resolveRoadLabelLayerId,
} from "@/src/features/map/utils/mapStyle";

export function useMapStyle(selectedMapStyle: MapStyleKey) {
  const currentMapStyleUrl = buildMapStyleUrl(selectedMapStyle);
  const [roadLabelLayerId, setRoadLabelLayerId] = useState<string | null>(null);
  const [resolvedMapStyle, setResolvedMapStyle] = useState<
    string | StyleSpecification
  >(currentMapStyleUrl);

  useEffect(() => {
    const abortController = new AbortController();
    setResolvedMapStyle(currentMapStyleUrl);

    async function loadRoadLabelLayerId() {
      try {
        const response = await fetch(currentMapStyleUrl, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load map style (${response.status}).`);
        }

        const styleSpecification = await response.json();

        if (abortController.signal.aborted) {
          return;
        }

        setResolvedMapStyle(
          buildAdjustedMapStyle(styleSpecification, {
            roadLabelSpacingMin: 50,
            roadLabelSpacingDelta: 50,
          }),
        );
        setRoadLabelLayerId(resolveRoadLabelLayerId(styleSpecification) ?? null);
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        setResolvedMapStyle(currentMapStyleUrl);
        setRoadLabelLayerId(null);
      }
    }

    void loadRoadLabelLayerId();

    return () => {
      abortController.abort();
    };
  }, [currentMapStyleUrl]);

  return {
    resolvedMapStyle,
    roadLabelLayerId,
  };
}
