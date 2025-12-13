import { describe, expect, it } from "vitest";

import { cn } from "../../lib/utils";

describe("cn", () => {
  it("merges truthy class names", () => {
    const result = cn("px-2", null, "text-sm", undefined, false && "hidden");
    expect(result).toBe("px-2 text-sm");
  });

  it("resolves Tailwind conflicts by keeping the last occurrence", () => {
    const result = cn("p-2", "p-4", "text-center", "text-left");
    expect(result).toBe("p-4 text-left");
  });
});
