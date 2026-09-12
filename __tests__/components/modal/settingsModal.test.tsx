import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SettingsModal from "@/components/modal/settings-modal";
import { useSettings } from "@/hooks/use-settings";

describe("SettingsModal", () => {
  beforeEach(() => {
    act(() => {
      useSettings.setState({ isOpen: false });
    });
  });

  it("renders nothing when the store is closed", () => {
    const { container } = render(<SettingsModal />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders settings content when opened", () => {
    act(() => {
      useSettings.getState().onOpen();
    });
    render(<SettingsModal />);
    expect(screen.getByText("Settings")).not.toBeNull();
    expect(screen.getByText("Appearance")).not.toBeNull();
    expect(
      screen.getByText("Customize how Joker Notes looks on your device"),
    ).not.toBeNull();
  });

  it("closes via onOpenChange wired to store onClose", () => {
    act(() => {
      useSettings.getState().onOpen();
    });
    render(<SettingsModal />);
    expect(useSettings.getState().isOpen).toBe(true);
    // Radix Dialog calls onOpenChange(false) when dismissed; simulate Escape.
    fireEventKeyDownEscape();
    expect(useSettings.getState().isOpen).toBe(false);
  });
});

function fireEventKeyDownEscape() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

