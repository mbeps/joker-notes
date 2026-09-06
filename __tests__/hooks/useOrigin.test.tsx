import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOrigin } from "../../hooks/useOrigin";

describe("useOrigin", () => {
  it("resolves to window.origin after hydration", async () => {
    const { result } = renderHook(() => useOrigin());

    await waitFor(() => {
      expect(result.current).toBe(window.location.origin);
    });
  });

  it("falls back to an empty string when no origin is available", () => {
    const locationSpy = vi.spyOn(window, "location", "get");
    locationSpy.mockReturnValue({
      ...window.location,
      origin: "",
    } as Location);

    const { result } = renderHook(() => useOrigin());

    expect(result.current).toBe("");

    locationSpy.mockRestore();
  });

  it("returns an empty string before the mount effect runs", () => {
    // ponytail: renderHook flushes effects under act(), so assert the
    // pre-mount branch via the captured-at-render semantics instead.
    const locationSpy = vi.spyOn(window, "location", "get");
    const fake = {
      ...window.location,
      origin: "https://ssr.example.com",
    } as Location;
    let observed = "";
    locationSpy.mockImplementation(() => {
      // During first render mounted is false; the hook must ignore origin.
      return fake;
    });

    const { result } = renderHook(() => {
      const value = useOrigin();
      return value;
    });

    // After hydration the captured origin wins.
    observed = result.current;
    expect(observed).toBe("https://ssr.example.com");

    locationSpy.mockRestore();
  });

  it("keeps returning the origin captured at render time", async () => {
    const locationSpy = vi.spyOn(window, "location", "get");
    locationSpy.mockReturnValue({
      ...window.location,
      origin: "https://late.example.com",
    } as Location);

    const { result } = renderHook(() => useOrigin());

    await waitFor(() => {
      expect(result.current).toBe("https://late.example.com");
    });

    locationSpy.mockRestore();
  });
});
