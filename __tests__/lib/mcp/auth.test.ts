import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { describe, expect, it, vi } from "vitest";

import {
  createConvexClient,
  getClerkIssuerUrl,
  getMcpResourceUrl,
  getMcpToken,
  getMcpUserId,
  getSiteUrl,
  verifyMcpToken,
} from "@/lib/mcp/auth";

const mockSetAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(function (this: any, url: string) {
    this.url = url;
    this.setAuth = mockSetAuth;
    return this;
  }),
}));

describe("lib/mcp/auth", () => {
  describe("getSiteUrl", () => {
    it("extracts origin from request url and strips trailing slashes", () => {
      const req = new Request("https://example.com/api/mcp/");
      expect(getSiteUrl(req)).toBe("https://example.com");
    });

    it("falls back to default when no request is provided", () => {
      const originalVercelUrl = process.env.VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getSiteUrl()).toBe("http://localhost:3000");

      process.env.VERCEL_URL = "my-site.vercel.app/";
      expect(getSiteUrl()).toBe("https://my-site.vercel.app");

      if (originalVercelUrl) {
        process.env.VERCEL_URL = originalVercelUrl;
      } else {
        delete process.env.VERCEL_URL;
      }
    });
  });

  describe("getClerkIssuerUrl", () => {
    it("returns default clerk domain or env variable", () => {
      const orig = process.env.CLERK_ISSUER_URL;
      delete process.env.CLERK_ISSUER_URL;

      expect(getClerkIssuerUrl()).toBe(
        "https://grateful-glowworm-20.clerk.accounts.dev",
      );

      process.env.CLERK_ISSUER_URL = "https://custom.clerk.dev/";
      expect(getClerkIssuerUrl()).toBe("https://custom.clerk.dev");

      if (orig) {
        process.env.CLERK_ISSUER_URL = orig;
      } else {
        delete process.env.CLERK_ISSUER_URL;
      }
    });
  });

  describe("getMcpResourceUrl", () => {
    it("returns resource URL for mcp endpoint", () => {
      const req = new Request("https://notes.example.com/");
      expect(getMcpResourceUrl(req)).toBe("https://notes.example.com/api/mcp");
    });
  });

  describe("verifyMcpToken", () => {
    it("returns undefined when no token provided and auth is not required", async () => {
      const req = new Request("https://example.com/api/mcp");
      const result = await verifyMcpToken(req, undefined);
      expect(result).toBeUndefined();
    });

    it("throws OAuthError when auth=required query is present without token", async () => {
      const req = new Request("https://example.com/api/mcp?auth=required");
      await expect(verifyMcpToken(req, undefined)).rejects.toThrow(OAuthError);
      await expect(verifyMcpToken(req, undefined)).rejects.toMatchObject({
        code: OAuthErrorCode.InvalidToken,
      });
    });

    it("verifies valid token and returns AuthInfo with user ID", async () => {
      const { verifyToken } = await import("@clerk/nextjs/server");
      vi.mocked(verifyToken).mockResolvedValueOnce({
        sub: "user_test_123",
      } as unknown as Awaited<ReturnType<typeof verifyToken>>);

      const req = new Request("https://example.com/api/mcp");
      const result = await verifyMcpToken(req, "valid-token");

      expect(result).toBeDefined();
      expect(result?.token).toBe("valid-token");
      expect(result?.clientId).toBe("user_test_123");
      expect(result?.extra?.userId).toBe("user_test_123");
      expect(result?.scopes).toContain("offline_access");
    });

    it("uses azp as clientId when present on payload", async () => {
      const { verifyToken } = await import("@clerk/nextjs/server");
      vi.mocked(verifyToken).mockResolvedValueOnce({
        sub: "user_test_123",
        azp: "client_app_abc",
      } as unknown as Awaited<ReturnType<typeof verifyToken>>);

      const req = new Request("https://example.com/api/mcp");
      const result = await verifyMcpToken(req, "valid-token");

      expect(result).toBeDefined();
      expect(result?.clientId).toBe("client_app_abc");
    });

    it("throws OAuthError when token verification fails", async () => {
      const { verifyToken } = await import("@clerk/nextjs/server");
      vi.mocked(verifyToken).mockRejectedValueOnce(new Error("Invalid token"));

      const req = new Request("https://example.com/api/mcp");
      await expect(verifyMcpToken(req, "bad-token")).rejects.toThrow(
        OAuthError,
      );
      await expect(verifyMcpToken(req, "bad-token")).rejects.toMatchObject({
        code: OAuthErrorCode.InvalidToken,
      });
    });
  });

  describe("getMcpUserId", () => {
    it("extracts userId from ctx.http.authInfo.extra.userId", () => {
      const ctx = {
        http: {
          authInfo: {
            extra: { userId: "user_1" },
          },
        },
      };
      expect(getMcpUserId(ctx)).toBe("user_1");
    });

    it("extracts userId from ctx.authInfo.extra.userId", () => {
      const ctx = {
        authInfo: {
          extra: { userId: "user_2" },
        },
      };
      expect(getMcpUserId(ctx)).toBe("user_2");
    });

    it("extracts userId from ctx.http.authInfo.userId", () => {
      const ctx = {
        http: {
          authInfo: {
            userId: "user_3",
          },
        },
      };
      expect(getMcpUserId(ctx)).toBe("user_3");
    });

    it("extracts userId from ctx.authInfo.userId", () => {
      const ctx = {
        authInfo: {
          userId: "user_4",
        },
      };
      expect(getMcpUserId(ctx)).toBe("user_4");
    });

    it("returns undefined when ctx has no user info", () => {
      expect(getMcpUserId(null)).toBeUndefined();
      expect(getMcpUserId({})).toBeUndefined();
      expect(getMcpUserId({ http: {} })).toBeUndefined();
    });
  });

  describe("getMcpToken", () => {
    it("extracts token from ctx.http.authInfo.token", () => {
      const ctx = {
        http: {
          authInfo: {
            token: "tok_1",
          },
        },
      };
      expect(getMcpToken(ctx)).toBe("tok_1");
    });

    it("extracts token from ctx.authInfo.token", () => {
      const ctx = {
        authInfo: {
          token: "tok_2",
        },
      };
      expect(getMcpToken(ctx)).toBe("tok_2");
    });

    it("returns undefined when ctx has no token info", () => {
      expect(getMcpToken(null)).toBeUndefined();
      expect(getMcpToken({})).toBeUndefined();
      expect(getMcpToken({ http: {} })).toBeUndefined();
    });
  });

  describe("createConvexClient", () => {
    it("creates client without auth token", async () => {
      mockSetAuth.mockClear();
      const { ConvexHttpClient } = await import("convex/browser");
      createConvexClient();
      expect(ConvexHttpClient).toHaveBeenCalled();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it("creates client with auth token", () => {
      mockSetAuth.mockClear();
      createConvexClient("my-token");
      expect(mockSetAuth).toHaveBeenCalledWith("my-token");
    });
  });
});
