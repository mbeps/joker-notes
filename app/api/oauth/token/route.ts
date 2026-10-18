import { getSiteUrl } from "@/lib/mcp/auth";
import {
  createTokenPair,
  refreshTokens,
  verifyAuthorizationCode,
  verifyPkce,
} from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for OAuth token requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Parses parameters from either application/x-www-form-urlencoded or application/json.
 */
async function parseTokenRequest(
  req: Request,
): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  const params: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params[key] = value;
      }
    }
  } else {
    try {
      const json = (await req.json()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string") {
          params[key] = value;
        }
      }
    } catch {
      // Ignored: empty or non-JSON body
    }
  }

  return params;
}

/**
 * OAuth 2.1 Token Exchange endpoint.
 * Handles authorization_code (with PKCE S256 verification) and refresh_token grants.
 *
 * @param req - Inbound token POST request.
 * @returns JSON response containing access_token, refresh_token, and id_token.
 */
export async function POST(req: Request): Promise<Response> {
  const params = await parseTokenRequest(req);
  const grantType = params.grant_type;
  const siteUrl = getSiteUrl(req);

  if (!grantType) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing grant_type parameter",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (grantType === "authorization_code") {
    const code = params.code;
    const redirectUri = params.redirect_uri;
    const codeVerifier = params.code_verifier;

    if (!code) {
      return Response.json(
        {
          error: "invalid_request",
          error_description: "Missing code parameter",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const authCodePayload = verifyAuthorizationCode(code);
    if (!authCodePayload) {
      return Response.json(
        {
          error: "invalid_grant",
          error_description: "Invalid or expired authorization code",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (redirectUri && authCodePayload.redirectUri !== redirectUri) {
      return Response.json(
        {
          error: "invalid_grant",
          error_description: "Redirect URI mismatch",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (authCodePayload.codeChallenge) {
      if (
        !codeVerifier ||
        !verifyPkce(
          codeVerifier,
          authCodePayload.codeChallenge,
          authCodePayload.codeChallengeMethod,
        )
      ) {
        return Response.json(
          {
            error: "invalid_grant",
            error_description: "Code verifier does not match challenge",
          },
          { status: 400, headers: CORS_HEADERS },
        );
      }
    }

    const tokenPair = createTokenPair(
      authCodePayload.userId,
      authCodePayload.clientId,
      authCodePayload.scope,
      authCodePayload.sessionId,
      siteUrl,
    );

    return Response.json(tokenPair, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = params.refresh_token;
    if (!refreshToken) {
      return Response.json(
        {
          error: "invalid_request",
          error_description: "Missing refresh_token parameter",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const tokenPair = refreshTokens(refreshToken, siteUrl);
    if (!tokenPair) {
      return Response.json(
        {
          error: "invalid_grant",
          error_description: "Invalid or expired refresh token",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    return Response.json(tokenPair, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  }

  return Response.json(
    {
      error: "unsupported_grant_type",
      error_description: `Grant type '${grantType}' is unsupported`,
    },
    { status: 400, headers: CORS_HEADERS },
  );
}
