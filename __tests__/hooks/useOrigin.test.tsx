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
});
