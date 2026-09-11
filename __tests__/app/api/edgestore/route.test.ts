import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mockInnerHandler = vi.fn();

vi.mock("@edgestore/server/adapters/next/app", () => ({
  createEdgeStoreNextHandler: vi.fn(() => mockInnerHandler),
}));

describe("EdgeStore route handler", () => {
  it("routes GET request through EdgeStore handler", async () => {
    mockInnerHandler.mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const { GET } = await import(
      "@/app/api/edgestore/[...edgestore]/route"
    );

    const req = {
      method: "GET",
      nextUrl: { pathname: "/api/edgestore/init" },
    } as unknown as NextRequest;

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockInnerHandler).toHaveBeenCalledWith(req);
  });

  it("routes POST request through EdgeStore handler", async () => {
    mockInnerHandler.mockResolvedValueOnce(new Response("created", { status: 201 }));

    const { POST } = await import(
      "@/app/api/edgestore/[...edgestore]/route"
    );

    const req = {
      method: "POST",
      nextUrl: { pathname: "/api/edgestore/upload" },
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockInnerHandler).toHaveBeenCalledWith(req);
  });

  it("logs error and rethrows when EdgeStore handler throws an error", async () => {
    mockInnerHandler.mockRejectedValueOnce(new Error("EdgeStore failure"));

    const { POST } = await import(
      "@/app/api/edgestore/[...edgestore]/route"
    );

    const req = {
      method: "POST",
      nextUrl: { pathname: "/api/edgestore/upload" },
    } as unknown as NextRequest;

    await expect(POST(req)).rejects.toThrow("EdgeStore failure");
  });

  it("logs error when EdgeStore handler throws non-Error object", async () => {
    mockInnerHandler.mockRejectedValueOnce("Unknown error string");

    const { GET } = await import(
      "@/app/api/edgestore/[...edgestore]/route"
    );

    const req = {
      method: "GET",
      nextUrl: { pathname: "/api/edgestore/init" },
    } as unknown as NextRequest;

    await expect(GET(req)).rejects.toBe("Unknown error string");
  });
});

