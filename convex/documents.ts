import { v } from "convex/values";
import {
  canAccessAdminPanel,
  canViewAllDocuments,
  createAuthUser,
  hasPermission,
} from "../lib/access-control";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Marks a document and its descendants as archived so they disappear from the active tree.
 * Only the owning user or a global administrator can invoke this mutation.
 *
 * @param {Id<"documents">} id Document identifier to archive.
 * @returns {Promise<Doc<"documents"> | undefined>} Updated document after archiving.
 * @see https://docs.convex.dev/functions/mutations
 */
export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can archive documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot delete a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot archive a document without permission
    if (!hasPermission(user, "documents", "delete", existingDocument)) {
      throw new Error("Unauthorized");
    }

    /**
     * Recursively archives all children documents.
     * Cascades using the document owner's userId to preserve hierarchy consistency.
     *
     * @param documentId Document ID to archive children for.
     */
    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("userId", existingDocument.userId)
            .eq("parentDocument", documentId),
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    recursiveArchive(args.id);

    return document;
  },
});

/**
 * Returns visible child documents for the authenticated user and optional parent.
 * Global administrators receive notes across all authors; normal users see only their own.
 *
 * @param {{ parentDocument?: Id<"documents"> }} args Query arguments containing an optional parent document id.
 * @returns {Promise<Doc<"documents">[]>} Active child documents sorted by creation date.
 * @see https://docs.convex.dev/database/queries
 */
export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    if (canViewAllDocuments(user)) {
      const documents = await ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("parentDocument"), args.parentDocument))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .order("desc")
        .collect();

      return documents;
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", user.id).eq("parentDocument", args.parentDocument),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Inserts a new document owned by the current Clerk user, optionally under a parent.
 * Child documents created under an existing parent inherit the parent document's userId.
 *
 * @param {{ title: string; parentDocument?: Id<"documents"> }} args Mutation arguments including the new title.
 * @returns {Promise<Id<"documents">>} Identifier of the newly created document.
 * @see https://docs.convex.dev/database/writing-data
 */
export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // user must be authenticated to create a document
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);
    let documentUserId = user.id;

    if (args.parentDocument) {
      const parent = await ctx.db.get(args.parentDocument);
      if (!parent) {
        throw new Error("Not found");
      }
      if (!hasPermission(user, "documents", "update", parent)) {
        throw new Error("Unauthorized");
      }
      documentUserId = parent.userId;
    }

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId: documentUserId,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

/**
 * Lists archived documents for the signed-in user or all users if administrator.
 * Results are sorted newest first to surface recent deletions.
 *
 * @returns {Promise<Doc<"documents">[]>} Archived documents.
 * @see https://docs.convex.dev/database/queries
 */
export const getTrash = query({
  handler: async (ctx) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    if (canViewAllDocuments(user)) {
      const documents = await ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("isArchived"), true))
        .order("desc")
        .collect();

      return documents;
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Reverses the archive operation for a document tree.
 * Automatically lifts the note out of nested parents that remain archived.
 * Cascades restorations using the target document's userId.
 *
 * @param {Id<"documents">} id Document identifier to restore.
 * @returns {Promise<Doc<"documents"> | undefined>} Updated document after restoration.
 * @see https://docs.convex.dev/functions/mutations
 */
export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can restore documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot restore a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot restore a document without permission
    if (!hasPermission(user, "documents", "update", existingDocument)) {
      throw new Error("Unauthorized");
    }

    /**
     * Restores the document and all its children documents.
     * Cascades using the document owner's userId.
     *
     * @param documentId Document ID to restore.
     */
    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("userId", existingDocument.userId)
            .eq("parentDocument", documentId),
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    // if the document has a parent document, check if the parent document is archived
    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);
      if (parent?.isArchived) {
        options.parentDocument = undefined;
      }
    }

    const document = await ctx.db.patch(args.id, options);

    recursiveRestore(args.id);

    return document;
  },
});

/**
 * Permanently removes a document that belongs to the user or if caller is administrator.
 *
 * @param {Id<"documents">} id Document identifier to delete.
 * @returns {Promise<void>} Resolves when the document has been removed.
 * @see https://docs.convex.dev/database/writing-data#delete-records
 */
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can delete documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot delete a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot delete a document without permission
    if (!hasPermission(user, "documents", "delete", existingDocument)) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

/**
 * Returns all non-archived documents for the current user (or across all users if admin).
 *
 * @returns {Promise<Doc<"documents">[]>} Active documents.
 * @see https://docs.convex.dev/database/queries#indexes
 */
export const getSearch = query({
  handler: async (ctx) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    if (canViewAllDocuments(user)) {
      const documents = await ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("isArchived"), false))
        .order("desc")
        .collect();

      return documents;
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Loads a document by id, exposing published entries publicly while guarding private ones.
 * Administrators are permitted to inspect any private or archived document.
 *
 * @param {Id<"documents">} documentId Document identifier to fetch.
 * @returns {Promise<Doc<"documents">>} The requested document if access is allowed.
 * @see https://docs.convex.dev/database/queries
 */
export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    /**
     * Fetches the currently opened document from the database.
     */
    const document = await ctx.db.get(args.documentId);

    // cannot fetch a document that does not exist
    if (!document) {
      throw new Error("Not found");
    }

    // public published documents are accessible without authentication
    if (document.isPublished && !document.isArchived) {
      return document;
    }

    // only authenticated users can fetch unpublished documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = createAuthUser(identity.subject);

    // verify permission for private or archived note
    if (!hasPermission(user, "documents", "view", document)) {
      throw new Error("Unauthorized");
    }

    return document;
  },
});

/**
 * Applies partial updates to a document.
 * Supports updating metadata, content, and publishing status in one call.
 *
 * @param {{ id: Id<"documents">; title?: string; content?: string; coverImage?: string; icon?: string; isPublished?: boolean }} args Mutation arguments describing updates.
 * @returns {Promise<Doc<"documents">>} Updated document reflecting changes.
 * @see https://docs.convex.dev/database/writing-data#update-records
 */
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = createAuthUser(identity.subject);
    const { id, ...rest } = args;

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document without permission
    if (!hasPermission(user, "documents", "update", existingDocument)) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {
      ...rest,
    });

    return document;
  },
});

/**
 * Clears the icon metadata on a document after validating permission.
 *
 * @param {Id<"documents">} id Document identifier whose icon should be removed.
 * @returns {Promise<Doc<"documents">>} Updated document with the icon cleared.
 * @see https://docs.convex.dev/functions/mutations
 */
export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = createAuthUser(identity.subject);

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document without permission
    if (!hasPermission(user, "documents", "update", existingDocument)) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    });

    return document;
  },
});

/**
 * Unsets the cover image URL for a document once permission is confirmed.
 *
 * @param {Id<"documents">} id Document identifier whose cover image should be removed.
 * @returns {Promise<Doc<"documents">>} Updated document with the cover image cleared.
 * @see https://docs.convex.dev/functions/mutations
 */
export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    /**
     * Fetches the currently logged in user.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = createAuthUser(identity.subject);

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document without permission
    if (!hasPermission(user, "documents", "update", existingDocument)) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});

/**
 * Determines whether the currently authenticated user possesses global administrator privileges.
 *
 * @returns {Promise<boolean>} True if the authenticated user is an administrator, false otherwise.
 * @see https://docs.convex.dev/functions/query
 */
export const isAdmin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = createAuthUser(identity.subject);
    return canAccessAdminPanel(user);
  },
});

/**
 * Aggregates global system statistics and all documents across authors for administrator inspection.
 * Restricted strictly to users with administrator privileges.
 *
 * @returns {Promise<{ stats: { totalDocuments: number; activeDocuments: number; archivedDocuments: number; publishedDocuments: number; authorCount: number }; documents: Doc<"documents">[] }>} Global workspace metrics and documents.
 * @throws {Error} When user is unauthenticated or not an administrator.
 * @see https://docs.convex.dev/functions/query
 */
export const getAdminStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = createAuthUser(identity.subject);
    if (!canAccessAdminPanel(user)) {
      throw new Error("Unauthorized");
    }

    const documents = await ctx.db.query("documents").order("desc").collect();
    const authors = new Set<string>();
    let activeDocuments = 0;
    let archivedDocuments = 0;
    let publishedDocuments = 0;

    for (const doc of documents) {
      authors.add(doc.userId);
      if (doc.isArchived) {
        archivedDocuments++;
      } else {
        activeDocuments++;
        if (doc.isPublished) {
          publishedDocuments++;
        }
      }
    }

    return {
      stats: {
        totalDocuments: documents.length,
        activeDocuments,
        archivedDocuments,
        publishedDocuments,
        authorCount: authors.size,
      },
      documents,
    };
  },
});
