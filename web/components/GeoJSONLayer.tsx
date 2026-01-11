"use client";

import React, { useEffect, useState, useRef } from "react";
import { Marker, Polyline, Polygon } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { trackEvent } from "@/lib/analytics";
import { Message } from "@/lib/types";
import { colors, opacity } from "@/lib/colors";
import center from "@turf/center";
import { lineString, polygon } from "@turf/helpers";

interface GeoJSONLayerProps {
  readonly messages: Message[];
  readonly onFeatureClick?: (messageId: string) => void;
  readonly map?: google.maps.Map | null;
}

const GEOJSON_STYLES = {
  lineString: {
    strokeColor: colors.primary.red,
    strokeOpacity: opacity.default,
    strokeWeight: 3,
    zIndex: 5,
  },
  lineStringHover: {
    strokeColor: colors.primary.red,
    strokeOpacity: opacity.hover,
    strokeWeight: 4,
    zIndex: 6,
  },
  polygon: {
    strokeColor: colors.primary.red,
    strokeOpacity: opacity.default,
    strokeWeight: 2,
    fillColor: colors.primary.red,
    fillOpacity: opacity.fill,
    zIndex: 5,
  },
  polygonHover: {
    strokeColor: colors.primary.red,
    strokeOpacity: opacity.hover,
    strokeWeight: 3,
    fillColor: colors.primary.red,
    fillOpacity: opacity.fillHover,
    zIndex: 6,
  },
};

// Helper: Transform GeoJSON coordinate to Google Maps LatLng
const toLatLng = (coord: number[]) => ({
  lat: coord[1],
  lng: coord[0],
});

// Helper: Calculate centroid for any geometry type
const getCentroid = (geometry: any): { lat: number; lng: number } | null => {
  try {
    switch (geometry.type) {
      case "Point":
        return toLatLng(geometry.coordinates);
      case "LineString": {
        const turfLine = lineString(geometry.coordinates);
        const turfCenter = center(turfLine);
        return toLatLng(turfCenter.geometry.coordinates);
      }
      case "Polygon": {
        const turfPolygon = polygon(geometry.coordinates);
        const turfCenter = center(turfPolygon);
        return toLatLng(turfCenter.geometry.coordinates);
      }
      default:
        return null;
    }
  } catch (error) {
    console.error("Error calculating centroid:", error);
    return null;
  }
};

interface FeatureData {
  messageId: string;
  featureIndex: number;
  geometry: any;
  properties: any;
  centroid: { lat: number; lng: number };
}

interface FeatureData {
  messageId: string;
  featureIndex: number;
  geometry: any;
  properties: any;
  centroid: { lat: number; lng: number };
}

export default function GeoJSONLayer({
  messages,
  onFeatureClick,
  map,
}: GeoJSONLayerProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // Extract all features with centroids
  const features: FeatureData[] = [];
  messages.forEach((message) => {
    if (!message.geoJson?.features) return;

    message.geoJson.features.forEach((feature, featureIndex) => {
      const centroid = getCentroid(feature.geometry);
      if (!centroid) return;

      features.push({
        messageId: message.id || "unknown",
        featureIndex,
        geometry: feature.geometry,
        properties: feature.properties,
        centroid,
      });
    });
  });

  // Create and manage markers with clustering
  useEffect(() => {
    if (!map) return;

    // Clear existing markers and clusterer
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create markers for all features
    const markers: google.maps.Marker[] = [];
    features.forEach((feature) => {
      const key = `${feature.messageId}-${feature.featureIndex}`;

      const marker = new google.maps.Marker({
        position: feature.centroid,
        map: null, // Will be managed by clusterer
        icon: {
          path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
          fillColor: colors.primary.red,
          fillOpacity: opacity.default,
          strokeWeight: 2,
          strokeColor: colors.map.stroke,
          scale: 1,
        },
        title:
          feature.properties?.address ||
          feature.properties?.street_name ||
          "Маркер",
        zIndex: 10,
      });

      // Store feature data in marker
      (marker as any).featureData = feature;
      (marker as any).featureKey = key;

      // Click handler
      marker.addListener("click", () => {
        setSelectedFeature(key);
        if (onFeatureClick) {
          trackEvent({
            name: "map_feature_clicked",
            params: {
              message_id: feature.messageId,
              geometry_type: feature.geometry.type,
            },
          });
          onFeatureClick(feature.messageId);
        }
      });

      // Hover handlers
      marker.addListener("mouseover", () => {
        setHoveredFeature(key);
        marker.setIcon({
          path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
          fillColor: colors.primary.red,
          fillOpacity: opacity.hover,
          strokeWeight: 2,
          strokeColor: colors.map.stroke,
          scale: 1.2,
        });
      });

      marker.addListener("mouseout", () => {
        setHoveredFeature(null);
        marker.setIcon({
          path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
          fillColor: colors.primary.red,
          fillOpacity: opacity.default,
          strokeWeight: 2,
          strokeColor: colors.map.stroke,
          scale: 1,
        });
      });

      markers.push(marker);
      markersRef.current.set(key, marker);
    });

    // Create clusterer with aggressive clustering settings
    if (markers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: map,
        markers,
        algorithmOptions: {
          maxZoom: 17, // Cluster until zoom level 17 (was 15)
        },
        renderer: {
          render: ({ count, position }) => {
            // Create red cluster marker matching our pin color
            return new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: colors.primary.red,
                fillOpacity: 0.9,
                strokeColor: colors.map.stroke,
                strokeWeight: 2,
                scale: Math.min(15 + count / 2, 25), // Size scales with count, max 25
              },
              label: {
                text: String(count),
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            });
          },
        },
      });
    }

    return () => {
      // Cleanup
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [messages, onFeatureClick, map]);

  // Render full geometry for selected feature
  const selectedFeatureData = selectedFeature
    ? features.find(
        (f) => `${f.messageId}-${f.featureIndex}` === selectedFeature
      )
    : null;

  return (
    <>
      {selectedFeatureData && (
        <>
          {selectedFeatureData.geometry.type === "LineString" && (
            <Polyline
              path={selectedFeatureData.geometry.coordinates.map(toLatLng)}
              options={{
                ...GEOJSON_STYLES.lineStringHover,
                clickable: false,
              }}
            />
          )}
          {selectedFeatureData.geometry.type === "Polygon" && (
            <Polygon
              paths={selectedFeatureData.geometry.coordinates[0].map(toLatLng)}
              options={{
                ...GEOJSON_STYLES.polygonHover,
                clickable: false,
              }}
            />
          )}
        </>
      )}
    </>
  );
}
