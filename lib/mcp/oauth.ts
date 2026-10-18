import crypto from "node:crypto";
import { serverEnv } from "@/config/env";

export interface AuthorizationCodePayload {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  scope?: string;
  sessionId?: string;
  expiresAt: number;
}

export interface OAuthTokenPayload {
  sub: string;
  clientId: string;
  sessionId?: string;
  scope: string;
  type: "access" | "refresh";
  exp: number;
  iat: number;
}

export interface TokenPair {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  id_token: string;
  scope: string;
}

interface RsaKeyStore {
  privateKey: string;
  publicKey: string;
  jwk: {
    kty: string;
    use: string;
    alg: string;
    kid: string;
    n?: string;
    e?: string;
  };
}

let keyStore: RsaKeyStore | null = null;

/**
 * Initializes or returns the RSA keypair used for OIDC ID tokens and JWKS.
 *
 * @returns Cached RSA keypair with JWK representation.
 */
export function getOrCreateRsaKeyStore(): RsaKeyStore {
  if (!keyStore) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const exportedJwk = publicKey.export({ format: "jwk" });
    keyStore = {
      privateKey: privateKey.export({ format: "pem", type: "pkcs8" }) as string,
      publicKey: publicKey.export({ format: "pem", type: "spki" }) as string,
      jwk: {
        kty: exportedJwk.kty as string,
        use: "sig",
        alg: "RS256",
        kid: "joker-notes-key-1",
        n: exportedJwk.n,
        e: exportedJwk.e,
      },
    };
  }
  return keyStore;
}

/**
 * Resets the in-memory RSA key store. Primarily used in unit tests.
 */
export function resetRsaKeyStore(): void {
  keyStore = null;
}

/**
 * Returns standard JWKS response payload containing the active public key.
 */
export function getJwks(): { keys: Array<RsaKeyStore["jwk"]> } {
  const store = getOrCreateRsaKeyStore();
  return {
    keys: [store.jwk],
  };
}

function getSecretKey(): string {
  return serverEnv.CLERK_SECRET_KEY;
}

/**
 * Signs an arbitrary JSON payload with HMAC-SHA256.
 *
 * @param payload - Object to serialize and sign.
 * @param secret - Optional signing secret (defaults to CLERK_SECRET_KEY).
 * @returns Signed string in <data>.<signature> format.
 */
export function signHmacPayload(
  payload: Record<string, unknown>,
  secret: string = getSecretKey(),
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and parses an HMAC-SHA256 signed string.
 *
 * @param token - Token in <data>.<signature> format.
 * @param secret - Optional signing secret (defaults to CLERK_SECRET_KEY).
 * @returns Parsed payload if signature is valid, or null otherwise.
 */
export function verifyHmacPayload<T>(
  token: string,
  secret: string = getSecretKey(),
): T | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [data, signature] = parts;
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Creates a signed OAuth authorization code with 10-minute expiration.
 *
 * @param data - Authorization code attributes.
 * @param ttlMs - Time-to-live in milliseconds (defaults to 10 minutes).
 * @returns Signed authorization code string.
 */
export function createAuthorizationCode(
  data: Omit<AuthorizationCodePayload, "expiresAt">,
  ttlMs = 600000,
): string {
  const payload: AuthorizationCodePayload = {
    ...data,
    expiresAt: Date.now() + ttlMs,
  };
  return signHmacPayload(payload as unknown as Record<string, unknown>);
}

/**
 * Validates and decodes an OAuth authorization code.
 *
 * @param code - Authorization code string.
 * @returns Decoded payload if valid and unexpired, null otherwise.
 */
export function verifyAuthorizationCode(
  code: string,
): AuthorizationCodePayload | null {
  const payload = verifyHmacPayload<AuthorizationCodePayload>(code);
  if (!payload) {
    return null;
  }

  if (payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

/**
 * Verifies a PKCE code challenge against the provided code verifier.
 * Supports S256 (SHA-256 base64url) and plain methods.
 *
 * @param verifier - Plaintext verifier string sent by client to token endpoint.
 * @param challenge - Challenge string sent during authorization request.
 * @param method - Code challenge method ('S256' or 'plain').
 * @returns True if verifier satisfies challenge.
 */
export function verifyPkce(
  verifier: string,
  challenge?: string,
  method: "S256" | "plain" = "S256",
): boolean {
  if (!challenge) {
    return true;
  }

  if (!verifier) {
    return false;
  }

  if (method === "plain") {
    return verifier === challenge;
  }

  const computed = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return computed === challenge;
}

/**
 * Mints an RS256 signed OIDC ID token for AI clients requiring OpenID Connect.
 *
 * @param userId - User subject identifier.
 * @param clientId - Client audience identifier.
 * @param issuer - Token issuer URL.
 * @returns Signed OIDC ID token JWT string.
 */
export function createIdToken(
  userId: string,
  clientId: string,
  issuer = "http://localhost:3000",
): string {
  const store = getOrCreateRsaKeyStore();
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
      kid: store.jwk.kid,
    }),
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({
      iss: issuer,
      sub: userId,
      aud: clientId,
      exp: now + 86400,
      iat: now,
    }),
  ).toString("base64url");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(store.privateKey, "base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Issues an OAuth 2.1 token pair (access token, refresh token, id token).
 *
 * @param userId - User subject ID.
 * @param clientId - Client ID.
 * @param scope - Authorized scope string.
 * @param sessionId - Optional Clerk session ID.
 * @param issuer - Optional issuer URL for ID token.
 * @returns Complete token pair result.
 */
export function createTokenPair(
  userId: string,
  clientId: string,
  scope = "openid profile email offline_access",
  sessionId?: string,
  issuer?: string,
): TokenPair {
  const now = Math.floor(Date.now() / 1000);
  const accessTtl = 86400; // 24 hours
  const refreshTtl = 30 * 86400; // 30 days

  const accessPayload: OAuthTokenPayload = {
    sub: userId,
    clientId,
    sessionId,
    scope,
    type: "access",
    exp: now + accessTtl,
    iat: now,
  };

  const refreshPayload: OAuthTokenPayload = {
    sub: userId,
    clientId,
    sessionId,
    scope,
    type: "refresh",
    exp: now + refreshTtl,
    iat: now,
  };

  const accessToken = signHmacPayload(
    accessPayload as unknown as Record<string, unknown>,
  );
  const refreshToken = signHmacPayload(
    refreshPayload as unknown as Record<string, unknown>,
  );
  const idToken = createIdToken(userId, clientId, issuer);

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: accessTtl,
    refresh_token: refreshToken,
    id_token: idToken,
    scope,
  };
}

/**
 * Validates an access token and returns its payload if active and unexpired.
 *
 * @param token - Access token string.
 * @returns OAuthTokenPayload if valid, null otherwise.
 */
export function verifyAccessToken(token: string): OAuthTokenPayload | null {
  const payload = verifyHmacPayload<OAuthTokenPayload>(token);
  if (!payload) {
    return null;
  }

  if (payload.type !== "access") {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return null;
  }

  return payload;
}

/**
 * Exchanges a refresh token for a newly minted token pair.
 *
 * @param refreshToken - Active refresh token string.
 * @param issuer - Optional issuer URL for newly minted ID token.
 * @returns Fresh TokenPair if refresh token is valid, null otherwise.
 */
export function refreshTokens(
  refreshToken: string,
  issuer?: string,
): TokenPair | null {
  const payload = verifyHmacPayload<OAuthTokenPayload>(refreshToken);
  if (!payload) {
    return null;
  }

  if (payload.type !== "refresh") {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return null;
  }

  return createTokenPair(
    payload.sub,
    payload.clientId,
    payload.scope,
    payload.sessionId,
    issuer,
  );
}
