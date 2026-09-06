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

  it("keeps the palette open when onOpen is called repeatedly", () => {
    const { onOpen } = useSearch.getState();

    onOpen();
    onOpen();
    onOpen();

    expect(useSearch.getState().isOpen).toBe(true);
  });

  it("stays closed when onClose is called while closed", () => {
    const { onClose } = useSearch.getState();

    onClose();

    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("closes an open palette via onClose", () => {
    useSearch.setState({ isOpen: true });
    const { onClose } = useSearch.getState();

    onClose();

    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("toggle reads current state at call time, not stale state", () => {
    useSearch.setState({ isOpen: true });
    const { toggle } = useSearch.getState();

    toggle();

    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("only mutates isOpen and leaves the store shape intact", () => {
    const before = Object.keys(useSearch.getState()).sort();

    useSearch.getState().onOpen();

    const after = useSearch.getState();
    expect(after.isOpen).toBe(true);
    expect(Object.keys(after).sort()).toEqual(before);
  });
});
