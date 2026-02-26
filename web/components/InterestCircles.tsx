"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { trackEvent } from "@/lib/analytics";
import { Interest } from "@/lib/types";
import { colors } from "@/lib/colors";

interface InterestCirclesProps {
  readonly map: google.maps.Map | null;
  readonly interests: Interest[];
  readonly onInterestClick?: (interest: Interest) => void;
  readonly interactive?: boolean;
  readonly editingInterestId?: string | null;
  readonly hideAll?: boolean;
}

const CIRCLE_FILL_OPACITY = 0.08;
const CIRCLE_STROKE_OPACITY = 0.1;
const OPACITY_HOVER_DELTA = 0.05;
const CIRCLE_FILL_OPACITY_HOVER = Math.max(
  CIRCLE_FILL_OPACITY - OPACITY_HOVER_DELTA,
  0,
);
const CIRCLE_STROKE_OPACITY_HOVER = Math.max(
  CIRCLE_STROKE_OPACITY - OPACITY_HOVER_DELTA,
  0,
);

const DEFAULT_CIRCLE_COLOR = colors.interaction.circle;

function detachAllCircles(circles: Map<string, google.maps.Circle>) {
  for (const circle of circles.values()) {
    google.maps.event.clearInstanceListeners(circle);
    circle.setMap(null);
  }
  circles.clear();
}

function removeStaleCircles(
  circles: Map<string, google.maps.Circle>,
  desiredIds: Set<string>,
) {
  for (const [id, circle] of circles.entries()) {
    if (!desiredIds.has(id)) {
      google.maps.event.clearInstanceListeners(circle);
      circle.setMap(null);
      circles.delete(id);
    }
  }
}

function getCircleStyleOptions(circleColor: string, isHovered: boolean) {
  return {
    fillColor: circleColor,
    strokeColor: circleColor,
    fillOpacity: isHovered ? CIRCLE_FILL_OPACITY_HOVER : CIRCLE_FILL_OPACITY,
    strokeOpacity: isHovered
      ? CIRCLE_STROKE_OPACITY_HOVER
      : CIRCLE_STROKE_OPACITY,
  } as const;
}

function upsertCircle(
  circles: Map<string, google.maps.Circle>,
  map: google.maps.Map,
  interest: Interest,
  circleColor: string,
  isHovered: boolean,
  interactive: boolean,
) {
  const id = interest.id!;
  const existing = circles.get(id);
  const styleOptions = getCircleStyleOptions(circleColor, isHovered);

  if (existing) {
    existing.setCenter({
      lat: interest.coordinates.lat,
      lng: interest.coordinates.lng,
    });
    existing.setRadius(interest.radius);
    existing.setOptions({
      ...styleOptions,
      clickable: interactive,
    });
    return existing;
  }

  const nativeCircle = new google.maps.Circle({
    map,
    center: {
      lat: interest.coordinates.lat,
      lng: interest.coordinates.lng,
    },
    radius: interest.radius,
    ...styleOptions,
    strokeWeight: 2,
    clickable: interactive,
    zIndex: 1,
  });

  circles.set(id, nativeCircle);
  return nativeCircle;
}

function bindCircleListeners(
  circle: google.maps.Circle,
  interest: Interest,
  interests: Interest[],
  interactive: boolean,
  onInterestClick: ((interest: Interest) => void) | undefined,
  setHoveredInterestId: Dispatch<SetStateAction<string | null>>,
) {
  google.maps.event.clearInstanceListeners(circle);

  if (!interactive || !onInterestClick || !interest.id) {
    return;
  }

  const id = interest.id;
  circle.addListener("click", () => {
    trackEvent({
      name: "zone_clicked",
      params: {
        zone_id: id,
        radius: interest.radius,
      },
    });
    const fresh = interests.find((item) => item.id === id);
    if (fresh) {
      onInterestClick(fresh);
    }
  });

  circle.addListener("mouseover", () => {
    setHoveredInterestId(id);
  });

  circle.addListener("mouseout", () => {
    setHoveredInterestId((prev) => (prev === id ? null : prev));
  });
}

export default function InterestCircles({
  map,
  interests,
  onInterestClick,
  interactive = true,
  editingInterestId,
  hideAll = false,
}: InterestCirclesProps) {
  const [hoveredInterestId, setHoveredInterestId] = useState<string | null>(
    null,
  );
  const circlesMapRef = useRef<Map<string, google.maps.Circle>>(new Map());
  // Keep callbacks in refs so circle listeners always call the latest version
  const onInterestClickRef = useRef(onInterestClick);
  useEffect(() => {
    onInterestClickRef.current = onInterestClick;
  }, [onInterestClick]);

  const circlesToRender = useMemo(() => {
    if (hideAll) return [];
    return interests
      .filter((interest) => interest.id && interest.id !== editingInterestId)
      .filter(
        (interest, index, self) =>
          index === self.findIndex((i) => i.id === interest.id),
      );
  }, [interests, editingInterestId, hideAll]);

  // Build a set of IDs we want on this render for reconciliation
  const desiredIds = useMemo(
    () => new Set(circlesToRender.map((i) => i.id!)),
    [circlesToRender],
  );

  // Reconcile native circles with desired state
  useEffect(() => {
    const nativeCircles = circlesMapRef.current;

    if (!map) {
      detachAllCircles(nativeCircles);
      return;
    }

    removeStaleCircles(nativeCircles, desiredIds);

    for (const interest of circlesToRender) {
      const id = interest.id!;
      const circleColor = interest.color || DEFAULT_CIRCLE_COLOR;
      const isHovered = interactive && hoveredInterestId === id;

      const circle = upsertCircle(
        nativeCircles,
        map,
        interest,
        circleColor,
        isHovered,
        interactive,
      );

      bindCircleListeners(
        circle,
        interest,
        interests,
        interactive,
        onInterestClickRef.current,
        setHoveredInterestId,
      );
    }
  }, [
    map,
    circlesToRender,
    desiredIds,
    hoveredInterestId,
    interests,
    interactive,
  ]);

  // Cleanup all circles on unmount
  useEffect(() => {
    const nativeCircles = circlesMapRef.current;
    return () => {
      detachAllCircles(nativeCircles);
    };
  }, []);

  return null;
}
