import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useScrollTop } from "../../hooks/useScrollTop";

const setScrollY = (value: number) => {
  Object.defineProperty(window, "scrollY", {
    value,
    writable: true,
    configurable: true,
  });
};

describe("useScrollTop", () => {
  it("reflects whether the scroll position passes the threshold", () => {
    const { result } = renderHook(() => useScrollTop(10));

    expect(result.current).toBe(false);

    act(() => {
      setScrollY(15);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      setScrollY(0);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });
});
