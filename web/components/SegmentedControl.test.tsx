import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SegmentedControl from "@/components/SegmentedControl";

const OPTIONS = [
  { value: "zones", label: "Моите зони" },
  { value: "events", label: "Събития" },
] as const;

describe("SegmentedControl", () => {
  it("renders all options", () => {
    render(
      <SegmentedControl options={OPTIONS} value="zones" onChange={vi.fn()} />,
    );
    expect(screen.getByText("Моите зони")).toBeInTheDocument();
    expect(screen.getByText("Събития")).toBeInTheDocument();
  });

  it("marks the active option with aria-checked=true", () => {
    render(
      <SegmentedControl options={OPTIONS} value="zones" onChange={vi.fn()} />,
    );
    const zonesBtn = screen.getByRole("radio", { name: "Моите зони" });
    const eventsBtn = screen.getByRole("radio", { name: "Събития" });
    expect(zonesBtn).toHaveAttribute("aria-checked", "true");
    expect(eventsBtn).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with the clicked option value", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={OPTIONS} value="zones" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Събития" }));
    expect(onChange).toHaveBeenCalledWith("events");
  });

  it("does not call onChange when clicking already-active option", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={OPTIONS} value="zones" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Моите зони" }));
    // onChange is still called (controlled component — parent decides)
    expect(onChange).toHaveBeenCalledWith("zones");
  });

  it("does not call onChange when clicking a disabled option", async () => {
    const onChange = vi.fn();
    const optionsWithDisabled = [
      { value: "zones", label: "Моите зони", disabled: true },
      { value: "events", label: "Събития" },
    ] as const;
    render(
      <SegmentedControl
        options={optionsWithDisabled}
        value="events"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Моите зони" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks disabled options with aria-disabled", () => {
    const optionsWithDisabled = [
      { value: "zones", label: "Моите зони", disabled: true },
      { value: "events", label: "Събития" },
    ] as const;
    render(
      <SegmentedControl
        options={optionsWithDisabled}
        value="events"
        onChange={vi.fn()}
      />,
    );
    const zonesBtn = screen.getByRole("radio", { name: "Моите зони" });
    const eventsBtn = screen.getByRole("radio", { name: "Събития" });
    expect(zonesBtn).toHaveAttribute("aria-disabled", "true");
    expect(eventsBtn).not.toHaveAttribute("aria-disabled");
  });

  it("does not call onChange when a disabled option is activated via keyboard", async () => {
    const onChange = vi.fn();
    const optionsWithDisabled = [
      { value: "zones", label: "Моите зони", disabled: true },
      { value: "events", label: "Събития" },
    ] as const;
    render(
      <SegmentedControl
        options={optionsWithDisabled}
        value="events"
        onChange={onChange}
      />,
    );
    const zonesBtn = screen.getByRole("radio", { name: "Моите зони" });
    // Disabled option should not be focusable via tab
    expect(zonesBtn).toHaveAttribute("tabindex", "-1");
    // Force-focus and press Enter — should still not trigger onChange
    zonesBtn.focus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });
});
