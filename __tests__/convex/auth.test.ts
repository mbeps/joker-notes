import { describe, expect, it } from "vitest";
import authConfig from "@/convex/auth.config.js";

describe("convex auth config", () => {
  it("exports providers array with convex and customJwt providers", () => {
    expect(authConfig).toBeDefined();
    expect(Array.isArray(authConfig.providers)).toBe(true);
    expect(authConfig.providers).toHaveLength(2);

    const convexProvider = authConfig.providers.find(
      (p: { applicationID?: string }) => p.applicationID === "convex",
    );
    expect(convexProvider).toBeDefined();
    expect(convexProvider?.domain).toBe(
      "https://grateful-glowworm-20.clerk.accounts.dev",
    );

    const customJwtProvider = authConfig.providers.find(
      (p: { type?: string }) => p.type === "customJwt",
    );
    expect(customJwtProvider).toBeDefined();
    expect(customJwtProvider?.issuer).toBe(
      "https://grateful-glowworm-20.clerk.accounts.dev",
    );
    expect(customJwtProvider?.jwksUri).toBe(
      "https://grateful-glowworm-20.clerk.accounts.dev/.well-known/jwks.json",
    );
  });
});

