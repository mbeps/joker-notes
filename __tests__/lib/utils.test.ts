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

  it("returns an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays of classes via clsx", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });

  it("handles nested conditional objects", () => {
    expect(cn({ hidden: false, block: true }, "mt-2")).toBe("block mt-2");
  });

  it("does not merge unrelated Tailwind groups", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("keeps later conflicting modifiers within the same group", () => {
    expect(cn("hover:p-2", "hover:p-6")).toBe("hover:p-6");
  });

  it("treats different variants as separate groups", () => {
    expect(cn("p-2", "hover:p-4")).toBe("p-2 hover:p-4");
  });

  it("collapses whitespace-only strings away", () => {
    expect(cn("px-2", "   ", "text-sm")).toBe("px-2 text-sm");
  });

  it("merges conflicting width utilities keeping the last", () => {
    expect(cn("w-full", "w-1/2")).toBe("w-1/2");
  });
});
