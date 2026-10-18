import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn(() => "mock-clerk-middleware-handler"),
}));

describe("Next.js 16 Proxy Middleware (proxy.ts)", () => {
  it("exports default clerkMiddleware handler and matcher config", async () => {
    const proxyModule = await import("@/proxy");

    expect(proxyModule.default).toBe("mock-clerk-middleware-handler");
    expect(proxyModule.config).toBeDefined();
    expect(proxyModule.config.matcher).toBeDefined();
    expect(Array.isArray(proxyModule.config.matcher)).toBe(true);

    const matcherPattern = proxyModule.config.matcher[0];
    expect(typeof matcherPattern).toBe("string");
    // Verify that _next and static assets are excluded by the matcher
    expect(matcherPattern).toContain("_next");
    expect(matcherPattern).toContain("png");
    expect(matcherPattern).toContain("ico");
  });
});

