import { describe, expect, it, vi } from "vitest";

import {
  clientEnvSchema,
  env,
  serverEnvSchema,
  validateEnv,
} from "../../lib/env";

describe("env configuration", () => {
  describe("exported env singleton", () => {
    it("provides validated environment variables", () => {
      expect(env).toBeDefined();
      expect(typeof env.NEXT_PUBLIC_CONVEX_URL).toBe("string");
      expect(typeof env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("string");
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
        expect(result.data.CONVEX_DEPLOYMENT).toBeUndefined();
      }
    });

    it("rejects missing server secrets", () => {
      const missingSecrets = {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      };
      const result = serverEnvSchema.safeParse(missingSecrets);
      expect(result.success).toBe(false);
    });
  });

  describe("validateEnv", () => {
    it("successfully parses valid client environment", () => {
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

    it("successfully parses valid server environment", () => {
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

    it("throws and logs an error when validation fails", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        validateEnv(
          {
            NEXT_PUBLIC_CONVEX_URL: "not-a-valid-url",
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
          },
          false,
        ),
      ).toThrow("Invalid environment variables");

      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid environment variables:",
        expect.any(Object),
      );

      errorSpy.mockRestore();
    });

    it("can be called with no arguments and succeeds when env variables are valid", () => {
      const parsed = validateEnv();
      expect(parsed).toBeDefined();
      expect(typeof parsed.NEXT_PUBLIC_CONVEX_URL).toBe("string");
    });
  });
});

