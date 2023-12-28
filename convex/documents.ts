import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Moves a document to trash (archive) along with all its children documents.
 * The document is not deleted from the database, but rather marked as archived.
 * Requirements to archive a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
 * 
 * @param id (string) - document ID to archive
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
     * @param documentId (string) - document ID to archive
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
 * Fetches all documents that are not archived (in trash).
 * Requirements to fetch documents:
 * 1. The user must be authenticated.
 * 2. The documents must belong to the user.
 * 3. The documents must not be archived (in trash).
 * 
 * @param parentDocument (string) - ID of the parent document
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
 * Creates a new document.
 * Requirements to create a document:
 * 1. The user must be authenticated.
 * 2. The document must have a title.
 * 
 * @param title (string) - title of the document
 * @param parentDocument (string?) - ID of the parent document
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
 * Fetches all documents that are archived (in trash).
 * Requirements to fetch documents:
 * 1. The user must be authenticated.
 * 2. The documents must belong to the user.
 * 3. The documents must be archived (in trash).
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
 * Restores a document from trash (archives).
 * Requirements to restore a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
 * 
 * @param id (string) - document ID to restore
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
     * @param documentId (string) - document ID to restore
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
 * Permanently deletes a document from the database.
 * Ideally, the document should be archived (in trash) before being deleted.
 * This is not a requirement as it it not checked. 
 * Requirements to delete a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
 * 
 * @param id (string) - document ID to delete
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
 * Searches for documents that match the query.
 * Requirements to search for documents:
 * 1. The user must be authenticated.
 * 2. The documents must belong to the user.
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
 * Fetches a document by its ID.
 * Requirements to fetch a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
 * 4. The document must not be archived (in trash).
 * 5. If the document is not published
 * 
 * @param documentId (string) - document ID to fetch
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
 * Updates a document.
 * Requirements to update a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
 * 
 * @param id (string) - document ID to update
 * @param title (string?) - new title of the document
 * @param content (string?) - new content of the document
 * @param coverImage (string?) - new cover image of the document
 * @param icon (string?) - new icon of the document
 * @param isPublished (boolean?) - whether the document is published
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
 * Removes the icon for a document.
 * Requirements to remove the icon for a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
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
 * Removes the cover image for a document.
 * Requirements to remove the cover image for a document:
 * 1. The user must be authenticated.
 * 2. The document must exist.
 * 3. The document must belong to the user.
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
