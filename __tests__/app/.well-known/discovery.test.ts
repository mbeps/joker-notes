import { describe, expect, it } from "vitest";

import {
  GET as getProtectedResource,
  OPTIONS as optionsProtectedResource,
} from "@/app/.well-known/oauth-protected-resource/[[...resource]]/route";
import {
  GET as getAuthServer,
  OPTIONS as optionsAuthServer,
} from "@/app/.well-known/oauth-authorization-server/[[...path]]/route";
import {
  GET as getOpenIdConfig,
  OPTIONS as optionsOpenIdConfig,
} from "@/app/.well-known/openid-configuration/route";

describe("Discovery & Metadata Endpoints", () => {
  describe("RFC 9728 Protected Resource Metadata", () => {
    it("returns resource metadata with offline_access and application auth server", async () => {
      const req = new Request(
        "http://localhost:3000/.well-known/oauth-protected-resource/api/mcp",
      );
      const res = await getProtectedResource(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("content-type")).toContain("application/json");

      const data = await res.json();
      expect(data.resource).toBe("http://localhost:3000/api/mcp");
      expect(data.authorization_servers).toContain("http://localhost:3000");
      expect(data.scopes_supported).toContain("offline_access");
      expect(data.scopes_supported).toContain("openid");
    });

    it("handles OPTIONS preflight", async () => {
      const res = await optionsProtectedResource();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("RFC 8414 OAuth Authorization Server Metadata", () => {
    it("returns authorization server metadata", async () => {
      const res = await getAuthServer();

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");

      const data = await res.json();
      expect(data.issuer).toBe("http://localhost:3000");
      expect(data.authorization_endpoint).toBe(
        "http://localhost:3000/oauth/authorize",
      );
      expect(data.token_endpoint).toBe("http://localhost:3000/api/oauth/token");
      expect(data.registration_endpoint).toBe(
        "http://localhost:3000/api/oauth/register",
      );
      expect(data.userinfo_endpoint).toBe(
        "http://localhost:3000/api/oauth/userinfo",
      );
      expect(data.jwks_uri).toBe("http://localhost:3000/.well-known/jwks.json");
      expect(data.scopes_supported).toContain("offline_access");
    });

    it("handles OPTIONS preflight", async () => {
      const res = await optionsAuthServer();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("Root OpenID Configuration Discovery", () => {
    it("returns OIDC discovery metadata", async () => {
      const res = await getOpenIdConfig();

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");

      const data = await res.json();
      expect(data.issuer).toBe("http://localhost:3000");
      expect(data.authorization_endpoint).toBe(
        "http://localhost:3000/oauth/authorize",
      );
      expect(data.token_endpoint).toBe("http://localhost:3000/api/oauth/token");
      expect(data.registration_endpoint).toBe(
        "http://localhost:3000/api/oauth/register",
      );
      expect(data.userinfo_endpoint).toBe(
        "http://localhost:3000/api/oauth/userinfo",
      );
      expect(data.jwks_uri).toBe("http://localhost:3000/.well-known/jwks.json");
      expect(data.scopes_supported).toContain("offline_access");
    });

    it("handles OPTIONS preflight", async () => {
      const res = await optionsOpenIdConfig();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});

