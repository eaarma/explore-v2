import { useEffect, useMemo, useState } from "react";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import {
  buildFallbackMapStyle,
  buildMapStyleUrl,
  hasConfiguredMapTilerApiKey,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import {
  buildAdjustedMapStyle,
  resolveRoadLabelLayerId,
} from "@/src/features/map/utils/mapStyle";

export function useMapStyle(selectedMapStyle: MapStyleKey) {
  const currentMapStyleUrl = useMemo(
    () => buildMapStyleUrl(selectedMapStyle),
    [selectedMapStyle],
  );
  const fallbackMapStyle = useMemo(
    () => buildFallbackMapStyle(selectedMapStyle),
    [selectedMapStyle],
  );
  const [roadLabelLayerId, setRoadLabelLayerId] = useState<string | null>(null);
  const [resolvedMapStyle, setResolvedMapStyle] = useState<
    string | StyleSpecification
  >(fallbackMapStyle);

  useEffect(() => {
    const abortController = new AbortController();
    setResolvedMapStyle(fallbackMapStyle);
    setRoadLabelLayerId(null);

    if (!hasConfiguredMapTilerApiKey()) {
      return () => {
        abortController.abort();
      };
    }

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

        setResolvedMapStyle(fallbackMapStyle);
        setRoadLabelLayerId(null);
      }
    }

    void loadRoadLabelLayerId();

    return () => {
      abortController.abort();
    };
  }, [currentMapStyleUrl, fallbackMapStyle]);

  return {
    resolvedMapStyle,
    roadLabelLayerId,
  };
}
