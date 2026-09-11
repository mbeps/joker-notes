import {
  type LogRecord,
  configureSync,
  getLogger as getLogTapeLogger,
} from "@logtape/logtape";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  configureLogging,
  configureLoggingSync,
  consoleFormatter,
  getLogger,
  isLoggingInitialized,
  isTestEnvironment,
  resetLoggingState,
} from "../../lib/logger";

vi.mock("@logtape/logtape", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@logtape/logtape")>();
  return {
    ...actual,
    configureSync: vi.fn(actual.configureSync),
  };
});

describe("logger module", () => {
  beforeEach(() => {
    resetLoggingState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetLoggingState();
    vi.restoreAllMocks();
  });

  describe("consoleFormatter", () => {
    it("formats log record with padding for short category and level", () => {
      const record: LogRecord = {
        category: ["app", "auth"],
        level: "info",
        message: ["User signed in"],
        timestamp: 1700000000000,
        rawMessage: "User signed in",
        properties: {},
      };

      const formatted = consoleFormatter(record);
      // level should be padded to 7 chars ("INFO   "), category padded to 24 chars
      expect(formatted).toContain("app·auth");
      expect(formatted).toContain("│");
      expect(formatted).toContain("User signed in");
    });

    it("formats log record when category exceeds 24 characters", () => {
      const record: LogRecord = {
        category: ["app", "very", "long", "nested", "domain", "category", "here"],
        level: "warning",
        message: ["Quota near limit"],
        timestamp: 1700000000000,
        rawMessage: "Quota near limit",
        properties: {},
      };

      const formatted = consoleFormatter(record);
      expect(formatted).toContain("WARNING");
      expect(formatted).toContain(
        "app·very·long·nested·domain·category·here",
      );
      expect(formatted).toContain("Quota near limit");
    });

    it("formats warning level without extra padding (7 chars)", () => {
      const record: LogRecord = {
        category: ["app"],
        level: "warning",
        message: ["Warning alert"],
        timestamp: 1700000000000,
        rawMessage: "Warning alert",
        properties: {},
      };

      const formatted = consoleFormatter(record);
      expect(formatted).toContain("WARNING");
      expect(formatted).toContain("Warning alert");
    });
  });

  describe("isTestEnvironment", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns true when NODE_ENV is test", () => {
      process.env.NODE_ENV = "test";
      delete process.env.VITEST;
      expect(isTestEnvironment()).toBe(true);
    });

    it("returns true when VITEST is defined even if NODE_ENV is not test", () => {
      process.env.NODE_ENV = "production";
      process.env.VITEST = "true";
      expect(isTestEnvironment()).toBe(true);
    });

    it("returns false when neither test environment flag is present", () => {
      process.env.NODE_ENV = "production";
      delete process.env.VITEST;
      expect(isTestEnvironment()).toBe(false);
    });
  });

  describe("configureLoggingSync and configureLogging", () => {
    it("configures logging on first invocation and sets initialized to true", () => {
      expect(isLoggingInitialized()).toBe(false);
      configureLoggingSync();
      expect(isLoggingInitialized()).toBe(true);
      expect(configureSync).toHaveBeenCalledTimes(1);
    });

    it("is idempotent on repeated calls without re-running configureSync", () => {
      configureLoggingSync();
      expect(configureSync).toHaveBeenCalledTimes(1);

      configureLoggingSync();
      expect(configureSync).toHaveBeenCalledTimes(1);
    });

    it("async configureLogging delegates to configureLoggingSync", async () => {
      await configureLogging();
      expect(isLoggingInitialized()).toBe(true);
      expect(configureSync).toHaveBeenCalledTimes(1);
    });

    it("handles configuration errors gracefully and still marks initialized", () => {
      vi.mocked(configureSync).mockImplementationOnce(() => {
        throw new Error("Configuration failed");
      });

      expect(() => configureLoggingSync()).not.toThrow();
      expect(isLoggingInitialized()).toBe(true);
    });

    it("configures non-blocking sink when not in test environment", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalVitest = process.env.VITEST;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.VITEST;

        configureLoggingSync();
        expect(isLoggingInitialized()).toBe(true);
        expect(configureSync).toHaveBeenCalledWith(
          expect.objectContaining({
            sinks: expect.objectContaining({
              console: expect.any(Function),
            }),
          }),
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        if (originalVitest !== undefined) {
          process.env.VITEST = originalVitest;
        }
      }
    });
  });

  describe("getLogger", () => {
    it("automatically initializes logging if called before configureLoggingSync", () => {
      expect(isLoggingInitialized()).toBe(false);
      const log = getLogger(["app", "test"]);
      expect(isLoggingInitialized()).toBe(true);
      expect(log).toBeDefined();
    });

    it("retrieves logger without re-initialization if already configured", () => {
      configureLoggingSync();
      expect(configureSync).toHaveBeenCalledTimes(1);

      const log = getLogger(["app", "actions"]);
      expect(log).toBeDefined();
      expect(configureSync).toHaveBeenCalledTimes(1);
    });
  });
});

