import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * OAuth 2.1 Authorization Endpoint.
 * Validates request parameters and redirects to the user consent screen.
 *
 * @param req - Inbound GET authorization request.
 * @returns Redirect response to /oauth/consent or error.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const state = url.searchParams.get("state") || "";

  if (!redirectUri) {
    return new Response("Missing redirect_uri parameter", { status: 400 });
  }

  if (responseType !== "code") {
    const errorUrl = new URL(redirectUri);
    errorUrl.searchParams.set("error", "unsupported_response_type");
    if (state) {
      errorUrl.searchParams.set("state", state);
    }
    return NextResponse.redirect(errorUrl.toString());
  }

  const consentUrl = new URL("/oauth/consent", url.origin);
  for (const [key, value] of url.searchParams.entries()) {
    consentUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(consentUrl.toString());
}
