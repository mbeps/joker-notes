import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useScrollTop } from "@/hooks/use-scroll-top";

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

  it("uses the default threshold of 10 when none is provided", () => {
    const { result } = renderHook(() => useScrollTop());

    act(() => {
      setScrollY(11);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      setScrollY(10);
      window.dispatchEvent(new Event("scroll"));
    });
    // Exactly at threshold is not "beyond" it.
    expect(result.current).toBe(false);
  });

  it("adds and removes the scroll listener on mount and unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useScrollTop(10));

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("re-registers the listener when the threshold changes", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ threshold }) => useScrollTop(threshold),
      { initialProps: { threshold: 10 } },
    );

    rerender({ threshold: 50 });

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledTimes(2);

    unmount();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("respects a custom threshold crossing in both directions", () => {
    const { result } = renderHook(() => useScrollTop(100));

    act(() => {
      setScrollY(99);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    act(() => {
      setScrollY(101);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("stops reacting to scroll events after unmount", () => {
    const { result, unmount } = renderHook(() => useScrollTop(10));

    unmount();

    act(() => {
      setScrollY(500);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });
});
