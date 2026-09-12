import { afterEach, describe, expect, it } from "vitest";

import { useSettings } from "@/hooks/use-settings";

afterEach(() => {
  useSettings.setState({ isOpen: false });
});

describe("useSettings", () => {
  it("controls modal visibility", () => {
    const store = useSettings.getState();

    expect(store.isOpen).toBe(false);

    store.onOpen();
    expect(useSettings.getState().isOpen).toBe(true);

    store.onClose();
    expect(useSettings.getState().isOpen).toBe(false);
  });

  it("starts closed", () => {
    useSettings.setState({ isOpen: false });

    expect(useSettings.getState().isOpen).toBe(false);
  });

  it("opens the settings modal", () => {
    useSettings.setState({ isOpen: false });

    useSettings.getState().onOpen();

    expect(useSettings.getState().isOpen).toBe(true);
  });

  it("closes an open settings modal", () => {
    useSettings.setState({ isOpen: true });

    useSettings.getState().onClose();

    expect(useSettings.getState().isOpen).toBe(false);
  });

  it("supports repeated open/close cycles", () => {
    const { onOpen, onClose } = useSettings.getState();

    onOpen();
    expect(useSettings.getState().isOpen).toBe(true);
    onClose();
    expect(useSettings.getState().isOpen).toBe(false);
    onOpen();
    expect(useSettings.getState().isOpen).toBe(true);
  });

  it("is idempotent when onClose runs while already closed", () => {
    useSettings.setState({ isOpen: false });

    useSettings.getState().onClose();
    useSettings.getState().onClose();

    expect(useSettings.getState().isOpen).toBe(false);
  });
});
