import { describe, expect, it, vi } from "vitest";

import { GET as getJwksRoute, OPTIONS as optionsJwksRoute } from "@/app/.well-known/jwks.json/route";
import { POST as handleConsentDecision } from "@/app/api/oauth/consent/route";
import {
  OPTIONS as optionsRegisterRoute,
  POST as handleRegister,
} from "@/app/api/oauth/register/route";
import {
  OPTIONS as optionsTokenRoute,
  POST as handleTokenExchange,
} from "@/app/api/oauth/token/route";
import {
  GET as getUserInfo,
  OPTIONS as optionsUserInfoRoute,
} from "@/app/api/oauth/userinfo/route";
import { GET as handleAuthorize } from "@/app/oauth/authorize/route";
import {
  createAuthorizationCode,
  createTokenPair,
} from "@/lib/mcp/oauth";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({
    userId: "test-clerk-user-1",
    sessionId: "test-clerk-session-1",
  }),
}));

describe("OAuth 2.1 API Routes", () => {
  describe("JWKS endpoint (/.well-known/jwks.json)", () => {
    it("handles OPTIONS preflight", async () => {
      const res = await optionsJwksRoute();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("returns public keys in standard JWKS format", async () => {
      const res = await getJwksRoute();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.keys).toBeDefined();
      expect(Array.isArray(data.keys)).toBe(true);
      expect(data.keys[0].kid).toBe("joker-notes-key-1");
    });
  });

  describe("Dynamic Client Registration (/api/oauth/register)", () => {
    it("handles OPTIONS preflight", async () => {
      const res = await optionsRegisterRoute();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("registers client and returns 201 with client_id", async () => {
      const req = new Request("http://localhost:3000/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Gemini AI",
          redirect_uris: ["https://gemini.google.com/oauth/callback"],
        }),
      });

      const res = await handleRegister(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.client_id).toMatch(/^client_/);
      expect(data.client_name).toBe("Gemini AI");
      expect(data.redirect_uris).toContain("https://gemini.google.com/oauth/callback");
    });

    it("returns 400 on malformed JSON payload", async () => {
      const req = new Request("http://localhost:3000/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const res = await handleRegister(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("invalid_client_metadata");
    });
  });

  describe("Authorize Endpoint (/oauth/authorize)", () => {
    it("returns 400 when redirect_uri is missing", async () => {
      const req = new Request("http://localhost:3000/oauth/authorize?response_type=code");
      const res = await handleAuthorize(req);
      expect(res.status).toBe(400);
    });

    it("redirects with error when response_type is not code", async () => {
      const req = new Request(
        "http://localhost:3000/oauth/authorize?response_type=token&redirect_uri=https://client.com/callback&state=xyz",
      );
      const res = await handleAuthorize(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("error=unsupported_response_type");
      expect(location).toContain("state=xyz");
    });

    it("redirects to /oauth/consent when valid", async () => {
      const req = new Request(
        "http://localhost:3000/oauth/authorize?response_type=code&client_id=chatgpt&redirect_uri=https://chatgpt.com/callback&state=state123",
      );
      const res = await handleAuthorize(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/oauth/consent");
      expect(location).toContain("client_id=chatgpt");
      expect(location).toContain("state=state123");
    });
  });

  describe("Consent Decision Endpoint (/api/oauth/consent)", () => {
    it("returns 401 if user is unauthenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValueOnce({
        userId: null,
      } as unknown as Awaited<ReturnType<typeof auth>>);

      const req = new Request("http://localhost:3000/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "allow" }),
      });

      const res = await handleConsentDecision(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 if redirect_uri is missing", async () => {
      const req = new Request("http://localhost:3000/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "allow", client_id: "client-1" }),
      });

      const res = await handleConsentDecision(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("invalid_request");
    });

    it("handles deny decision and redirects with error=access_denied", async () => {
      const req = new Request("http://localhost:3000/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "deny",
          client_id: "client-1",
          redirect_uri: "https://ai.example.com/callback",
          state: "st-99",
        }),
      });

      const res = await handleConsentDecision(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.redirect_url).toContain("error=access_denied");
      expect(data.redirect_url).toContain("state=st-99");
    });

    it("handles allow decision and generates authorization code", async () => {
      const req = new Request("http://localhost:3000/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "allow",
          client_id: "client-1",
          redirect_uri: "https://ai.example.com/callback",
          state: "st-100",
          code_challenge: "challenge-123",
          code_challenge_method: "S256",
        }),
      });

      const res = await handleConsentDecision(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.redirect_url).toContain("code=");
      expect(data.redirect_url).toContain("state=st-100");
    });
  });

  describe("Token Exchange Endpoint (/api/oauth/token)", () => {
    it("handles OPTIONS preflight", async () => {
      const res = await optionsTokenRoute();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("returns 400 when grant_type is missing", async () => {
      const req = new Request("http://localhost:3000/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await handleTokenExchange(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("invalid_request");
    });

    it("returns 400 on unsupported grant_type", async () => {
      const req = new Request("http://localhost:3000/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "client_credentials" }),
      });

      const res = await handleTokenExchange(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("unsupported_grant_type");
    });

    describe("authorization_code grant", () => {
      it("returns 400 if code parameter is missing", async () => {
        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grant_type: "authorization_code" }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_request");
      });

      it("returns 400 on invalid or expired code", async () => {
        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code: "invalid-code",
          }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_grant");
      });

      it("returns 400 on redirect_uri mismatch", async () => {
        const code = createAuthorizationCode({
          userId: "user-1",
          clientId: "client-1",
          redirectUri: "https://expected.com/callback",
        });

        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://different.com/callback",
          }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_grant");
        expect(data.error_description).toContain("Redirect URI mismatch");
      });

      it("returns 400 when PKCE verification fails", async () => {
        const code = createAuthorizationCode({
          userId: "user-1",
          clientId: "client-1",
          redirectUri: "https://client.com/callback",
          codeChallenge: "expected-challenge",
          codeChallengeMethod: "plain",
        });

        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://client.com/callback",
            code_verifier: "wrong-verifier",
          }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_grant");
        expect(data.error_description).toContain("Code verifier");
      });

      it("successfully exchanges valid authorization_code with PKCE", async () => {
        const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

        const code = createAuthorizationCode({
          userId: "user-alice",
          clientId: "gemini-app",
          redirectUri: "https://gemini.com/callback",
          codeChallenge: challenge,
          codeChallengeMethod: "S256",
          scope: "openid profile offline_access",
        });

        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://gemini.com/callback",
            code_verifier: verifier,
          }).toString(),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.access_token).toBeDefined();
        expect(data.refresh_token).toBeDefined();
        expect(data.id_token).toBeDefined();
        expect(data.token_type).toBe("Bearer");
      });
    });

    describe("refresh_token grant", () => {
      it("returns 400 when refresh_token is missing", async () => {
        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grant_type: "refresh_token" }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_request");
      });

      it("returns 400 when refresh_token is invalid", async () => {
        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: "bad-token",
          }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("invalid_grant");
      });

      it("successfully exchanges valid refresh_token for fresh pair", async () => {
        const pair = createTokenPair("user-bob", "client-chatgpt");

        const req = new Request("http://localhost:3000/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: pair.refresh_token,
          }),
        });

        const res = await handleTokenExchange(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.access_token).toBeDefined();
        expect(data.refresh_token).toBeDefined();
      });
    });
  });

  describe("UserInfo Endpoint (/api/oauth/userinfo)", () => {
    it("handles OPTIONS preflight", async () => {
      const res = await optionsUserInfoRoute();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("returns 401 when Authorization header is missing or malformed", async () => {
      const req = new Request("http://localhost:3000/api/oauth/userinfo");
      const res = await getUserInfo(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when access token is invalid", async () => {
      const req = new Request("http://localhost:3000/api/oauth/userinfo", {
        headers: { Authorization: "Bearer bad-token" },
      });
      const res = await getUserInfo(req);
      expect(res.status).toBe(401);
    });

    it("returns user info claims when access token is valid", async () => {
      const pair = createTokenPair("user-carol", "client-gemini");
      const req = new Request("http://localhost:3000/api/oauth/userinfo", {
        headers: { Authorization: `Bearer ${pair.access_token}` },
      });
      const res = await getUserInfo(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sub).toBe("user-carol");
    });
  });
});

