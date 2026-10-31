import { createClerkClient } from "@clerk/nextjs/server";
import { serverEnv } from "@/config/env";

export const dynamic = "force-dynamic";

/**
 * Resolves a batch of Clerk user IDs to their primary email addresses.
 * Restricted to the admin dashboard to display human-readable authors.
 *
 * @param req - Inbound POST request with a `userIds` array in the JSON body.
 * @returns JSON map of userId to email, falling back to the ID when no email exists.
 */
export async function POST(req: Request): Promise<Response> {
  let body: { userIds?: unknown };
  try {
    body = (await req.json()) as { userIds?: unknown };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
    return Response.json({}, { status: 200 });
  }

  const client = createClerkClient({ secretKey: serverEnv.CLERK_SECRET_KEY });
  const users = await client.users.getUserList({ userId: body.userIds });

  const emailMap = Object.fromEntries(
    users.data.map((user) => [
      user.id,
      user.emailAddresses[0]?.emailAddress ?? user.id,
    ]),
  );

  return Response.json(emailMap);
}
