/**
 * Next.js server lifecycle hook that runs on application startup.
 * Configures the LogTape logging infrastructure when executing in the Node.js server runtime.
 *
 * @returns Promise that resolves once server-side instrumentation completes.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @author Maruf Bepary
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { configureLoggingSync } = await import("@/lib/logger");
    configureLoggingSync();
  }
}
