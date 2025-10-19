import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Defines the Convex schema that models Joker Notes documents and their metadata.
 * Captures ownership, hierarchy, and publishing status for each entry.
 *
 * @returns {ReturnType<typeof defineSchema>} Convex schema describing Joker Notes documents.
 * @see https://docs.convex.dev/database/schemas
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
