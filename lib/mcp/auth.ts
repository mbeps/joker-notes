import { createClerkClient, verifyToken } from "@clerk/nextjs/server";
import {
  type AuthInfo,
  OAuthError,
  OAuthErrorCode,
} from "@modelcontextprotocol/server";
import { ConvexHttpClient } from "convex/browser";

import { serverEnv } from "@/config/env";
import { verifyAccessToken } from "@/lib/mcp/oauth";

/**
 * Supported OAuth scopes advertised in discovery metadata.
 */
export const MCP_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
] as const;

/**
 * Normalizes the site base URL, stripping trailing slashes.
 *
 * @param req - Optional incoming HTTP request to infer origin from.
 * @returns Sanitized site base URL without trailing slash.
 */
export function getSiteUrl(req?: Request): string {
  if (req?.url) {
    return new URL(req.url).origin.replace(/\/+$/, "");
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

/**
 * Resolves the Clerk authorization server issuer URL.
 *
 * @returns Fully qualified Clerk issuer URL without trailing slash.
 */
export function getClerkIssuerUrl(): string {
  if (process.env.CLERK_ISSUER_URL) {
    return process.env.CLERK_ISSUER_URL.replace(/\/+$/, "");
  }
  return "https://grateful-glowworm-20.clerk.accounts.dev";
}

/**
 * Resolves the application authorization server URL.
 *
 * @param req - Optional incoming HTTP request.
 * @returns Fully qualified authorization server URL.
 */
export function getAuthServerUrl(req?: Request): string {
  return getSiteUrl(req);
}

/**
 * Computes the public canonical resource URL for the MCP endpoint.
 *
 * @param req - Optional incoming HTTP request.
 * @returns Fully qualified MCP resource URL.
 */
export function getMcpResourceUrl(req?: Request): string {
  return `${getSiteUrl(req)}/api/mcp`;
}

export interface McpAuthInfo extends AuthInfo {
  extra: {
    userId: string;
  };
}

/**
 * Validates incoming Bearer token using internal OAuth 2.1 or Clerk, enforcing ?auth=required challenges.
 *
 * @param req - Inbound HTTP Request.
 * @param bearerToken - Extracted Bearer token string if present.
 * @returns Resolved authentication info, or undefined if unauthenticated and not challenged.
 * @throws {OAuthError} When token is invalid or when auth=required is requested without token.
 */
export async function verifyMcpToken(
  req: Request,
  bearerToken?: string,
): Promise<McpAuthInfo | undefined> {
  const url = new URL(req.url);
  const isAuthRequired = url.searchParams.get("auth") === "required";

  if (!bearerToken) {
    if (isAuthRequired) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        "Authentication required",
      );
    }
    return undefined;
  }

  // 1. Try verifying as an internal OAuth 2.1 access token
  const oauthPayload = verifyAccessToken(bearerToken);
  if (oauthPayload) {
    let clerkToken: string | undefined;
    if (oauthPayload.sessionId) {
      try {
        const clerk = createClerkClient({
          secretKey: serverEnv.CLERK_SECRET_KEY,
        });
        const sessionToken = await clerk.sessions.getToken(
          oauthPayload.sessionId,
          "convex",
        );
        clerkToken = sessionToken?.jwt;
      } catch {
        // Fall back gracefully to bearerToken
      }
    }

    return {
      token: clerkToken ?? bearerToken,
      clientId: oauthPayload.clientId,
      scopes: [...MCP_SCOPES],
      extra: {
        userId: oauthPayload.sub,
      },
    };
  }

  // 2. Fall back to verifying direct Clerk JWT
  try {
    const payload = await verifyToken(bearerToken, {
      secretKey: serverEnv.CLERK_SECRET_KEY,
    });

    const clientId = (payload as { azp?: string }).azp ?? payload.sub;

    return {
      token: bearerToken,
      clientId,
      scopes: [...MCP_SCOPES],
      extra: {
        userId: payload.sub,
      },
    };
  } catch {
    throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid token");
  }
}

/**
 * Safely extracts user ID from MCP v2 execution context or HTTP auth info.
 *
 * @param ctx - Tool execution context passed by MCP runtime.
 * @returns Authenticated user ID string, or undefined if unauthenticated.
 */
export function getMcpUserId(ctx: unknown): string | undefined {
  const c = ctx as
    | {
        http?: { authInfo?: { extra?: { userId?: string }; userId?: string } };
        authInfo?: { extra?: { userId?: string }; userId?: string };
      }
    | null
    | undefined;

  return (
    c?.http?.authInfo?.extra?.userId ??
    c?.authInfo?.extra?.userId ??
    c?.http?.authInfo?.userId ??
    c?.authInfo?.userId
  );
}

/**
 * Safely extracts Bearer token from MCP v2 execution context or HTTP auth info.
 *
 * @param ctx - Tool execution context passed by MCP runtime.
 * @returns Bearer token string, or undefined if not present.
 */
export function getMcpToken(ctx: unknown): string | undefined {
  const c = ctx as
    | {
        http?: { authInfo?: { token?: string } };
        authInfo?: { token?: string };
      }
    | null
    | undefined;

  return c?.http?.authInfo?.token ?? c?.authInfo?.token;
}

/**
 * Factory creating an isolated ConvexHttpClient instance per-request.
 * Avoids cross-request token contamination across concurrent requests.
 *
 * @param token - Optional Bearer token for authenticating queries and mutations.
 * @returns Fresh ConvexHttpClient instance.
 */
export function createConvexClient(token?: string): ConvexHttpClient {
  const client = new ConvexHttpClient(serverEnv.NEXT_PUBLIC_CONVEX_URL);
  if (token) {
    client.setAuth(token);
  }
  return client;
}
