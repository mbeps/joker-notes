import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createAuthorizationCode,
  createIdToken,
  createTokenPair,
  getJwks,
  getOrCreateRsaKeyStore,
  refreshTokens,
  resetRsaKeyStore,
  signHmacPayload,
  verifyAccessToken,
  verifyAuthorizationCode,
  verifyHmacPayload,
  verifyPkce,
} from "@/lib/mcp/oauth";

describe("lib/mcp/oauth", () => {
  beforeEach(() => {
    resetRsaKeyStore();
  });

  describe("RSA Key Store & JWKS", () => {
    it("initializes and memoizes RSA key store", () => {
      const store1 = getOrCreateRsaKeyStore();
      expect(store1.privateKey).toBeDefined();
      expect(store1.publicKey).toBeDefined();
      expect(store1.jwk.kty).toBe("RSA");
      expect(store1.jwk.alg).toBe("RS256");

      const store2 = getOrCreateRsaKeyStore();
      expect(store1).toBe(store2);
    });

    it("returns formatted JWKS response with kid and alg", () => {
      const jwks = getJwks();
      expect(jwks.keys).toHaveLength(1);
      expect(jwks.keys[0].kid).toBe("joker-notes-key-1");
      expect(jwks.keys[0].use).toBe("sig");
    });
  });

  describe("HMAC Payload Signing & Verification", () => {
    it("signs and successfully verifies JSON payload", () => {
      const payload = { hello: "world", count: 42 };
      const token = signHmacPayload(payload, "test-secret");
      const verified = verifyHmacPayload<{ hello: string; count: number }>(
        token,
        "test-secret",
      );
      expect(verified).toEqual(payload);
    });

    it("returns null for non-string, empty, or single-part tokens", () => {
      expect(verifyHmacPayload("")).toBeNull();
      expect(verifyHmacPayload(null as unknown as string)).toBeNull();
      expect(verifyHmacPayload("justadata")).toBeNull();
      expect(verifyHmacPayload(".")).toBeNull();
      expect(verifyHmacPayload("data.")).toBeNull();
      expect(verifyHmacPayload(".sig")).toBeNull();
    });

    it("returns null on signature tampering or mismatched secrets", () => {
      const token = signHmacPayload({ a: 1 }, "secret-1");
      const tampered = `${token.split(".")[0]}.invalidsig`;
      expect(verifyHmacPayload(tampered, "secret-1")).toBeNull();
      expect(verifyHmacPayload(token, "secret-2")).toBeNull();
    });

    it("returns null when base64 payload is corrupted JSON", () => {
      const invalidJsonBase64 = Buffer.from("{invalidJson").toString("base64url");
      const validSigForBadJson = crypto
        .createHmac("sha256", "test-secret")
        .update(invalidJsonBase64)
        .digest("base64url");
      expect(
        verifyHmacPayload(`${invalidJsonBase64}.${validSigForBadJson}`, "test-secret"),
      ).toBeNull();
    });
  });

  describe("Authorization Codes", () => {
    it("creates and verifies valid authorization codes", () => {
      const code = createAuthorizationCode({
        userId: "user-456",
        clientId: "client-789",
        redirectUri: "https://ai.example.com/callback",
        codeChallenge: "challenge-abc",
        codeChallengeMethod: "S256",
        scope: "openid",
        sessionId: "sess-1",
      });

      const payload = verifyAuthorizationCode(code);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe("user-456");
      expect(payload?.clientId).toBe("client-789");
      expect(payload?.codeChallenge).toBe("challenge-abc");
    });

    it("rejects expired authorization codes", () => {
      const code = createAuthorizationCode(
        {
          userId: "user-456",
          clientId: "client-789",
          redirectUri: "https://ai.example.com/callback",
        },
        -1000,
      );

      const payload = verifyAuthorizationCode(code);
      expect(payload).toBeNull();
    });

    it("returns null for malformed or tampered authorization codes", () => {
      expect(verifyAuthorizationCode("not-a-code")).toBeNull();
    });
  });

  describe("PKCE Verification", () => {
    it("returns true when no challenge is present", () => {
      expect(verifyPkce("any-verifier")).toBe(true);
      expect(verifyPkce("any-verifier", undefined)).toBe(true);
    });

    it("returns false if challenge is present but verifier is empty", () => {
      expect(verifyPkce("", "challenge-123")).toBe(false);
    });

    it("verifies plain PKCE challenges", () => {
      expect(verifyPkce("my-verifier", "my-verifier", "plain")).toBe(true);
      expect(verifyPkce("my-verifier", "different-verifier", "plain")).toBe(false);
    });

    it("verifies S256 PKCE challenges", () => {
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      const expectedChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
      expect(verifyPkce(verifier, expectedChallenge, "S256")).toBe(true);
      expect(verifyPkce("wrong-verifier", expectedChallenge, "S256")).toBe(false);
    });
  });

  describe("OIDC ID Tokens", () => {
    it("mints RS256 signed ID token JWT with 3 parts", () => {
      const idToken = createIdToken("user-1", "gemini-client", "https://app.test");
      const parts = idToken.split(".");
      expect(parts).toHaveLength(3);

      const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
      expect(header.alg).toBe("RS256");
      expect(header.kid).toBe("joker-notes-key-1");

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      expect(payload.sub).toBe("user-1");
      expect(payload.aud).toBe("gemini-client");
      expect(payload.iss).toBe("https://app.test");
    });
  });

  describe("Token Pairs and Refreshing", () => {
    it("creates token pair with access, refresh, and id tokens", () => {
      const pair = createTokenPair("user-99", "gemini-client", "openid profile");
      expect(pair.access_token).toBeDefined();
      expect(pair.refresh_token).toBeDefined();
      expect(pair.id_token).toBeDefined();
      expect(pair.token_type).toBe("Bearer");
      expect(pair.expires_in).toBe(86400);

      const accessPayload = verifyAccessToken(pair.access_token);
      expect(accessPayload).not.toBeNull();
      expect(accessPayload?.sub).toBe("user-99");
      expect(accessPayload?.clientId).toBe("gemini-client");
    });

    it("rejects refresh tokens passed to verifyAccessToken", () => {
      const pair = createTokenPair("user-99", "gemini-client");
      expect(verifyAccessToken(pair.refresh_token)).toBeNull();
    });

    it("rejects access tokens passed to refreshTokens", () => {
      const pair = createTokenPair("user-99", "gemini-client");
      expect(refreshTokens(pair.access_token)).toBeNull();
    });

    it("rejects invalid or malformed tokens", () => {
      expect(verifyAccessToken("invalid.token")).toBeNull();
      expect(refreshTokens("invalid.token")).toBeNull();
    });

    it("successfully exchanges valid refresh token for fresh pair", () => {
      const initial = createTokenPair("user-99", "gemini-client", "openid");
      const refreshed = refreshTokens(initial.refresh_token);
      expect(refreshed).not.toBeNull();
      expect(refreshed?.access_token).toBeDefined();
      expect(refreshed?.refresh_token).toBeDefined();

      const newAccess = verifyAccessToken(refreshed!.access_token);
      expect(newAccess?.sub).toBe("user-99");
    });

    it("rejects expired access and refresh tokens", () => {
      const expiredAccess = signHmacPayload({
        sub: "user-1",
        clientId: "client-1",
        scope: "openid",
        type: "access",
        exp: Math.floor(Date.now() / 1000) - 100,
        iat: Math.floor(Date.now() / 1000) - 200,
      });
      expect(verifyAccessToken(expiredAccess)).toBeNull();

      const expiredRefresh = signHmacPayload({
        sub: "user-1",
        clientId: "client-1",
        scope: "openid",
        type: "refresh",
        exp: Math.floor(Date.now() / 1000) - 100,
        iat: Math.floor(Date.now() / 1000) - 200,
      });
      expect(refreshTokens(expiredRefresh)).toBeNull();
    });
  });
});
