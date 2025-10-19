import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Marks a document and its descendants as archived so they disappear from the active tree.
 * Only the owning Clerk user can invoke this mutation.
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

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot delete a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot delete a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Recursively archives all children documents.
     * This goes layer by layer.
     * It first archives the current root document, then goes to the next layer and archives all its children documents.
     * @param documentId (string): document ID to archive
     */
    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId),
        )
        .collect();

      // async needs to use for loop
      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id); // goes layer by layer
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
 * Returns the visible child documents for the authenticated user and optional parent.
 * Filters out archived notes so the sidebar only shows active branches.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches all documents from the database which belong to the currently logged in user.
     * The documents are sorted by the date they were created.
     * Archived (in trash) documents are not fetched.
     */
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentDocument),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Inserts a new document owned by the current Clerk user, optionally under a parent.
 * Initializes notes as unpublished and active so they appear immediately in the UI.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // user must be authenticated to create a document
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Inserts a new document into the database.
     * By default, the document is not archived (in trash) and not published.
     * The document takes:
     * 1. title (string): title of the document
     * 2. parentDocument (string): ID of the parent document
     * 3. userId (string): ID of the user who created the document
     * 4. isArchived (boolean): whether the document is archived (in trash)
     * 5. isPublished (boolean): whether the document is published
     */
    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

/**
 * Lists archived documents for the signed-in user so the trash view can render.
 * Results are sorted newest first to surface recent deletions.
 *
 * @returns {Promise<Doc<"documents">[]>} Archived documents owned by the authenticated user.
 * @see https://docs.convex.dev/database/queries
 */
export const getTrash = query({
  handler: async (ctx) => {
    /**
     * Fetches the currently logged in user.
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches all documents from the database which belong to the currently logged in user.
     * The documents are sorted by the date they were created.
     * Only archived (in trash) documents are fetched.
     */
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Reverses the archive operation for a document tree and re-exposes it to the owner.
 * Automatically lifts the note out of nested parents that remain archived.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can restore documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     */
    const userId = identity.subject;

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot restore a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot restore a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Restores the document and all its children documents.
     * This goes layer by layer.
     * It first restores the current root document, then goes to the next layer and restores all its children documents.
     * @param documentId (string): document ID to restore
     */
    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId),
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
 * Permanently removes a document that belongs to the authenticated user.
 * Use after archival when the note should no longer exist in storage.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can delete documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches the currently opened document from the database.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot delete a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot delete a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Deletes the document from the database.
     */
    const document = await ctx.db.delete(args.id);

    return document;
  },
});

/**
 * Returns all non-archived documents for the current user so the client can filter locally.
 * Keeps search fast by relying on indexed queries in Convex.
 *
 * @returns {Promise<Doc<"documents">[]>} Active documents owned by the authenticated user.
 * @see https://docs.convex.dev/database/queries#indexes
 */
export const getSearch = query({
  handler: async (ctx) => {
    /**
     * Fetches the currently logged in user.
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can fetch documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches all documents from the database which belong to the currently logged in user.
     * Does not fetch archived (in trash) documents.
     */
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Loads a document by id, exposing published entries publicly while guarding private ones.
 * Ensures only the owner can read unpublished content.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    /**
     * Fetches the currently opened document from the database.
     * The document is fetched by its ID.
     */
    const document = await ctx.db.get(args.documentId);

    // cannot fetch a document that does not exist
    if (!document) {
      throw new Error("Not found");
    }

    // cannot fetch a document that is not published or archived (in trash)
    if (document.isPublished && !document.isArchived) {
      return document;
    }

    // only authenticated users can fetch unpublished documents
    if (!identity) {
      throw new Error("Not authenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    // cannot fetch a document that does not belong to the user
    if (document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // returns the document
    return document;
  },
});

/**
 * Applies partial updates to a document owned by the current user.
 * Supports updating metadata, content, and publishing status in one call.
 *
 * @param {{ id: Id<"documents">; title?: string; content?: string; coverImage?: string; icon?: string; isPublished?: boolean }} args Mutation arguments describing the desired updates.
 * @returns {Promise<Doc<"documents">>} Updated document reflecting the changes.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    // keeps id the same and updates the rest
    const { id, ...rest } = args;

    /**
     * Fetches the currently opened document from the database.
     * The document is fetched by its ID.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Updates the document in the database.
     * The document is updated with the following fields:
     * 1. title (string): title of the document
     * 2. content (string): content of the document
     * 3. coverImage (string): cover image of the document
     * 4. icon (string): icon of the document
     * 5. isPublished (boolean): whether the document is published
     *
     * The ID of the document is kept the same.
     */
    const document = await ctx.db.patch(args.id, {
      ...rest,
    });

    return document;
  },
});

/**
 * Clears the icon metadata on a document after validating ownership.
 * Useful when reverting to plain text titles in the UI.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches the currently opened document from the database.
     * The document is fetched by its ID.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Removes the icon for a document in the database.
     * The document is updated with the following fields:
     * 1. icon (string): icon of the document
     *
     * The ID and the rest of the fields of the document are kept the same.
     */
    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    });

    return document;
  },
});

/**
 * Unsets the cover image URL for a document once the owner removes the asset.
 * Keeps the remaining metadata intact.
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
     * This user is provided by Clerk and is stored in the identity within Convex.
     */
    const identity = await ctx.auth.getUserIdentity();

    // only authenticated users can update documents
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    /**
     * Extracts the user ID from the identity from the currently logged in user.
     * This identity is provided by Clerk.
     */
    const userId = identity.subject;

    /**
     * Fetches the currently opened document from the database.
     * The document is fetched by its ID.
     */
    const existingDocument = await ctx.db.get(args.id);

    // cannot update a document that does not exist
    if (!existingDocument) {
      throw new Error("Not found");
    }

    // cannot update a document that does not belong to the user
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    /**
     * Removes the cover image for a document in the database.
     * The document is updated with the following fields:
     * 1. coverImage (string): cover image of the document
     *
     * The ID and the rest of the fields of the document are kept the same.
     */
    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});
