import { afterEach, describe, expect, it } from "vitest";

import { useCoverImage } from "../../hooks/useCoverImage";

afterEach(() => {
  useCoverImage.setState({ isOpen: false, url: undefined });
});

describe("useCoverImage", () => {
  it("opens and resets the picker", () => {
    const store = useCoverImage.getState();

    store.onReplace("https://example.com/cover.png");
    expect(useCoverImage.getState()).toMatchObject({
      isOpen: true,
      url: "https://example.com/cover.png",
    });

    store.onOpen();
    expect(useCoverImage.getState()).toMatchObject({
      isOpen: true,
      url: undefined,
    });

    store.onClose();
    expect(useCoverImage.getState()).toMatchObject({
      isOpen: false,
      url: undefined,
    });
  });

  it("starts closed with no url", () => {
    useCoverImage.setState({ isOpen: false, url: undefined });

    const state = useCoverImage.getState();
    expect(state.isOpen).toBe(false);
    expect(state.url).toBeUndefined();
  });

  it("onOpen clears a previously stored url", () => {
    useCoverImage.setState({
      isOpen: false,
      url: "https://example.com/stale.png",
    });

    useCoverImage.getState().onOpen();

    const state = useCoverImage.getState();
    expect(state.isOpen).toBe(true);
    expect(state.url).toBeUndefined();
  });

  it("onClose clears the stored url", () => {
    useCoverImage.setState({ isOpen: true, url: "https://example.com/a.png" });

    useCoverImage.getState().onClose();

    const state = useCoverImage.getState();
    expect(state.isOpen).toBe(false);
    expect(state.url).toBeUndefined();
  });

  it("onReplace overwrites a previous url", () => {
    useCoverImage.getState().onReplace("https://example.com/first.png");
    useCoverImage.getState().onReplace("https://example.com/second.png");

    expect(useCoverImage.getState().url).toBe("https://example.com/second.png");
  });

  it("closing after replace clears the stored url", () => {
    useCoverImage.getState().onReplace("https://example.com/x.png");
    useCoverImage.getState().onClose();

    const state = useCoverImage.getState();
    expect(state.url).toBeUndefined();
    expect(state.isOpen).toBe(false);
  });

  it("onClose is safe while already closed", () => {
    useCoverImage.setState({ isOpen: false, url: undefined });

    useCoverImage.getState().onClose();

    expect(useCoverImage.getState().isOpen).toBe(false);
  });
});
