import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Convex TypeScript compilation", () => {
  it("typechecks convex project without errors via convex/tsconfig.json", () => {
    expect(() => {
      execSync("npx tsc --project convex/tsconfig.json", {
        stdio: "pipe",
        encoding: "utf-8",
      });
    }).not.toThrow();
  });
});

