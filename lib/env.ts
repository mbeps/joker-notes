import { z } from "zod";

/**
 * Validation schema for client-accessible environment variables.
 * Enforces valid URLs and non-empty strings for browser-exposed configuration.
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 * @author Maruf Bepary
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Validation schema for server-only environment variables extending client variables.
 * Enforces presence of authentication secrets, storage credentials, and environment flags.
 *
 * @see clientEnvSchema
 * @author Maruf Bepary
 */
export const serverEnvSchema = clientEnvSchema.extend({
  CLERK_SECRET_KEY: z.string().min(1),
  EDGE_STORE_ACCESS_KEY: z.string().min(1),
  EDGE_STORE_SECRET_KEY: z.string().min(1),
  CONVEX_DEPLOYMENT: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "warning", "error", "fatal"])
    .default("info")
    .transform((val) => (val === "warn" ? "warning" : val)),
});

/**
 * Inferred type representing validated client-accessible environment variables.
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Inferred type representing validated server-only environment variables.
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Alias for {@link ServerEnv} to maintain backward compatibility.
 */
export type Env = ServerEnv;

/**
 * Validates browser-accessible environment variables against client schema.
 * Allows bypassing validation when `SKIP_ENV_VALIDATION` is set to "true" or "1".
 *
 * @param runtimeEnv - Environment variable dictionary (defaults to explicit client process.env entries)
 * @returns Fully validated and typed client environment configuration
 * @throws {Error} When client validation fails with details logged to console.error
 * @see clientEnvSchema
 * @author Maruf Bepary
 */
export function validateClientEnv(
  runtimeEnv: Record<string, unknown> = {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
): ClientEnv {
  if (
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.SKIP_ENV_VALIDATION === "1"
  ) {
    return runtimeEnv as ClientEnv;
  }

  const parsed = clientEnvSchema.safeParse(runtimeEnv);
  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:",
      parsed.error.format(),
    );
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

/**
 * Validates server-only environment variables against server schema.
 * Allows bypassing validation when `SKIP_ENV_VALIDATION` is set to "true" or "1".
 *
 * @param runtimeEnv - Environment variable dictionary (defaults to explicit server process.env entries)
 * @returns Fully validated and typed server environment configuration
 * @throws {Error} When server validation fails with details logged to console.error
 * @see serverEnvSchema
 * @author Maruf Bepary
 */
export function validateServerEnv(
  runtimeEnv: Record<string, unknown> = {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    EDGE_STORE_ACCESS_KEY: process.env.EDGE_STORE_ACCESS_KEY,
    EDGE_STORE_SECRET_KEY: process.env.EDGE_STORE_SECRET_KEY,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
): ServerEnv {
  if (
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.SKIP_ENV_VALIDATION === "1"
  ) {
    return runtimeEnv as ServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(runtimeEnv);
  if (!parsed.success) {
    console.error(
      "❌ Invalid server environment variables:",
      parsed.error.format(),
    );
    throw new Error("Invalid server environment variables");
  }
  return parsed.data as ServerEnv;
}

/**
 * Validated client environment singleton, safe for browser evaluation.
 *
 * @see validateClientEnv
 * @author Maruf Bepary
 */
export const clientEnv = validateClientEnv();

let cachedServerEnv: ServerEnv | null = null;

/**
 * Retrieves the cached server environment configuration, validating on first call.
 * Lazily evaluated to prevent premature server-side validation during client bundling.
 *
 * @returns Cached or newly validated server environment configuration
 * @throws {Error} When server environment variable validation fails
 * @see validateServerEnv
 * @author Maruf Bepary
 */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv();
  }
  return cachedServerEnv;
}

/**
 * Resets the cached server environment configuration.
 * Primarily used in test suites to clear memoised environment state across tests.
 *
 * @see getServerEnv
 * @author Maruf Bepary
 */
export function resetServerEnvCache(): void {
  cachedServerEnv = null;
}

/**
 * Lazy proxy accessing validated server environment variables on demand.
 * Prevents premature validation during module evaluation.
 *
 * @see getServerEnv
 * @author Maruf Bepary
 */
export const serverEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string | symbol) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});

/**
 * Backward-compatible alias for {@link serverEnv}.
 *
 * @see serverEnv
 * @author Maruf Bepary
 */
export const env = serverEnv;

/**
 * Backward-compatible alias for {@link validateServerEnv}.
 *
 * @see validateServerEnv
 * @author Maruf Bepary
 */
export const validateEnv = validateServerEnv;
