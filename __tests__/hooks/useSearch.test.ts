import { afterEach, describe, expect, it } from "vitest";

import { useSearch } from "../../hooks/useSearch";

afterEach(() => {
  useSearch.setState({ isOpen: false });
});

describe("useSearch", () => {
  it("toggles the command palette", () => {
    const store = useSearch.getState();

    expect(store.isOpen).toBe(false);

    store.onOpen();
    expect(useSearch.getState().isOpen).toBe(true);

    store.onClose();
    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("inverts state when toggled", () => {
    const store = useSearch.getState();

    store.toggle();
    expect(useSearch.getState().isOpen).toBe(true);

    store.toggle();
    expect(useSearch.getState().isOpen).toBe(false);
  });
});
