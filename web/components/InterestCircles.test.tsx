import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import InterestCircles from "@/components/InterestCircles";
import type { Interest } from "@/lib/types";

interface MockCircle {
  setMap: ReturnType<typeof vi.fn>;
  setCenter: ReturnType<typeof vi.fn>;
  setRadius: ReturnType<typeof vi.fn>;
  setOptions: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
}

let clearInstanceListenersMock: ReturnType<typeof vi.fn>;

const createInterest = (overrides: Partial<Interest> = {}): Interest => ({
  id: "zone-1",
  userId: "user-1",
  coordinates: { lat: 42.6977, lng: 23.3219 },
  radius: 500,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("InterestCircles", () => {
  beforeEach(() => {
    clearInstanceListenersMock = vi.fn();

    const Circle = vi.fn(function Circle() {
      const circle: MockCircle = {
        setMap: vi.fn(),
        setCenter: vi.fn(),
        setRadius: vi.fn(),
        setOptions: vi.fn(),
        addListener: vi.fn(),
      };
      return circle;
    });

    globalThis.google = {
      maps: {
        Circle,
        event: {
          clearInstanceListeners: clearInstanceListenersMock,
        },
      },
    } as unknown as typeof globalThis.google;
  });

  it("does not attach click or hover listeners when interactive is false", async () => {
    const map = {} as google.maps.Map;
    const interest = createInterest();

    render(
      <InterestCircles
        map={map}
        interests={[interest]}
        onInterestClick={vi.fn()}
        interactive={false}
      />,
    );

    await waitFor(() => {
      expect(globalThis.google.maps.Circle).toHaveBeenCalledTimes(1);
    });

    const circle = vi.mocked(globalThis.google.maps.Circle).mock.results[0]
      ?.value as MockCircle;

    expect(circle.addListener).not.toHaveBeenCalled();
  });

  it("cleans up circle listeners and detaches circles on unmount", async () => {
    const map = {} as google.maps.Map;
    const interest = createInterest();

    const { unmount } = render(
      <InterestCircles
        map={map}
        interests={[interest]}
        onInterestClick={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(globalThis.google.maps.Circle).toHaveBeenCalledTimes(1);
    });

    const circle = vi.mocked(globalThis.google.maps.Circle).mock.results[0]
      ?.value as MockCircle;

    unmount();

    expect(clearInstanceListenersMock).toHaveBeenCalledWith(circle);
    expect(circle.setMap).toHaveBeenCalledWith(null);
  });

  it("cleans up listeners and detaches removed circles when interests are removed", async () => {
    const map = {} as google.maps.Map;
    const interest = createInterest();

    const { rerender } = render(
      <InterestCircles
        map={map}
        interests={[interest]}
        onInterestClick={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(globalThis.google.maps.Circle).toHaveBeenCalledTimes(1);
    });

    const circle = vi.mocked(globalThis.google.maps.Circle).mock.results[0]
      ?.value as MockCircle;

    rerender(
      <InterestCircles map={map} interests={[]} onInterestClick={vi.fn()} />,
    );

    await waitFor(() => {
      expect(clearInstanceListenersMock).toHaveBeenCalledWith(circle);
      expect(circle.setMap).toHaveBeenCalledWith(null);
    });
  });

  it("attaches listeners when interactive is true, then detaches and does not reattach when false", async () => {
    const map = {} as google.maps.Map;
    const interest = createInterest();
    const interests = [interest];
    const onInterestClick = vi.fn();

    const { rerender } = render(
      <InterestCircles
        map={map}
        interests={interests}
        onInterestClick={onInterestClick}
        interactive={true}
      />,
    );

    await waitFor(() => {
      expect(globalThis.google.maps.Circle).toHaveBeenCalledTimes(1);
    });

    const circle = vi.mocked(globalThis.google.maps.Circle).mock.results[0]
      ?.value as MockCircle;

    expect(circle.addListener).toHaveBeenCalledTimes(3);
    expect(clearInstanceListenersMock).toHaveBeenCalledWith(circle);

    const clearCallsAfterInteractiveTrue =
      clearInstanceListenersMock.mock.calls.length;

    rerender(
      <InterestCircles
        map={map}
        interests={interests}
        onInterestClick={onInterestClick}
        interactive={false}
      />,
    );

    await waitFor(() => {
      expect(clearInstanceListenersMock.mock.calls.length).toBeGreaterThan(
        clearCallsAfterInteractiveTrue,
      );
    });

    expect(circle.addListener).toHaveBeenCalledTimes(3);

    const addListenerCallsAfterDisable = circle.addListener.mock.calls.length;

    rerender(
      <InterestCircles
        map={map}
        interests={interests}
        onInterestClick={onInterestClick}
        interactive={false}
      />,
    );

    expect(circle.addListener.mock.calls.length).toBe(
      addListenerCallsAfterDisable,
    );
  });
});
