/**
 * Centralised Attribute-Based Access Control (ABAC) module for Joker Notes.
 * Defines declarative roles, permissions, and evaluation logic shared across
 * Next.js server/client boundaries and Convex backend functions.
 *
 * @see https://en.wikipedia.org/wiki/Attribute-based_access_control
 * @author Maruf Bepary
 */

/**
 * Standard user role classifications in the application.
 */
export type Role = "admin" | "user";

/**
 * Represents an authenticated user context passed to permission checks.
 */
export interface AuthUser {
  /** The unique user identifier (e.g. Clerk subject ID). */
  readonly id: string;
  /** Roles assigned to this authenticated user. */
  readonly roles: readonly Role[];
}

/**
 * Minimal resource payload needed to evaluate document permissions.
 */
export interface DocumentResource {
  /** Owner author identifier of the document. */
  readonly userId: string;
}

/**
 * Declarative mapping of protected resources and their permitted operations.
 */
export type ResourcePermissionMap = {
  documents: {
    dataType: DocumentResource;
    action: "view" | "create" | "update" | "delete";
  };
  admin_panel: {
    dataType: undefined;
    action: "view";
  };
};

/**
 * Evaluator rule: either a static boolean grant or a contextual evaluation predicate.
 */
type RuleEvaluator<TData> =
  | boolean
  | ((user: AuthUser, data: TData) => boolean);

/**
 * Role permissions definition structured by resource and action.
 */
export type RolePermissions = {
  [R in keyof ResourcePermissionMap]: {
    [A in ResourcePermissionMap[R]["action"]]: RuleEvaluator<
      ResourcePermissionMap[R]["dataType"]
    >;
  };
};

/**
 * Static ABAC permission matrix defining capabilities per role.
 */
export const ROLES: Record<Role, RolePermissions> = {
  admin: {
    documents: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    admin_panel: {
      view: true,
    },
  },
  user: {
    documents: {
      view: (user, doc) => doc.userId === user.id,
      create: true,
      update: (user, doc) => doc.userId === user.id,
      delete: (user, doc) => doc.userId === user.id,
    },
    admin_panel: {
      view: false,
    },
  },
};

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Normalises an identifier by trimming whitespace, stripping surrounding quotes,
 * extracting the subject segment after any OIDC pipe (`|`) separator,
 * lowercasing standard UUIDs, and preserving case for Clerk-style IDs (`user_*`).
 *
 * @param id - Raw identifier string from environment or auth token.
 * @returns Cleaned and normalised identifier.
 * @see parseAdminUserIds
 */
export function normalizeIdentifier(id: string): string {
  let clean = id.trim();

  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }

  if (clean.includes("|")) {
    clean = clean.slice(clean.lastIndexOf("|") + 1).trim();
  }

  if (clean.length === 0) {
    return "";
  }

  if (UUID_REGEX.test(clean)) {
    return clean.toLowerCase();
  }

  return clean;
}

/**
 * Parses comma-separated admin user IDs into a deduplicated Set of normalised identifiers.
 *
 * @param raw - Comma-separated admin ID string from environment variables.
 * @returns Set containing normalised admin user identifiers.
 * @see normalizeIdentifier
 */
export function parseAdminUserIds(raw?: string): ReadonlySet<string> {
  const result = new Set<string>();

  if (!raw?.trim()) {
    return result;
  }

  const segments = raw.split(",");
  for (const segment of segments) {
    const normalised = normalizeIdentifier(segment);
    if (normalised.length > 0) {
      result.add(normalised);
    }
  }

  return result;
}

/**
 * Safely extracts raw admin configuration from process environment variables.
 * Prioritises server-side `ADMIN_USER_ID` over browser-exposed `NEXT_PUBLIC_ADMIN_USER_ID`.
 *
 * @returns Raw admin configuration string, or undefined if not set.
 * @see parseAdminUserIds
 */
export function getRawAdminEnv(): string | undefined {
  return process.env.ADMIN_USER_ID ?? process.env.NEXT_PUBLIC_ADMIN_USER_ID;
}

/**
 * Determines whether a given user ID possesses administrator privileges.
 *
 * @param userId - User identifier to test against admin configuration.
 * @param rawAdminEnv - Optional raw admin string; defaults to environment lookup.
 * @returns True if the user is recognised as a global admin, false otherwise.
 * @see parseAdminUserIds
 */
export function isAdminUserId(userId: string, rawAdminEnv?: string): boolean {
  if (!userId) {
    return false;
  }

  const raw = rawAdminEnv ?? getRawAdminEnv();
  const adminSet = parseAdminUserIds(raw);
  return adminSet.has(normalizeIdentifier(userId));
}

/**
 * Factory creating an {@link AuthUser} model with roles evaluated against admin configuration.
 *
 * @param userId - Unique user identifier (e.g. Clerk subject).
 * @param rawAdminEnv - Optional raw admin configuration override.
 * @returns Fully constructed user context with assigned roles.
 * @see isAdminUserId
 */
export function createAuthUser(userId: string, rawAdminEnv?: string): AuthUser {
  const normalisedId = normalizeIdentifier(userId);
  const isAdmin = isAdminUserId(normalisedId, rawAdminEnv);

  return {
    id: normalisedId,
    roles: isAdmin ? (["admin"] as const) : (["user"] as const),
  };
}

/**
 * Centralised Policy Decision Point (PDP) checking whether a user may perform an action on a resource.
 *
 * @template R - Resource type identifier.
 * @param user - Authenticated user context.
 * @param resource - Target resource key.
 * @param action - Action to perform on the resource.
 * @param data - Contextual resource data required for attribute-level policy evaluation.
 * @returns True if any assigned role permits the operation, false otherwise.
 * @see ROLES
 */
export function hasPermission<R extends keyof ResourcePermissionMap>(
  user: AuthUser,
  resource: R,
  action: ResourcePermissionMap[R]["action"],
  data?: ResourcePermissionMap[R]["dataType"],
): boolean {
  for (const role of user.roles) {
    const roleConfig = ROLES[role];
    if (!roleConfig) {
      continue;
    }

    const resourceConfig = roleConfig[resource];
    const rule = (
      resourceConfig as Record<
        string,
        RuleEvaluator<ResourcePermissionMap[R]["dataType"]>
      >
    )[action];

    if (rule === true) {
      return true;
    }

    if (typeof rule === "function" && data !== undefined && rule(user, data)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper checking if a user is permitted to view notes across all authors.
 *
 * @param user - Authenticated user context.
 * @returns True if global document view permission is granted, false otherwise.
 * @see hasPermission
 */
export function canViewAllDocuments(user: AuthUser): boolean {
  return hasPermission(user, "documents", "view");
}

/**
 * Helper checking if a user is permitted to access the admin panel.
 *
 * @param user - Authenticated user context.
 * @returns True if admin dashboard access is granted, false otherwise.
 * @see hasPermission
 */
export function canAccessAdminPanel(user: AuthUser): boolean {
  return hasPermission(user, "admin_panel", "view");
}
