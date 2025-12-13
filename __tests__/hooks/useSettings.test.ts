import { afterEach, describe, expect, it } from "vitest";

import { useSettings } from "../../hooks/useSettings";

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
});
