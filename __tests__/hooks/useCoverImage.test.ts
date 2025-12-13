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
});
