import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for the Convex database.
 * - `title` (string): The title of the document.
 * - `userId`(string): The Clerk user ID of the document owner.
 * - `isArchived`(boolean): Whether the document is in trash.
 * - `parentDocument`(string): The parent document ID as documents can be nested.
 * - `content`(string): The document content.
 * - `coverImage`(string): The document cover image URL.
 * - `icon`(string): The document icon.
 * - `isPublished`(boolean): Whether the document is shareable.
 */
export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(), // Clerk user ID
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")), // nested documents relationship
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(), // shareable
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),
});
