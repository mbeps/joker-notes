import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clientEnv,
  clientEnvSchema,
  env,
  getServerEnv,
  resetServerEnvCache,
  serverEnv,
  serverEnvSchema,
  validateClientEnv,
  validateEnv,
  validateServerEnv,
} from "@/config/env";

describe("env configuration", () => {
  afterEach(() => {
    resetServerEnvCache();
    vi.restoreAllMocks();
  });

  describe("exported singletons and aliases", () => {
    it("provides validated clientEnv singleton", () => {
      expect(clientEnv).toBeDefined();
      expect(typeof clientEnv.NEXT_PUBLIC_CONVEX_URL).toBe("string");
      expect(typeof clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("string");
    });

    it("provides serverEnv proxy returning server configuration", () => {
      expect(serverEnv).toBeDefined();
      expect(typeof serverEnv.CLERK_SECRET_KEY).toBe("string");
      expect(typeof serverEnv.EDGE_STORE_ACCESS_KEY).toBe("string");
      expect(typeof serverEnv.EDGE_STORE_SECRET_KEY).toBe("string");
      expect(typeof serverEnv.NEXT_PUBLIC_CONVEX_URL).toBe("string");
    });

    it("aliases env to serverEnv", () => {
      expect(env.CLERK_SECRET_KEY).toBe(serverEnv.CLERK_SECRET_KEY);
    });
  });

  describe("clientEnvSchema", () => {
    it("validates well-formed client configuration", () => {
      const validClient = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      };
      const result = clientEnvSchema.safeParse(validClient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_CONVEX_URL).toBe(
          "https://example.convex.cloud",
        );
        expect(result.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe(
          "pk_test_123",
        );
      }
    });

    it("rejects invalid URL for Convex URL", () => {
      const invalidClient = {
        NEXT_PUBLIC_CONVEX_URL: "invalid-url",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      };
      const result = clientEnvSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("rejects empty Clerk publishable key", () => {
      const invalidClient = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      };
      const result = clientEnvSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });
  });

  describe("serverEnvSchema", () => {
    it("validates well-formed server configuration with optional deployment", () => {
      const validServer = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
        CONVEX_DEPLOYMENT: "dev:hearty-grasshopper-879",
        NODE_ENV: "production" as const,
      };
      const result = serverEnvSchema.safeParse(validServer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CONVEX_DEPLOYMENT).toBe("dev:hearty-grasshopper-879");
        expect(result.data.NODE_ENV).toBe("production");
      }
    });

    it("defaults NODE_ENV to development when unspecified", () => {
      const serverConfig = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
      };
      const result = serverEnvSchema.safeParse(serverConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe("development");
        expect(result.data.LOG_LEVEL).toBe("info");
        expect(result.data.CONVEX_DEPLOYMENT).toBeUndefined();
      }
    });

    it("transforms warn to warning for LOG_LEVEL", () => {
      const serverConfig = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
        LOG_LEVEL: "warn",
      };
      const result = serverEnvSchema.safeParse(serverConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.LOG_LEVEL).toBe("warning");
      }
    });

    it("accepts valid explicit LOG_LEVEL values", () => {
      const levels = ["debug", "info", "warning", "error", "fatal"] as const;
      for (const level of levels) {
        const result = serverEnvSchema.safeParse({
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
          CLERK_SECRET_KEY: "sk_test_123",
          EDGE_STORE_ACCESS_KEY: "access_key_123",
          EDGE_STORE_SECRET_KEY: "secret_key_123",
          LOG_LEVEL: level,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.LOG_LEVEL).toBe(level);
        }
      }
    });

    it("rejects invalid LOG_LEVEL values", () => {
      const result = serverEnvSchema.safeParse({
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
        LOG_LEVEL: "verbose",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing server secrets", () => {
      const missingSecrets = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      };
      const result = serverEnvSchema.safeParse(missingSecrets);
      expect(result.success).toBe(false);
    });

    it("rejects invalid NODE_ENV values", () => {
      const invalidEnv = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
        NODE_ENV: "staging",
      };
      const result = serverEnvSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
    });
  });

  describe("validateEnv", () => {
    it("successfully validates server environment when isServerEnv is true", () => {
      const parsed = validateEnv(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
          CLERK_SECRET_KEY: "sk_test_123",
          EDGE_STORE_ACCESS_KEY: "access_key_123",
          EDGE_STORE_SECRET_KEY: "secret_key_123",
          NODE_ENV: "test",
        },
        true,
      );
      expect(parsed.CLERK_SECRET_KEY).toBe("sk_test_123");
      expect(parsed.EDGE_STORE_ACCESS_KEY).toBe("access_key_123");
      expect(parsed.EDGE_STORE_SECRET_KEY).toBe("secret_key_123");
      expect(parsed.NODE_ENV).toBe("test");
    });

    it("successfully validates client environment when isServerEnv is false", () => {
      const parsed = validateEnv(
        {
          NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        },
        false,
      );
      expect(parsed.NEXT_PUBLIC_CONVEX_URL).toBe("https://example.convex.cloud");
      expect(parsed.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_123");
    });

    it("can be called with no arguments when process.env variables are valid", () => {
      const parsed = validateEnv();
      expect(parsed).toBeDefined();
      expect(typeof parsed.NEXT_PUBLIC_CONVEX_URL).toBe("string");
    });

    it("throws and logs an error when server validation fails", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        validateEnv(
          {
            NEXT_PUBLIC_CONVEX_URL: "not-a-valid-url",
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
            CLERK_SECRET_KEY: "sk_test_123",
            EDGE_STORE_ACCESS_KEY: "access_key_123",
            EDGE_STORE_SECRET_KEY: "secret_key_123",
          },
          true,
        ),
      ).toThrow("Invalid server environment variables");

      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid server environment variables:",
        expect.any(Object),
      );
    });

    it("throws and logs an error when client validation fails", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        validateEnv(
          {
            NEXT_PUBLIC_CONVEX_URL: "not-a-valid-url",
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
          },
          false,
        ),
      ).toThrow("Invalid client environment variables");

      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid client environment variables:",
        expect.any(Object),
      );
    });

    it("bypasses validation when SKIP_ENV_VALIDATION is 'true'", () => {
      const prev = process.env.SKIP_ENV_VALIDATION;
      try {
        process.env.SKIP_ENV_VALIDATION = "true";
        const dummyEnv = { INVALID_VAR: 123 };
        const parsed = validateEnv(dummyEnv);
        expect(parsed).toBe(dummyEnv);
      } finally {
        if (prev === undefined) {
          delete process.env.SKIP_ENV_VALIDATION;
        } else {
          process.env.SKIP_ENV_VALIDATION = prev;
        }
      }
    });

    it("bypasses validation when SKIP_ENV_VALIDATION is '1'", () => {
      const prev = process.env.SKIP_ENV_VALIDATION;
      try {
        process.env.SKIP_ENV_VALIDATION = "1";
        const dummyEnv = { INVALID_VAR: 456 };
        const parsed = validateEnv(dummyEnv);
        expect(parsed).toBe(dummyEnv);
      } finally {
        if (prev === undefined) {
          delete process.env.SKIP_ENV_VALIDATION;
        } else {
          process.env.SKIP_ENV_VALIDATION = prev;
        }
      }
    });
  });

  describe("validateClientEnv", () => {
    it("successfully parses valid client environment", () => {
      const parsed = validateClientEnv({
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      });
      expect(parsed.NEXT_PUBLIC_CONVEX_URL).toBe("https://example.convex.cloud");
      expect(parsed.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_123");
    });

    it("can be called with no arguments when process.env variables are valid", () => {
      const parsed = validateClientEnv();
      expect(parsed).toBeDefined();
      expect(typeof parsed.NEXT_PUBLIC_CONVEX_URL).toBe("string");
    });
  });

  describe("validateServerEnv", () => {
    it("successfully parses valid server environment", () => {
      const parsed = validateServerEnv({
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        EDGE_STORE_ACCESS_KEY: "access_key_123",
        EDGE_STORE_SECRET_KEY: "secret_key_123",
        NODE_ENV: "test",
      });
      expect(parsed.CLERK_SECRET_KEY).toBe("sk_test_123");
      expect(parsed.EDGE_STORE_ACCESS_KEY).toBe("access_key_123");
      expect(parsed.EDGE_STORE_SECRET_KEY).toBe("secret_key_123");
      expect(parsed.NODE_ENV).toBe("test");
    });

    it("can be called with no arguments when process.env variables are valid", () => {
      const parsed = validateServerEnv();
      expect(parsed).toBeDefined();
      expect(typeof parsed.NEXT_PUBLIC_CONVEX_URL).toBe("string");
      expect(typeof parsed.CLERK_SECRET_KEY).toBe("string");
    });
  });

  describe("getServerEnv and caching", () => {
    it("returns cached environment on repeated calls", () => {
      resetServerEnvCache();
      const first = getServerEnv();
      const second = getServerEnv();
      expect(first).toBe(second);
    });

    it("resets cache when resetServerEnvCache is called", () => {
      resetServerEnvCache();
      const first = getServerEnv();
      resetServerEnvCache();
      const second = getServerEnv();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });
});

