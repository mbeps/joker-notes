import { auth } from "@clerk/nextjs/server";
import { createAuthorizationCode } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

/**
 * Handles consent submission from the OAuth consent UI.
 * Validates Clerk user session and mints the authorization code.
 *
 * @param req - Inbound consent decision POST request.
 * @returns JSON response with redirection URL.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId, sessionId } = await auth();

  if (!userId) {
    return Response.json(
      {
        error: "unauthorized",
        error_description: "User is not authenticated",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      decision: "allow" | "deny";
      client_id: string;
      redirect_uri: string;
      scope?: string;
      state?: string;
      code_challenge?: string;
      code_challenge_method?: "S256" | "plain";
    };

    const {
      decision,
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    } = body;

    if (!redirect_uri) {
      return Response.json(
        {
          error: "invalid_request",
          error_description: "Missing redirect_uri",
        },
        { status: 400 },
      );
    }

    const redirectUrl = new URL(redirect_uri);

    if (decision === "deny") {
      redirectUrl.searchParams.set("error", "access_denied");
      redirectUrl.searchParams.set(
        "error_description",
        "The user denied the authorization request",
      );
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }
      return Response.json({ redirect_url: redirectUrl.toString() });
    }

    const code = createAuthorizationCode({
      userId,
      clientId: client_id || "default",
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      scope: scope || "openid profile email offline_access",
      sessionId: sessionId ?? undefined,
    });

    redirectUrl.searchParams.set("code", code);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }

    return Response.json({ redirect_url: redirectUrl.toString() });
  } catch {
    return Response.json(
      {
        error: "server_error",
        error_description: "Failed to process consent decision",
      },
      { status: 500 },
    );
  }
}
