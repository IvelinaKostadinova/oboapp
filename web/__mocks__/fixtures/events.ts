import type { Event, EventMessage } from "@oboapp/shared";

/**
 * Static fixtures for events
 * Groups mock messages into realistic event aggregations
 */
export const MOCK_EVENTS: Event[] = [
  // Event 1: Water outage — single message (1:1 event)
  {
    id: "evt-water-center-1",
    plainText:
      "Планирано спиране на водоподаването на ул. Граф Игнатиев от No 5 до No 25",
    markdownText:
      "**Планирано спиране** на водоподаването на **ул. Граф Игнатиев** от No 5 до No 25",
    categories: ["water"],
    sources: ["sofiyska-voda"],
    messageCount: 1,
    confidence: 1,
    geometryQuality: 3,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-10T09:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-10T17:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T08:05:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T08:05:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [23.3205, 42.6965],
              [23.3225, 42.6975],
            ],
          },
          properties: {},
        },
      ],
    },
  },

  // Event 2: Construction work — 3 messages from different sources
  {
    id: "evt-construction-center",
    plainText:
      "Строително-ремонтни дейности в централна градска част до Народно събрание",
    categories: ["construction-and-repairs", "road-block"],
    sources: ["sofia-bg", "rayon-oborishte-bg"],
    messageCount: 3,
    confidence: 0.85,
    geometryQuality: 2,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-10T07:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-15T18:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T09:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T15:30:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [23.335, 42.694],
                [23.345, 42.694],
                [23.345, 42.699],
                [23.335, 42.699],
                [23.335, 42.694],
              ],
            ],
          },
          properties: {},
        },
      ],
    },
  },

  // Event 3: Public transport change — 2 messages
  {
    id: "evt-transport-center",
    plainText:
      "Промяна на маршрута на трамвай №5 поради ремонт на релсов път",
    categories: ["public-transport", "traffic"],
    sources: ["sofia-bg"],
    messageCount: 2,
    confidence: 0.78,
    geometryQuality: 2,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-10T05:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-20T23:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T14:00:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [23.322, 42.697],
              [23.328, 42.7],
            ],
          },
          properties: {},
        },
      ],
    },
  },

  // Event 4: Heating outage — single message
  {
    id: "evt-heating-mladost",
    plainText: "Аварийно спиране на топлоподаването в ж.к. Младост 1А",
    categories: ["heating"],
    sources: ["toplo-bg"],
    messageCount: 1,
    confidence: 1,
    geometryQuality: 3,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-10T06:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-10T20:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T11:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T11:00:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [23.377, 42.6571],
          },
          properties: {},
        },
      ],
    },
  },

  // Event 5: Electricity outage — single message
  {
    id: "evt-electricity-lozenets",
    plainText:
      "Прекъсване на електрозахранването в район Лозенец поради подмяна на трансформатор",
    categories: ["electricity"],
    sources: ["erm-zapad"],
    messageCount: 1,
    confidence: 1,
    geometryQuality: 3,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-11T08:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-11T16:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T12:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T12:00:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [23.31, 42.678],
                [23.33, 42.678],
                [23.33, 42.688],
                [23.31, 42.688],
                [23.31, 42.678],
              ],
            ],
          },
          properties: {},
        },
      ],
    },
  },

  // Event 6: Weather alert — city-wide, single message
  {
    id: "evt-weather-citywide",
    plainText:
      "Оранжев код за силен вятър в София — очакват се пориви до 90 км/ч",
    categories: ["weather"],
    sources: ["nimh-severe-weather"],
    messageCount: 1,
    confidence: 1,
    geometryQuality: 1,
    locality: "bg.sofia",
    cityWide: true,
    timespanStart: new Date("2026-02-10T00:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-11T00:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T13:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T13:00:00Z").toISOString(),
    geoJson: { type: "FeatureCollection", features: [] },
  },

  // Event 7: Traffic + construction — 2 messages from different sources
  {
    id: "evt-traffic-ring",
    plainText:
      "Ремонт на пътната настилка на Околовръстен път при бул. Цариградско шосе",
    categories: ["traffic", "construction-and-repairs"],
    sources: ["sofia-bg"],
    messageCount: 2,
    confidence: 0.72,
    geometryQuality: 2,
    locality: "bg.sofia",
    timespanStart: new Date("2026-02-11T07:00:00Z").toISOString(),
    timespanEnd: new Date("2026-02-17T19:00:00Z").toISOString(),
    createdAt: new Date("2026-02-09T14:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-09T16:00:00Z").toISOString(),
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [23.42, 42.665],
              [23.44, 42.67],
            ],
          },
          properties: {},
        },
      ],
    },
  },
];

/**
 * Event-message links mapping messages to events
 */
export const MOCK_EVENT_MESSAGES: EventMessage[] = [
  // Event 1: Water — 1 message
  {
    id: "em-water-1",
    eventId: "evt-water-center-1",
    messageId: "msg-water-center-1",
    source: "sofiyska-voda",
    confidence: 1,
    geometryQuality: 3,
    matchSignals: null,
    createdAt: new Date("2026-02-09T08:05:00Z").toISOString(),
  },

  // Event 2: Construction — 3 messages
  {
    id: "em-construction-1",
    eventId: "evt-construction-center",
    messageId: "msg-construction-center-2",
    source: "sofia-bg",
    confidence: 1,
    geometryQuality: 2,
    matchSignals: null,
    createdAt: new Date("2026-02-09T09:00:00Z").toISOString(),
  },
  {
    id: "em-construction-2",
    eventId: "evt-construction-center",
    messageId: "msg-road-block-oborishte-1",
    source: "rayon-oborishte-bg",
    confidence: 0.85,
    geometryQuality: 1,
    matchSignals: {
      locationSimilarity: 0.8,
      timeOverlap: 0.9,
      categoryMatch: 0.75,
      textSimilarity: 0.82,
    },
    createdAt: new Date("2026-02-09T12:00:00Z").toISOString(),
  },
  {
    id: "em-construction-3",
    eventId: "evt-construction-center",
    messageId: "msg-no-geojson-1",
    source: "sofia-bg",
    confidence: 0.72,
    geometryQuality: 0,
    matchSignals: {
      locationSimilarity: 0.6,
      timeOverlap: 0.85,
      categoryMatch: 1,
      textSimilarity: 0.7,
    },
    createdAt: new Date("2026-02-09T15:30:00Z").toISOString(),
  },

  // Event 3: Public transport — 2 messages
  {
    id: "em-transport-1",
    eventId: "evt-transport-center",
    messageId: "msg-public-transport-center-3",
    source: "sofia-bg",
    confidence: 1,
    geometryQuality: 2,
    matchSignals: null,
    createdAt: new Date("2026-02-09T10:00:00Z").toISOString(),
  },
  {
    id: "em-transport-2",
    eventId: "evt-transport-center",
    messageId: "msg-bus-stop-1",
    source: "sofia-bg",
    confidence: 0.78,
    geometryQuality: 1,
    matchSignals: {
      locationSimilarity: 0.65,
      timeOverlap: 0.95,
      categoryMatch: 1,
      textSimilarity: 0.68,
    },
    createdAt: new Date("2026-02-09T14:00:00Z").toISOString(),
  },

  // Event 4: Heating — 1 message
  {
    id: "em-heating-1",
    eventId: "evt-heating-mladost",
    messageId: "msg-heating-mladost-1",
    source: "toplo-bg",
    confidence: 1,
    geometryQuality: 3,
    matchSignals: null,
    createdAt: new Date("2026-02-09T11:00:00Z").toISOString(),
  },

  // Event 5: Electricity — 1 message
  {
    id: "em-electricity-1",
    eventId: "evt-electricity-lozenets",
    messageId: "msg-electricity-lozenets-1",
    source: "erm-zapad",
    confidence: 1,
    geometryQuality: 3,
    matchSignals: null,
    createdAt: new Date("2026-02-09T12:00:00Z").toISOString(),
  },

  // Event 6: Weather — 1 message
  {
    id: "em-weather-1",
    eventId: "evt-weather-citywide",
    messageId: "msg-weather-citywide-1",
    source: "nimh-severe-weather",
    confidence: 1,
    geometryQuality: 1,
    matchSignals: null,
    createdAt: new Date("2026-02-09T13:00:00Z").toISOString(),
  },

  // Event 7: Traffic — 2 messages
  {
    id: "em-traffic-1",
    eventId: "evt-traffic-ring",
    messageId: "msg-traffic-ring-road-1",
    source: "sofia-bg",
    confidence: 1,
    geometryQuality: 2,
    matchSignals: null,
    createdAt: new Date("2026-02-09T14:00:00Z").toISOString(),
  },
  {
    id: "em-traffic-2",
    eventId: "evt-traffic-ring",
    messageId: "msg-long-text-1",
    source: "sofia-bg",
    confidence: 0.72,
    geometryQuality: 1,
    matchSignals: {
      locationSimilarity: 0.7,
      timeOverlap: 0.8,
      categoryMatch: 0.5,
      textSimilarity: 0.65,
    },
    createdAt: new Date("2026-02-09T16:00:00Z").toISOString(),
  },
];
