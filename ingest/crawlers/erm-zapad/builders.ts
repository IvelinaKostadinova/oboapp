import type { GeoJSONFeature, GeoJSONFeatureCollection } from "@/lib/types";
import type { PinRecord } from "./types";

/**
 * Build GeoJSON FeatureCollection with separate Point for each pin
 */
export function buildGeoJSON(
  pinRecords: PinRecord[],
): GeoJSONFeatureCollection | null {
  if (pinRecords.length === 0) {
    return null;
  }

  const features: GeoJSONFeature[] = pinRecords.map((pin) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [pin.lon, pin.lat], // GeoJSON: [lng, lat]
    },
    properties: {
      eventId: pin.eventId,
      cityName: pin.city_name,
      eventType: pin.typedist,
      startTime: pin.begin_event,
      endTime: pin.end_event,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

type TitleFormatter = (title: string) => string;
type LabelFormatter = (label: string, value: string) => string;

function buildMessageInternal(
  pin: PinRecord,
  fmtTitle: TitleFormatter,
  fmtLabel: LabelFormatter,
): string {
  const lines: string[] = [];

  lines.push(fmtTitle(pin.typedist) + "\n");

  if (pin.city_name) {
    lines.push(fmtLabel("Населено място", pin.city_name));
  }
  if (pin.begin_event) {
    lines.push(fmtLabel("Начало", pin.begin_event));
  }
  if (pin.end_event) {
    lines.push(fmtLabel("Край", pin.end_event));
  }
  if (pin.eventId) {
    lines.push(fmtLabel("Мрежов код", pin.eventId));
  }

  return lines.join("\n");
}

/**
 * Build plain text message for pin (used for notifications and text field)
 */
export function buildPlainTextMessage(pin: PinRecord): string {
  return buildMessageInternal(
    pin,
    (t) => t,
    (l, v) => `${l}: ${v}`,
  );
}

/**
 * Build markdown message for pin (used for markdownText field)
 */
export function buildMarkdownMessage(pin: PinRecord): string {
  return buildMessageInternal(
    pin,
    (t) => `**${t}**`,
    (l, v) => `**${l}:** ${v}`,
  );
}

/**
 * Build title for pin
 */
export function buildTitle(pin: PinRecord): string {
  const parts: string[] = [];

  // Incident type
  parts.push(pin.typedist);

  // Location
  if (pin.city_name) {
    parts.push(pin.city_name);
  }

  // Grid code
  if (pin.eventId) {
    parts.push(pin.eventId);
  }

  return parts.join(" - ");
}
