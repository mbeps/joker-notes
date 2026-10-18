import { describe, expect, it, vi } from "vitest";

import { GET, HEAD, OPTIONS, POST } from "@/app/api/mcp/route";

vi.mock("@clerk/nextjs/server", () => ({
  verifyToken: vi.fn().mockImplementation(async (token: string) => {
    if (token === "valid-token") {
      return { sub: "user-test-123" };
    }
    throw new Error("Invalid token");
  }),
}));

describe("app/api/mcp/route", () => {
  describe("OPTIONS preflight", () => {
    it("returns 204 with full CORS headers", async () => {
      const response = await OPTIONS();
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("access-control-allow-methods")).toContain(
        "POST",
      );
      expect(response.headers.get("access-control-allow-headers")).toContain(
        "Authorization",
      );
    });
  });

  describe("HEAD probe", () => {
    it("returns 200 with JSON content type and CORS", async () => {
      const response = await HEAD();
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("content-type")).toBe("application/json");
    });
  });

  describe("GET handler", () => {
    it("challenges unauthenticated request when ?auth=required", async () => {
      const req = new Request("http://localhost:3000/api/mcp?auth=required", {
        method: "GET",
      });
      const response = await GET(req);

      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("Bearer");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("returns 405 Method Not Allowed when unauthenticated and no auth query", async () => {
      const req = new Request("http://localhost:3000/api/mcp", {
        method: "GET",
      });
      const response = await GET(req);

      expect(response.status).toBe(405);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("serves informative HTML page on browser GET visits with text/html", async () => {
      const req = new Request("http://localhost:3000/api/mcp", {
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      const html = await response.text();
      expect(html).toContain("Joker Notes MCP Server");
    });
  });

  describe("POST handler", () => {
    it("challenges request with invalid Bearer token", async () => {
      const req = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          authorization: "Bearer invalid-token",
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {},
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("error=\"invalid_token\"");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("normalizes missing Content-Type and wildcard Accept headers", async () => {
      const req = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          accept: "*/*",
          authorization: "Bearer valid-token",
          "mcp-protocol-version": "2026-07-28",
          "mcp-method": "tools/call",
          "mcp-name": "list_trash",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "list_trash",
            arguments: {},
            _meta: {
              "io.modelcontextprotocol/protocolVersion": "2026-07-28",
              "io.modelcontextprotocol/clientCapabilities": {},
            },
          },
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");

      const body = await response.json();
      expect(body.result).toBeDefined();
    });
  });
});

