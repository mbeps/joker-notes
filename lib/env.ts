import { z } from "zod";

/**
 * Client-accessible environment variables.
 * Must be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Server-only environment variables extending client variables.
 * Includes authentication secrets, storage credentials, and environment flags.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  CLERK_SECRET_KEY: z.string().min(1),
  EDGE_STORE_ACCESS_KEY: z.string().min(1),
  EDGE_STORE_SECRET_KEY: z.string().min(1),
  CONVEX_DEPLOYMENT: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv;

/**
 * Validates environment variables according to the active runtime context.
 *
 * @param runtimeEnv Environment variable dictionary (defaults to explicit process.env entries)
 * @param isServerEnv Whether to run server-level schema checks (defaults to typeof window === "undefined")
 * @returns Fully validated and typed environment configuration
 * @throws Error when validation fails with details logged to console.error
 */
export function validateEnv(
  runtimeEnv: Record<string, unknown> = {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    EDGE_STORE_ACCESS_KEY: process.env.EDGE_STORE_ACCESS_KEY,
    EDGE_STORE_SECRET_KEY: process.env.EDGE_STORE_SECRET_KEY,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    NODE_ENV: process.env.NODE_ENV,
  },
  isServerEnv: boolean = typeof window === "undefined",
): Env {
  const schema = isServerEnv ? serverEnvSchema : clientEnvSchema;
  const parsed = schema.safeParse(runtimeEnv);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }

  return parsed.data as Env;
}

export const env = validateEnv();
