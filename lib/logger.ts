import {
  configureSync,
  getAnsiColorFormatter,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  type LogLevel,
} from "@logtape/logtape";
import { serverEnv } from "./env";

let initialized = false;

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/**
 * ANSI console formatter with aligned columns, consistent spacing, and subtle delimiters.
 * Formats timestamps as HH:mm:ss.SSS, levels padded to 7 chars, categories padded to 24 chars,
 * and separates telemetry metadata from the message using a dimmed vertical bar.
 *
 * @see https://logtape.org/manual/formatting
 * @author Maruf Bepary
 */
export const consoleFormatter = getAnsiColorFormatter({
  timestamp: "time",
  level: "FULL",
  categoryStyle: "dim",
  timestampStyle: "dim",
  format({ timestamp, level, category, message, record }) {
    // 1. Join category parts with a middle dot and pad to 24 characters
    const rawCategory = record.category.join("·");
    const padLength = Math.max(0, 24 - rawCategory.length);
    const paddedCategory = category + " ".repeat(padLength);

    // 2. Pad level string to 7 characters (longest is "WARNING")
    // Use record.level (unformatted string) to calculate padding, ignoring ANSI escape sequences
    const levelStr = record.level.toUpperCase();
    const levelPad = " ".repeat(Math.max(0, 7 - levelStr.length));

    // 3. Assemble aligned row
    return `${timestamp}  ${level}${levelPad}  ${paddedCategory}  ${DIM}│${RESET}  ${message}`;
  },
});

/**
 * Determines whether the current execution context is within an automated test runner.
 *
 * @returns True when running under Vitest or when NODE_ENV is set to "test".
 */
export function isTestEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST))
  );
}

/**
 * Synchronously configures the LogTape logging system with an environment-aware console sink.
 * Uses non-blocking asynchronous buffering in production/runtime and synchronous output in test runners.
 * Silences internal LogTape meta diagnostics while setting the root application log level from environment variables.
 *
 * @see https://logtape.org/manual/configuration
 * @author Maruf Bepary
 */
export function configureLoggingSync(): void {
  if (initialized) {
    return;
  }

  const isTest = isTestEnvironment();

  try {
    configureSync({
      sinks: {
        console: getConsoleSink({
          formatter: consoleFormatter,
          // Non-blocking in runtime to never stall requests; synchronous in tests to avoid runner teardown races
          nonBlocking: !isTest,
        }),
      },
      loggers: [
        // Silence LogTape internal meta logger diagnostic notice
        {
          category: ["logtape", "meta"],
          lowestLevel: "warning",
          sinks: ["console"],
        },
        // Root application logger
        {
          category: ["app"],
          lowestLevel: serverEnv.LOG_LEVEL as LogLevel,
          sinks: ["console"],
        },
      ],
    });
    initialized = true;
  } catch {
    initialized = true;
  }
}

/**
 * Asynchronous entry point for application startup and instrumentation hooks.
 *
 * @returns Promise that resolves once logging configuration completes.
 * @see configureLoggingSync
 * @author Maruf Bepary
 */
export async function configureLogging(): Promise<void> {
  configureLoggingSync();
}

/**
 * Resets the initialized state of the logger module.
 * Primarily used in test suites to clear configuration state across tests.
 *
 * @author Maruf Bepary
 */
export function resetLoggingState(): void {
  initialized = false;
}

/**
 * Checks whether the logger module has already been initialized.
 *
 * @returns True if configured, false otherwise.
 * @author Maruf Bepary
 */
export function isLoggingInitialized(): boolean {
  return initialized;
}

/**
 * Retrieves a scoped LogTape logger instance, guaranteeing the logging system is configured.
 *
 * @param args Logger category parameters or categories array.
 * @returns Configured LogTape logger instance.
 * @see https://logtape.org/manual/categories
 * @author Maruf Bepary
 */
export function getLogger(
  ...args: Parameters<typeof getLogTapeLogger>
): ReturnType<typeof getLogTapeLogger> {
  if (!initialized) {
    configureLoggingSync();
  }
  return getLogTapeLogger(...args);
}
