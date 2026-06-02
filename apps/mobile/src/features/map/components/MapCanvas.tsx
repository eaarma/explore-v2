import type { RefObject } from "react";
import type { NativeSyntheticEvent } from "react-native";
import { StyleSheet } from "react-native";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Images,
  Layer,
  Map as MapLibreMap,
  RasterSource,
  UserLocation,
  VectorSource,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

import type { Journey } from "@/src/features/journeys/types/journeyTypes";
import { LOCATION_UPDATE_MIN_DISPLACEMENT_METERS } from "@/src/features/discoveries/discoveryConfig";
import type { Location } from "@/src/features/locations/types/locationTypes";
import {
  activeHighlightedFilter,
  journeyActiveGlowPaint,
  journeyActiveHighlightPaint,
  journeyMarkerLayout,
  journeyTripGlowPaint,
  journeyTripHighlightPaint,
  locationActiveGlowPaint,
  locationActiveHighlightPaint,
  locationMarkerLayout,
  locationTripGlowPaint,
  locationTripHighlightPaint,
  markerHitbox,
  tripHighlightedFilter,
} from "@/src/features/map/mapMarkerStyles";
import { mapMarkerImages } from "@/src/features/map/mapMarkerIcons";
import {
  hiddenRasterOverlayPaint,
  hikingPathOverlayCasingPaint,
  hikingPathOverlayFilter,
  hikingPathOverlayPaint,
  hikingPathOverlaySourceLayerProps,
  hikingTrailLabelFilter,
  hikingTrailLabelLayout,
  hikingTrailLabelPaint,
  hikingTrailOverlayCasingPaint,
  hikingTrailOverlayFilter,
  hikingTrailOverlayLayout,
  hikingTrailOverlayPaint,
  hikingTrailOverlaySourceLayerProps,
  hillshadeOverlayPaint,
  hydrologyShorelinePaint,
  hydrologyWaterFillPaint,
  hydrologyWaterPolygonFilter,
  hydrologyWaterwayCasingPaint,
  hydrologyWaterwayFilter,
  hydrologyWaterwayPaint,
  landcoverOverlayNaturalFilter,
  landcoverOverlayNaturalPaint,
  landcoverOverlaySourceLayerProps,
  landcoverOverlayUrbanFilter,
  landcoverOverlayUrbanPaint,
  landuseOverlaySourceLayerProps,
  MAPTILER_HILLSHADE_ATTRIBUTION,
  MAPTILER_HILLSHADE_OVERLAY_TILESET_URL,
  MAPTILER_OPENMAPTILES_TILESET_URL,
  MAPTILER_OUTDOOR_ATTRIBUTION,
  MAPTILER_OUTDOOR_TILESET_URL,
  parkOverlaySourceLayerProps,
  protectedAreaOverlayFillPaint,
  protectedAreaOverlayFilter,
  protectedAreaOverlayLinePaint,
  waterOverlaySourceLayerProps,
  waterwayOverlaySourceLayerProps,
  wetlandOverlayFillPaint,
  wetlandOverlayFilter,
  wetlandOverlayLinePaint,
} from "@/src/features/map/mapOverlayStyles";
import {
  DEFAULT_MAP_CENTER,
  type MapOverlayKey,
} from "@/src/features/map/mapConfig";
import { createPointFeatureCollection } from "@/src/features/map/utils/mapFeatureCollection";

type MapCanvasProps = {
  cameraRef: RefObject<CameraRef | null>;
  contentRevision: number;
  journeyGeoJson: ReturnType<typeof createPointFeatureCollection<Journey>>;
  locationGeoJson: ReturnType<typeof createPointFeatureCollection<Location>>;
  locationPermissionGranted: boolean;
  onJourneySourcePress: (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ) => void;
  onLocationSourcePress: (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ) => void;
  onMapPress: () => void;
  onMapReady: () => void;
  onMapRegionChange: (
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) => void;
  overlayVisibility: Record<MapOverlayKey, boolean>;
  resolvedMapStyle: string | StyleSpecification;
  roadLabelLayerId: string | null;
};

export function MapCanvas({
  cameraRef,
  contentRevision,
  journeyGeoJson,
  locationGeoJson,
  locationPermissionGranted,
  onJourneySourcePress,
  onLocationSourcePress,
  onMapPress,
  onMapReady,
  onMapRegionChange,
  overlayVisibility,
  resolvedMapStyle,
  roadLabelLayerId,
}: MapCanvasProps) {
  const locationSourceId = `location-points-${contentRevision}`;
  const locationLayerId = `location-markers-${contentRevision}`;
  const locationActiveGlowLayerId = `location-active-glow-${contentRevision}`;
  const locationActiveHighlightLayerId =
    `location-active-highlight-${contentRevision}`;
  const locationTripGlowLayerId = `location-trip-glow-${contentRevision}`;
  const locationTripHighlightLayerId =
    `location-trip-highlight-${contentRevision}`;
  const journeySourceId = `journey-points-${contentRevision}`;
  const journeyLayerId = `journey-markers-${contentRevision}`;
  const journeyActiveGlowLayerId = `journey-active-glow-${contentRevision}`;
  const journeyActiveHighlightLayerId =
    `journey-active-highlight-${contentRevision}`;
  const journeyTripGlowLayerId = `journey-trip-glow-${contentRevision}`;
  const journeyTripHighlightLayerId =
    `journey-trip-highlight-${contentRevision}`;
  const hillshadeOverlayLayerPaint = overlayVisibility.hillshade
    ? hillshadeOverlayPaint
    : hiddenRasterOverlayPaint;
  const hikingOverlayBeforeLayerId =
    roadLabelLayerId ?? locationTripGlowLayerId;

  return (
    <MapLibreMap
      style={styles.map}
      mapStyle={resolvedMapStyle}
      androidView="texture"
      attribution
      compass={false}
      logo={false}
      onRegionIsChanging={onMapRegionChange}
      onRegionDidChange={onMapRegionChange}
      onPress={onMapPress}
      onDidFinishLoadingMap={onMapReady}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: DEFAULT_MAP_CENTER,
          zoom: 7,
        }}
      />

      {locationPermissionGranted ? (
        <UserLocation
          accuracy
          heading
          minDisplacement={LOCATION_UPDATE_MIN_DISPLACEMENT_METERS}
        />
      ) : null}
      <Images images={mapMarkerImages} />

      <RasterSource
        id="hillshade-overlay-source"
        attribution={MAPTILER_HILLSHADE_ATTRIBUTION}
        url={MAPTILER_HILLSHADE_OVERLAY_TILESET_URL}
      >
        <Layer
          id="hillshade-overlay-layer"
          type="raster"
          beforeId={locationTripGlowLayerId}
          paint={hillshadeOverlayLayerPaint}
        />
      </RasterSource>

      {overlayVisibility.landcover ? (
        <VectorSource
          id="landcover-overlay-source"
          attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
          url={MAPTILER_OPENMAPTILES_TILESET_URL}
        >
          <Layer
            id="landcover-overlay-natural"
            type="fill"
            beforeId={locationTripGlowLayerId}
            filter={landcoverOverlayNaturalFilter}
            paint={landcoverOverlayNaturalPaint}
            {...landcoverOverlaySourceLayerProps}
          />
          <Layer
            id="landcover-overlay-urban"
            type="fill"
            beforeId={locationTripGlowLayerId}
            filter={landcoverOverlayUrbanFilter}
            paint={landcoverOverlayUrbanPaint}
            {...landuseOverlaySourceLayerProps}
          />
        </VectorSource>
      ) : null}

      {overlayVisibility.wetlands ? (
        <VectorSource
          id="wetlands-overlay-source"
          attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
          url={MAPTILER_OPENMAPTILES_TILESET_URL}
        >
          <Layer
            id="wetlands-overlay-fill"
            type="fill"
            beforeId={locationTripGlowLayerId}
            filter={wetlandOverlayFilter}
            paint={wetlandOverlayFillPaint}
            {...landcoverOverlaySourceLayerProps}
          />
          <Layer
            id="wetlands-overlay-line"
            type="line"
            beforeId={locationTripGlowLayerId}
            filter={wetlandOverlayFilter}
            paint={wetlandOverlayLinePaint}
            {...landcoverOverlaySourceLayerProps}
          />
        </VectorSource>
      ) : null}

      {overlayVisibility.protectedAreas ? (
        <VectorSource
          id="protected-areas-overlay-source"
          attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
          url={MAPTILER_OPENMAPTILES_TILESET_URL}
        >
          <Layer
            id="protected-areas-overlay-fill"
            type="fill"
            beforeId={locationTripGlowLayerId}
            filter={protectedAreaOverlayFilter}
            paint={protectedAreaOverlayFillPaint}
            {...parkOverlaySourceLayerProps}
          />
          <Layer
            id="protected-areas-overlay-line"
            type="line"
            beforeId={locationTripGlowLayerId}
            filter={protectedAreaOverlayFilter}
            paint={protectedAreaOverlayLinePaint}
            {...parkOverlaySourceLayerProps}
          />
        </VectorSource>
      ) : null}

      {overlayVisibility.hydrology ? (
        <VectorSource
          id="hydrology-overlay-source"
          attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
          url={MAPTILER_OPENMAPTILES_TILESET_URL}
        >
          <Layer
            id="hydrology-overlay-water-fill"
            type="fill"
            beforeId={locationTripGlowLayerId}
            filter={hydrologyWaterPolygonFilter}
            paint={hydrologyWaterFillPaint}
            {...waterOverlaySourceLayerProps}
          />
          <Layer
            id="hydrology-overlay-shoreline"
            type="line"
            beforeId={locationTripGlowLayerId}
            filter={hydrologyWaterPolygonFilter}
            paint={hydrologyShorelinePaint}
            {...waterOverlaySourceLayerProps}
          />
          <Layer
            id="hydrology-overlay-waterway-casing"
            type="line"
            beforeId={locationTripGlowLayerId}
            filter={hydrologyWaterwayFilter}
            paint={hydrologyWaterwayCasingPaint}
            {...waterwayOverlaySourceLayerProps}
          />
          <Layer
            id="hydrology-overlay-waterway-line"
            type="line"
            beforeId={locationTripGlowLayerId}
            filter={hydrologyWaterwayFilter}
            paint={hydrologyWaterwayPaint}
            {...waterwayOverlaySourceLayerProps}
          />
        </VectorSource>
      ) : null}

      {overlayVisibility.hikingTrails ? (
        <>
          <VectorSource
            id="hiking-paths-overlay-source"
            attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
            url={MAPTILER_OPENMAPTILES_TILESET_URL}
          >
            <Layer
              id="hiking-paths-overlay-casing"
              type="line"
              beforeId={hikingOverlayBeforeLayerId}
              filter={hikingPathOverlayFilter}
              layout={hikingTrailOverlayLayout}
              paint={hikingPathOverlayCasingPaint}
              {...hikingPathOverlaySourceLayerProps}
            />
            <Layer
              id="hiking-paths-overlay-line"
              type="line"
              beforeId={hikingOverlayBeforeLayerId}
              filter={hikingPathOverlayFilter}
              layout={hikingTrailOverlayLayout}
              paint={hikingPathOverlayPaint}
              {...hikingPathOverlaySourceLayerProps}
            />
          </VectorSource>

          <VectorSource
            id="hiking-trails-overlay-source"
            attribution={MAPTILER_OUTDOOR_ATTRIBUTION}
            url={MAPTILER_OUTDOOR_TILESET_URL}
          >
            <Layer
              id="hiking-trails-overlay-casing"
              type="line"
              beforeId={hikingOverlayBeforeLayerId}
              filter={hikingTrailOverlayFilter}
              layout={hikingTrailOverlayLayout}
              paint={hikingTrailOverlayCasingPaint}
              {...hikingTrailOverlaySourceLayerProps}
            />
            <Layer
              id="hiking-trails-overlay-line"
              type="line"
              beforeId={hikingOverlayBeforeLayerId}
              filter={hikingTrailOverlayFilter}
              layout={hikingTrailOverlayLayout}
              paint={hikingTrailOverlayPaint}
              {...hikingTrailOverlaySourceLayerProps}
            />
            <Layer
              id="hiking-trails-overlay-label"
              type="symbol"
              beforeId={hikingOverlayBeforeLayerId}
              minzoom={11}
              filter={hikingTrailLabelFilter}
              layout={hikingTrailLabelLayout}
              paint={hikingTrailLabelPaint}
              {...hikingTrailOverlaySourceLayerProps}
            />
          </VectorSource>
        </>
      ) : null}

      <GeoJSONSource
        key={locationSourceId}
        id={locationSourceId}
        data={locationGeoJson}
        hitbox={markerHitbox}
        onPress={onLocationSourcePress}
      >
        <Layer
          id={locationTripGlowLayerId}
          type="circle"
          filter={tripHighlightedFilter}
          paint={locationTripGlowPaint}
        />
        <Layer
          id={locationTripHighlightLayerId}
          type="circle"
          filter={tripHighlightedFilter}
          paint={locationTripHighlightPaint}
        />
        <Layer
          id={locationActiveGlowLayerId}
          type="circle"
          filter={activeHighlightedFilter}
          paint={locationActiveGlowPaint}
        />
        <Layer
          id={locationActiveHighlightLayerId}
          type="circle"
          filter={activeHighlightedFilter}
          paint={locationActiveHighlightPaint}
        />
        <Layer
          id={locationLayerId}
          type="symbol"
          layout={locationMarkerLayout}
        />
      </GeoJSONSource>

      <GeoJSONSource
        key={journeySourceId}
        id={journeySourceId}
        data={journeyGeoJson}
        hitbox={markerHitbox}
        onPress={onJourneySourcePress}
      >
        <Layer
          id={journeyTripGlowLayerId}
          type="circle"
          filter={tripHighlightedFilter}
          paint={journeyTripGlowPaint}
        />
        <Layer
          id={journeyTripHighlightLayerId}
          type="circle"
          filter={tripHighlightedFilter}
          paint={journeyTripHighlightPaint}
        />
        <Layer
          id={journeyActiveGlowLayerId}
          type="circle"
          filter={activeHighlightedFilter}
          paint={journeyActiveGlowPaint}
        />
        <Layer
          id={journeyActiveHighlightLayerId}
          type="circle"
          filter={activeHighlightedFilter}
          paint={journeyActiveHighlightPaint}
        />
        <Layer
          id={journeyLayerId}
          type="symbol"
          layout={journeyMarkerLayout}
        />
      </GeoJSONSource>
    </MapLibreMap>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
