import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type AuthUser,
  type DocumentResource,
  canAccessAdminPanel,
  canViewAllDocuments,
  createAuthUser,
  getRawAdminEnv,
  hasPermission,
  isAdminUserId,
  normalizeIdentifier,
  parseAdminUserIds,
} from "@/lib/access-control";

describe("access-control PDP", () => {
  const originalAdminUserId = process.env.ADMIN_USER_ID;
  const originalNextPublicAdmin = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  beforeEach(() => {
    delete process.env.ADMIN_USER_ID;
    delete process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  });

  afterEach(() => {
    if (originalAdminUserId !== undefined) {
      process.env.ADMIN_USER_ID = originalAdminUserId;
    } else {
      delete process.env.ADMIN_USER_ID;
    }

    if (originalNextPublicAdmin !== undefined) {
      process.env.NEXT_PUBLIC_ADMIN_USER_ID = originalNextPublicAdmin;
    } else {
      delete process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    }
  });

  describe("normalizeIdentifier", () => {
    it("trims whitespace", () => {
      expect(normalizeIdentifier("  user_123  ")).toBe("user_123");
    });

    it("strips double quotes", () => {
      expect(normalizeIdentifier('"user_123"')).toBe("user_123");
    });

    it("strips single quotes", () => {
      expect(normalizeIdentifier("'user_123'")).toBe("user_123");
    });

    it("handles empty and whitespace-only strings", () => {
      expect(normalizeIdentifier("")).toBe("");
      expect(normalizeIdentifier("   ")).toBe("");
    });

    it("normalizes standard UUIDs to lowercase", () => {
      const upperUuid = "123E4567-E89B-12D3-A456-426614174000";
      expect(normalizeIdentifier(upperUuid)).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("preserves case for Clerk-style identifiers", () => {
      const clerkId = "user_2bAbCdEfGhIjKlMnOp";
      expect(normalizeIdentifier(clerkId)).toBe(clerkId);
    });

    it("strips OIDC issuer prefix before pipe separator", () => {
      const tokenIdentifier =
        "https://grateful-glowworm-20.clerk.accounts.dev|user_2a2rHQyPbL5a42JAU0V8m7sfynT";
      expect(normalizeIdentifier(tokenIdentifier)).toBe(
        "user_2a2rHQyPbL5a42JAU0V8m7sfynT",
      );
      expect(normalizeIdentifier("issuer|")).toBe("");
    });
  });

  describe("parseAdminUserIds", () => {
    it("returns an empty set for undefined or empty string", () => {
      expect(parseAdminUserIds(undefined).size).toBe(0);
      expect(parseAdminUserIds("").size).toBe(0);
      expect(parseAdminUserIds("   ").size).toBe(0);
    });

    it("parses single identifier", () => {
      const set = parseAdminUserIds("user_admin1");
      expect(set.has("user_admin1")).toBe(true);
      expect(set.size).toBe(1);
    });

    it("parses comma-separated identifiers with whitespace, quotes, and empty entries", () => {
      const set = parseAdminUserIds(
        ' "user_admin1" ,  , \'123E4567-E89B-12D3-A456-426614174000\' ,  ',
      );
      expect(set.size).toBe(2);
      expect(set.has("user_admin1")).toBe(true);
      expect(set.has("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });
  });

  describe("getRawAdminEnv", () => {
    it("returns undefined when no admin environment variable is set", () => {
      expect(getRawAdminEnv()).toBeUndefined();
    });

    it("reads ADMIN_USER_ID when present", () => {
      process.env.ADMIN_USER_ID = "user_srv_admin";
      expect(getRawAdminEnv()).toBe("user_srv_admin");
    });

    it("falls back to NEXT_PUBLIC_ADMIN_USER_ID when ADMIN_USER_ID is missing", () => {
      process.env.NEXT_PUBLIC_ADMIN_USER_ID = "user_client_admin";
      expect(getRawAdminEnv()).toBe("user_client_admin");
    });

    it("prioritises ADMIN_USER_ID over NEXT_PUBLIC_ADMIN_USER_ID", () => {
      process.env.ADMIN_USER_ID = "user_srv_admin";
      process.env.NEXT_PUBLIC_ADMIN_USER_ID = "user_client_admin";
      expect(getRawAdminEnv()).toBe("user_srv_admin");
    });
  });

  describe("isAdminUserId", () => {
    it("returns false for falsy or empty user ID", () => {
      expect(isAdminUserId("")).toBe(false);
    });

    it("returns true when user ID is in provided raw env string", () => {
      expect(isAdminUserId("user_admin", "user_admin, user_other")).toBe(true);
    });

    it("returns false when user ID is not in provided raw env string", () => {
      expect(isAdminUserId("user_regular", "user_admin, user_other")).toBe(false);
    });

    it("reads from environment when rawAdminEnv parameter is omitted", () => {
      process.env.ADMIN_USER_ID = "user_env_admin";
      expect(isAdminUserId("user_env_admin")).toBe(true);
      expect(isAdminUserId("user_other")).toBe(false);
    });

    it("matches OIDC pipe-prefixed tokenIdentifier against raw Clerk subject ID", () => {
      expect(
        isAdminUserId(
          "https://grateful-glowworm-20.clerk.accounts.dev|user_2a2rHQyPbL5a42JAU0V8m7sfynT",
          "user_2a2rHQyPbL5a42JAU0V8m7sfynT",
        ),
      ).toBe(true);
    });
  });

  describe("createAuthUser", () => {
    it("creates an admin AuthUser when user matches admin list", () => {
      const user = createAuthUser("  \"user_admin\" ", "user_admin");
      expect(user.id).toBe("user_admin");
      expect(user.roles).toEqual(["admin"]);
    });

    it("creates a standard user AuthUser when user does not match admin list", () => {
      const user = createAuthUser("user_regular", "user_admin");
      expect(user.id).toBe("user_regular");
      expect(user.roles).toEqual(["user"]);
    });
  });

  describe("hasPermission", () => {
    const adminUser: AuthUser = { id: "admin_1", roles: ["admin"] };
    const authorUser: AuthUser = { id: "author_1", roles: ["user"] };
    const foreignUser: AuthUser = { id: "foreign_1", roles: ["user"] };
    const ownDoc: DocumentResource = { userId: "author_1" };
    const otherDoc: DocumentResource = { userId: "other_author" };

    describe("admin role", () => {
      it("grants all document actions to admin with or without document data", () => {
        expect(hasPermission(adminUser, "documents", "view")).toBe(true);
        expect(hasPermission(adminUser, "documents", "view", ownDoc)).toBe(true);
        expect(hasPermission(adminUser, "documents", "view", otherDoc)).toBe(true);
        expect(hasPermission(adminUser, "documents", "create")).toBe(true);
        expect(hasPermission(adminUser, "documents", "update", otherDoc)).toBe(true);
        expect(hasPermission(adminUser, "documents", "delete", otherDoc)).toBe(true);
      });

      it("grants admin_panel view to admin", () => {
        expect(hasPermission(adminUser, "admin_panel", "view")).toBe(true);
      });
    });

    describe("user role", () => {
      it("allows user to create documents", () => {
        expect(hasPermission(authorUser, "documents", "create")).toBe(true);
      });

      it("denies user from viewing all documents when no document data is passed", () => {
        expect(hasPermission(authorUser, "documents", "view")).toBe(false);
      });

      it("allows user to view, update, and delete their own document", () => {
        expect(hasPermission(authorUser, "documents", "view", ownDoc)).toBe(true);
        expect(hasPermission(authorUser, "documents", "update", ownDoc)).toBe(true);
        expect(hasPermission(authorUser, "documents", "delete", ownDoc)).toBe(true);
      });

      it("denies user from viewing, updating, or deleting other users' documents", () => {
        expect(hasPermission(authorUser, "documents", "view", otherDoc)).toBe(false);
        expect(hasPermission(authorUser, "documents", "update", otherDoc)).toBe(false);
        expect(hasPermission(authorUser, "documents", "delete", otherDoc)).toBe(false);
      });

      it("denies user access to admin_panel", () => {
        expect(hasPermission(authorUser, "admin_panel", "view")).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("returns false for unknown roles", () => {
        const unknownUser = { id: "u1", roles: ["unknown_role" as any] };
        expect(hasPermission(unknownUser, "documents", "view")).toBe(false);
      });
    });
  });

  describe("convenience helpers", () => {
    it("canViewAllDocuments returns true for admin and false for user", () => {
      const adminUser: AuthUser = { id: "admin_1", roles: ["admin"] };
      const user: AuthUser = { id: "user_1", roles: ["user"] };

      expect(canViewAllDocuments(adminUser)).toBe(true);
      expect(canViewAllDocuments(user)).toBe(false);
    });

    it("canAccessAdminPanel returns true for admin and false for user", () => {
      const adminUser: AuthUser = { id: "admin_1", roles: ["admin"] };
      const user: AuthUser = { id: "user_1", roles: ["user"] };

      expect(canAccessAdminPanel(adminUser)).toBe(true);
      expect(canAccessAdminPanel(user)).toBe(false);
    });
  });
});

