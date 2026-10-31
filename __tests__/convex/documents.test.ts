import { describe, expect, it, vi } from "vitest";
import type { Id } from "@/convex/_generated/dataModel";
import {
  archive,
  create,
  getAdminStats,
  getById,
  getSearch,
  getSidebar,
  getTrash,
  isAdmin,
  remove,
  removeCoverImage,
  removeIcon,
  restore,
  update,
} from "@/convex/documents";

type MockDocument = {
  _id: Id<"documents">;
  title: string;
  userId: string;
  isArchived: boolean;
  parentDocument?: Id<"documents">;
  content?: string;
  coverImage?: string;
  icon?: string;
  isPublished: boolean;
  _creationTime?: number;
};

const makeId = (id: string) => id as Id<"documents">;

const createDoc = (
  id: string,
  overrides: Partial<MockDocument> = {},
): MockDocument => ({
  _id: makeId(id),
  title: id,
  userId: "user_1",
  isArchived: false,
  isPublished: false,
  _creationTime: 0,
  ...overrides,
});

const archiveHandler = (archive as any)._handler;
const createHandler = (create as any)._handler;
const getSidebarHandler = (getSidebar as any)._handler;
const getTrashHandler = (getTrash as any)._handler;
const restoreHandler = (restore as any)._handler;
const removeHandler = (remove as any)._handler;
const getSearchHandler = (getSearch as any)._handler;
const getByIdHandler = (getById as any)._handler;
const updateHandler = (update as any)._handler;
const removeIconHandler = (removeIcon as any)._handler;
const removeCoverImageHandler = (removeCoverImage as any)._handler;
const isAdminHandler = (isAdmin as any)?._handler;
const getAdminStatsHandler = (getAdminStats as any)?._handler;

const createQueryBuilder = (map: Map<Id<"documents">, MockDocument>) => {
  let results = Array.from(map.values());
  let userFilter: string | undefined;
  let parentFilter: Id<"documents"> | undefined;
  let userFilterSet = false;
  let parentFilterSet = false;

  const chain: any = {
    withIndex: vi.fn((_name: string, cb: any) => {
      userFilter = undefined;
      parentFilter = undefined;
      userFilterSet = false;
      parentFilterSet = false;

      const q = {
        eq: (field: any, value: any) => {
          if (field === "userId") {
            userFilter = value;
            userFilterSet = true;
          }
          if (field === "parentDocument") {
            parentFilter = value;
            parentFilterSet = true;
          }
          return q;
        },
      };

      cb(q as any);

      results = results.filter((doc) => {
        const userMatches = userFilterSet ? doc.userId === userFilter : true;
        const parentMatches = parentFilterSet
          ? doc.parentDocument === parentFilter
          : true;
        return userMatches && parentMatches;
      });

      return chain;
    }),
    filter: vi.fn((predicate: any) => {
      results = results.filter((doc) => {
        const q = {
          eq: (left: any, right: any) => left === right,
          field: (fieldName: keyof MockDocument) => doc[fieldName],
        };
        return predicate(q as any);
      });
      return chain;
    }),
    order: vi.fn((direction: "asc" | "desc") => {
      results = [...results].sort((a, b) => {
        const aTime = a._creationTime ?? 0;
        const bTime = b._creationTime ?? 0;
        return direction === "desc" ? bTime - aTime : aTime - bTime;
      });
      return chain;
    }),
    collect: vi.fn(async () => results),
  };

  return chain;
};

const createContext = ({
  identity = { subject: "user_1" } as { subject: string } | null,
  documents = [] as MockDocument[],
} = {}) => {
  const documentMap = new Map(documents.map((doc) => [doc._id, { ...doc }]));

  const auth = {
    getUserIdentity: vi.fn(async () => identity),
  };

  const db = {
    get: vi.fn(async (id: Id<"documents">) => documentMap.get(id)),
    insert: vi.fn(async (_table: string, doc: Omit<MockDocument, "_id">) => {
      const id = makeId(`doc_${documentMap.size + 1}`);
      documentMap.set(id, { _id: id, ...doc });
      return id;
    }),
    patch: vi.fn(async (id: Id<"documents">, patch: Partial<MockDocument>) => {
      const current = documentMap.get(id);
      if (!current) return undefined;
      const updated = { ...current, ...patch };
      documentMap.set(id, updated);
      return updated;
    }),
    delete: vi.fn(async (id: Id<"documents">) => {
      const existing = documentMap.get(id);
      documentMap.delete(id);
      return existing;
    }),
    query: vi.fn((_table: string) => createQueryBuilder(documentMap)),
  };

  return { ctx: { auth, db } as any, documentMap, auth, db };
};

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("documents archive", () => {
  it("throws when unauthenticated", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(archiveHandler(ctx, { id: makeId("doc_1") })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("throws when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(
      archiveHandler(ctx, { id: makeId("missing") }),
    ).rejects.toThrow("Not found");
  });

  it("throws when the user does not own the document", async () => {
    const doc = createDoc("doc_1", { userId: "someone_else" });
    const { ctx } = createContext({ documents: [doc] });
    await expect(archiveHandler(ctx, { id: doc._id })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("archives the document tree for the owner", async () => {
    const root = createDoc("root");
    const child = createDoc("child", { parentDocument: root._id });
    const grandchild = createDoc("grandchild", { parentDocument: child._id });
    const { ctx, documentMap, db } = createContext({
      documents: [root, child, grandchild],
    });

    const result = await archiveHandler(ctx, { id: root._id });
    expect(result?.isArchived).toBe(true);
    expect(db.patch).toHaveBeenCalledWith(root._id, { isArchived: true });

    await flushAsync();

    expect(documentMap.get(child._id)?.isArchived).toBe(true);
    expect(documentMap.get(grandchild._id)?.isArchived).toBe(true);
  });
});

describe("documents create", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(
      createHandler(ctx, { title: "New doc", parentDocument: undefined }),
    ).rejects.toThrow("Not authenticated");
  });

  it("inserts a new document for the user with defaults", async () => {
    const { ctx, documentMap, db } = createContext();

    const newId = await createHandler(ctx, {
      title: "New doc",
      parentDocument: undefined,
    });

    expect(db.insert).toHaveBeenCalled();
    expect(documentMap.get(newId as Id<"documents">)).toMatchObject({
      title: "New doc",
      isArchived: false,
      isPublished: false,
      userId: "user_1",
    });
  });
});

describe("documents getSidebar", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(
      getSidebarHandler(ctx, { parentDocument: undefined }),
    ).rejects.toThrow("Not authenticated");
  });

  it("returns unarchived children for the user", async () => {
    const root = createDoc("root", { _creationTime: 1 });
    const child = createDoc("child", {
      parentDocument: root._id,
      _creationTime: 2,
    });
    const archivedChild = createDoc("archived", {
      parentDocument: root._id,
      isArchived: true,
      _creationTime: 3,
    });
    const foreignChild = createDoc("foreign", {
      parentDocument: root._id,
      userId: "other",
      _creationTime: 4,
    });

    const { ctx } = createContext({
      documents: [root, child, archivedChild, foreignChild],
    });

    const results = await getSidebarHandler(ctx, {
      parentDocument: root._id,
    });

    expect(results).toEqual([child]);
  });
});

describe("documents getTrash", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(getTrashHandler(ctx)).rejects.toThrow("Not authenticated");
  });

  it("returns archived documents for the user", async () => {
    const archived = createDoc("archived", { isArchived: true });
    const active = createDoc("active", { isArchived: false });
    const { ctx } = createContext({ documents: [archived, active] });

    const results = await getTrashHandler(ctx);
    expect(results).toEqual([archived]);
  });
});

describe("documents restore", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(restoreHandler(ctx, { id: makeId("doc_1") })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("errors when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(
      restoreHandler(ctx, { id: makeId("missing") }),
    ).rejects.toThrow("Not found");
  });

  it("prevents restoring documents owned by other users", async () => {
    const doc = createDoc("doc", { userId: "other", isArchived: true });
    const { ctx } = createContext({ documents: [doc] });
    await expect(restoreHandler(ctx, { id: doc._id })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("restores a root document without touching the parent branch", async () => {
    const doc = createDoc("doc", { isArchived: true });
    const { ctx, documentMap } = createContext({ documents: [doc] });

    const restored = await restoreHandler(ctx, { id: doc._id });
    await flushAsync();

    expect(restored?.isArchived).toBe(false);
    expect(documentMap.get(doc._id)?.parentDocument).toBeUndefined();
  });

  it("unarchives children and detaches from an archived parent", async () => {
    const parent = createDoc("parent", { isArchived: true });
    const doc = createDoc("doc", {
      isArchived: true,
      parentDocument: parent._id,
    });
    const child = createDoc("child", {
      isArchived: true,
      parentDocument: doc._id,
    });
    const { ctx, documentMap } = createContext({
      documents: [parent, doc, child],
    });

    const restored = await restoreHandler(ctx, { id: doc._id });
    await flushAsync();

    expect(restored?.isArchived).toBe(false);
    expect(documentMap.get(doc._id)?.parentDocument).toBeUndefined();
    expect(documentMap.get(child._id)?.isArchived).toBe(false);
  });

  it("keeps the parent link when the parent is active", async () => {
    const parent = createDoc("parent", { isArchived: false });
    const doc = createDoc("doc", {
      isArchived: true,
      parentDocument: parent._id,
    });
    const { ctx, documentMap } = createContext({ documents: [parent, doc] });

    const restored = await restoreHandler(ctx, { id: doc._id });
    await flushAsync();

    expect(restored?.parentDocument).toBe(parent._id);
    expect(documentMap.get(doc._id)?.parentDocument).toBe(parent._id);
  });
});

describe("documents remove", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(removeHandler(ctx, { id: makeId("doc") })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("errors when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(removeHandler(ctx, { id: makeId("missing") })).rejects.toThrow(
      "Not found",
    );
  });

  it("prevents deleting another user's document", async () => {
    const doc = createDoc("doc", { userId: "other" });
    const { ctx } = createContext({ documents: [doc] });
    await expect(removeHandler(ctx, { id: doc._id })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("deletes the requested document", async () => {
    const doc = createDoc("doc");
    const { ctx, documentMap, db } = createContext({ documents: [doc] });

    await removeHandler(ctx, { id: doc._id });

    expect(db.delete).toHaveBeenCalledWith(doc._id);
    expect(documentMap.has(doc._id)).toBe(false);
  });
});

describe("documents getSearch", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(getSearchHandler(ctx)).rejects.toThrow("Not authenticated");
  });

  it("returns only active documents", async () => {
    const active = createDoc("active");
    const archived = createDoc("archived", { isArchived: true });
    const { ctx } = createContext({ documents: [active, archived] });

    const results = await getSearchHandler(ctx);
    expect(results).toEqual([active]);
  });
});

describe("documents getById", () => {
  it("throws when the document is missing", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(
      getByIdHandler(ctx, { documentId: makeId("missing") }),
    ).rejects.toThrow("Not found");
  });

  it("allows unauthenticated access to published documents", async () => {
    const published = createDoc("published", {
      isPublished: true,
      isArchived: false,
    });
    const { ctx } = createContext({
      identity: null,
      documents: [published],
    });

    const result = await getByIdHandler(ctx, { documentId: published._id });
    expect(result).toEqual(published);
  });

  it("requires authentication for unpublished or archived docs", async () => {
    const draft = createDoc("draft");
    const { ctx } = createContext({ identity: null, documents: [draft] });
    await expect(
      getByIdHandler(ctx, { documentId: draft._id }),
    ).rejects.toThrow("Not authenticated");
  });

  it("blocks access for non-owners", async () => {
    const draft = createDoc("draft", { userId: "owner" });
    const { ctx } = createContext({
      identity: { subject: "other" },
      documents: [draft],
    });
    await expect(
      getByIdHandler(ctx, { documentId: draft._id }),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns unpublished docs for the owner", async () => {
    const draft = createDoc("draft");
    const { ctx } = createContext({ documents: [draft] });
    const result = await getByIdHandler(ctx, { documentId: draft._id });
    expect(result).toEqual(draft);
  });
});

describe("documents update", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(
      updateHandler(ctx, { id: makeId("doc"), title: "Updated" }),
    ).rejects.toThrow("Unauthenticated");
  });

  it("throws when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(
      updateHandler(ctx, { id: makeId("missing"), title: "Updated" }),
    ).rejects.toThrow("Not found");
  });

  it("prevents updates from other users", async () => {
    const doc = createDoc("doc", { userId: "other" });
    const { ctx } = createContext({ documents: [doc] });
    await expect(
      updateHandler(ctx, { id: doc._id, title: "Updated" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("updates owned documents", async () => {
    const doc = createDoc("doc", { title: "Old", isPublished: false });
    const { ctx, documentMap, db } = createContext({ documents: [doc] });

    const updated = await updateHandler(ctx, {
      id: doc._id,
      title: "New title",
      isPublished: true,
    });

    expect(db.patch).toHaveBeenCalledWith(doc._id, {
      title: "New title",
      isPublished: true,
    });
    expect(updated?.title).toBe("New title");
    expect(documentMap.get(doc._id)?.isPublished).toBe(true);
  });
});

describe("documents removeIcon", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(removeIconHandler(ctx, { id: makeId("doc") })).rejects.toThrow(
      "Unauthenticated",
    );
  });

  it("throws when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(
      removeIconHandler(ctx, { id: makeId("missing") }),
    ).rejects.toThrow("Not found");
  });

  it("prevents removing icons from foreign documents", async () => {
    const doc = createDoc("doc", { userId: "other", icon: "🔥" });
    const { ctx } = createContext({ documents: [doc] });
    await expect(removeIconHandler(ctx, { id: doc._id })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("clears icons for owned documents", async () => {
    const doc = createDoc("doc", { icon: "🔥" });
    const { ctx, documentMap } = createContext({ documents: [doc] });

    const updated = await removeIconHandler(ctx, { id: doc._id });
    expect(updated?.icon).toBeUndefined();
    expect(documentMap.get(doc._id)?.icon).toBeUndefined();
  });
});

describe("documents removeCoverImage", () => {
  it("requires authentication", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(
      removeCoverImageHandler(ctx, { id: makeId("doc") }),
    ).rejects.toThrow("Unauthenticated");
  });

  it("throws when the document is missing", async () => {
    const { ctx } = createContext();
    await expect(
      removeCoverImageHandler(ctx, { id: makeId("missing") }),
    ).rejects.toThrow("Not found");
  });

  it("prevents removing cover images from foreign documents", async () => {
    const doc = createDoc("doc", { userId: "other", coverImage: "cover" });
    const { ctx } = createContext({ documents: [doc] });
    await expect(removeCoverImageHandler(ctx, { id: doc._id })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("clears cover images for owned documents", async () => {
    const doc = createDoc("doc", { coverImage: "cover" });
    const { ctx, documentMap } = createContext({ documents: [doc] });

    const updated = await removeCoverImageHandler(ctx, { id: doc._id });
    expect(updated?.coverImage).toBeUndefined();
    expect(documentMap.get(doc._id)?.coverImage).toBeUndefined();
  });
});

describe("documents archive edge cases", () => {
  it("does not archive unrelated sibling trees", async () => {
    const rootA = createDoc("rootA");
    const childA = createDoc("childA", { parentDocument: rootA._id });
    const rootB = createDoc("rootB");
    const childB = createDoc("childB", { parentDocument: rootB._id });
    const { ctx, documentMap } = createContext({
      documents: [rootA, childA, rootB, childB],
    });

    await archiveHandler(ctx, { id: rootA._id });
    await flushAsync();

    expect(documentMap.get(childA._id)?.isArchived).toBe(true);
    expect(rootB.isArchived).toBe(false);
    expect(documentMap.get(childB._id)?.isArchived).toBe(false);
  });

  it("archives a leaf document with no children", async () => {
    const leaf = createDoc("leaf");
    const { ctx, db } = createContext({ documents: [leaf] });

    const result = await archiveHandler(ctx, { id: leaf._id });
    await flushAsync();

    expect(result?.isArchived).toBe(true);
    expect(db.query).toHaveBeenCalledTimes(1); // only the root's child lookup
  });

  it("patches the root before recursing into children", async () => {
    const root = createDoc("root");
    const child = createDoc("child", { parentDocument: root._id });
    const { ctx, db } = createContext({ documents: [root, child] });

    await archiveHandler(ctx, { id: root._id });
    await flushAsync();

    const patchOrder = db.patch.mock.invocationCallOrder[0];
    const queryOrder = db.query.mock.invocationCallOrder[0];
    expect(patchOrder).toBeLessThan(queryOrder);
  });
});

describe("documents restore edge cases", () => {
  it("restores a deep tree layer by layer", async () => {
    const a = createDoc("a", { isArchived: true });
    const b = createDoc("b", { isArchived: true, parentDocument: a._id });
    const c = createDoc("c", { isArchived: true, parentDocument: b._id });
    const d = createDoc("d", { isArchived: true, parentDocument: c._id });
    const { ctx, documentMap } = createContext({
      documents: [a, b, c, d],
    });

    await restoreHandler(ctx, { id: a._id });
    await flushAsync();

    expect(documentMap.get(b._id)?.isArchived).toBe(false);
    expect(documentMap.get(c._id)?.isArchived).toBe(false);
    expect(documentMap.get(d._id)?.isArchived).toBe(false);
  });

  it("does not restore children of an unrelated archived tree", async () => {
    const restoredRoot = createDoc("restored", { isArchived: true });
    const otherRoot = createDoc("other", { isArchived: true });
    const otherChild = createDoc("otherChild", {
      isArchived: true,
      parentDocument: otherRoot._id,
    });
    const { ctx, documentMap } = createContext({
      documents: [restoredRoot, otherRoot, otherChild],
    });

    await restoreHandler(ctx, { id: restoredRoot._id });
    await flushAsync();

    expect(documentMap.get(otherChild._id)?.isArchived).toBe(true);
  });
});

describe("documents getSidebar edge cases", () => {
  it("returns root-level documents when no parent is given", async () => {
    const root1 = createDoc("root1", { _creationTime: 1 });
    const root2 = createDoc("root2", { _creationTime: 2 });
    const nested = createDoc("nested", {
      parentDocument: root1._id,
      _creationTime: 3,
    });
    const { ctx } = createContext({ documents: [root1, root2, nested] });

    const results = await getSidebarHandler(ctx, { parentDocument: undefined });
    expect(results).toEqual([root2, root1]); // ordered desc by creation time
  });

  it("returns an empty list when the user has no matching children", async () => {
    const foreign = createDoc("foreign", { userId: "someone_else" });
    const { ctx } = createContext({ documents: [foreign] });

    const results = await getSidebarHandler(ctx, { parentDocument: undefined });
    expect(results).toEqual([]);
  });
});

describe("documents getTrash edge cases", () => {
  it("returns an empty list when nothing is archived", async () => {
    const active = createDoc("active");
    const { ctx } = createContext({ documents: [active] });

    const results = await getTrashHandler(ctx);
    expect(results).toEqual([]);
  });

  it("sorts archived documents newest first", async () => {
    const older = createDoc("older", { isArchived: true, _creationTime: 1 });
    const newer = createDoc("newer", { isArchived: true, _creationTime: 5 });
    const { ctx } = createContext({ documents: [older, newer] });

    const results = await getTrashHandler(ctx);
    expect(results.map((doc) => doc.title)).toEqual(["newer", "older"]);
  });

  it("excludes other users' archived documents", async () => {
    const mine = createDoc("mine", { isArchived: true });
    const theirs = createDoc("theirs", {
      userId: "someone_else",
      isArchived: true,
    });
    const { ctx } = createContext({ documents: [mine, theirs] });

    const results = await getTrashHandler(ctx);
    expect(results).toEqual([mine]);
  });
});

describe("documents getSearch edge cases", () => {
  it("returns an empty list when the user has no active documents", async () => {
    const archived = createDoc("archived", { isArchived: true });
    const { ctx } = createContext({ documents: [archived] });

    const results = await getSearchHandler(ctx);
    expect(results).toEqual([]);
  });

  it("includes published and unpublished active documents alike", async () => {
    const published = createDoc("published", { isPublished: true });
    const draft = createDoc("draft", { isPublished: false });
    const { ctx } = createContext({ documents: [published, draft] });

    const results = await getSearchHandler(ctx);
    expect(results).toHaveLength(2);
  });

  it("excludes other users' documents", async () => {
    const mine = createDoc("mine");
    const theirs = createDoc("theirs", { userId: "someone_else" });
    const { ctx } = createContext({ documents: [mine, theirs] });

    const results = await getSearchHandler(ctx);
    expect(results).toEqual([mine]);
  });
});

describe("documents getById edge cases", () => {
  it("hides archived published documents from anonymous users", async () => {
    const doc = createDoc("doc", { isPublished: true, isArchived: true });
    const { ctx } = createContext({ identity: null, documents: [doc] });

    await expect(getByIdHandler(ctx, { documentId: doc._id })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("returns published archived documents to their owner", async () => {
    const doc = createDoc("doc", { isPublished: true, isArchived: true });
    const { ctx } = createContext({ documents: [doc] });

    const result = await getByIdHandler(ctx, { documentId: doc._id });
    expect(result).toEqual(doc);
  });
});

describe("documents update edge cases", () => {
  it("updates content without touching other fields", async () => {
    const doc = createDoc("doc", { title: "Kept", content: undefined });
    const { ctx, db, documentMap } = createContext({ documents: [doc] });

    const updated = await updateHandler(ctx, {
      id: doc._id,
      content: '{"blocks":[]}',
    });

    expect(db.patch).toHaveBeenCalledWith(doc._id, {
      content: '{"blocks":[]}',
    });
    expect(updated?.title).toBe("Kept");
    expect(documentMap.get(doc._id)?.content).toBe('{"blocks":[]}');
  });

  it("sets and clears the icon via update", async () => {
    const doc = createDoc("doc");
    const { ctx, documentMap } = createContext({ documents: [doc] });

    await updateHandler(ctx, { id: doc._id, icon: "🚀" });
    expect(documentMap.get(doc._id)?.icon).toBe("🚀");

    await updateHandler(ctx, { id: doc._id, icon: undefined });
    expect(documentMap.get(doc._id)?.icon).toBeUndefined();
  });

  it("sets and clears the cover image via update", async () => {
    const doc = createDoc("doc");
    const { ctx, documentMap } = createContext({ documents: [doc] });

    await updateHandler(ctx, { id: doc._id, coverImage: "https://img" });
    expect(documentMap.get(doc._id)?.coverImage).toBe("https://img");

    await updateHandler(ctx, { id: doc._id, coverImage: undefined });
    expect(documentMap.get(doc._id)?.coverImage).toBeUndefined();
  });

  it("toggles isPublished off", async () => {
    const doc = createDoc("doc", { isPublished: true });
    const { ctx, documentMap } = createContext({ documents: [doc] });

    await updateHandler(ctx, { id: doc._id, isPublished: false });
    expect(documentMap.get(doc._id)?.isPublished).toBe(false);
  });
});

describe("documents create edge cases", () => {
  it("creates a nested document under a parent", async () => {
    const parent = createDoc("parent");
    const { ctx, documentMap, db } = createContext({
      documents: [parent],
    });

    const newId = await createHandler(ctx, {
      title: "Child",
      parentDocument: parent._id,
    });

    expect(db.insert).toHaveBeenCalledWith(
      "documents",
      expect.objectContaining({
        title: "Child",
        parentDocument: parent._id,
        userId: "user_1",
        isArchived: false,
        isPublished: false,
      }),
    );
    expect(documentMap.get(newId as Id<"documents">)?.parentDocument).toBe(
      parent._id,
    );
  });

  it("assigns ownership to the authenticated user's subject", async () => {
    const { ctx, db } = createContext({
      identity: { subject: "user_42" },
    });

    await createHandler(ctx, { title: "Mine", parentDocument: undefined });

    expect(db.insert).toHaveBeenCalledWith(
      "documents",
      expect.objectContaining({ userId: "user_42" }),
    );
  });

  it("throws Unauthorized when regular user tries to create child under foreign parent", async () => {
    const foreignParent = createDoc("foreign_parent", { userId: "other_user" });
    const { ctx } = createContext({
      identity: { subject: "regular_user" },
      documents: [foreignParent],
    });

    await expect(
      createHandler(ctx, {
        title: "Child",
        parentDocument: foreignParent._id,
      }),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws Not found when creating child under nonexistent parent", async () => {
    const { ctx } = createContext({
      identity: { subject: "regular_user" },
    });

    await expect(
      createHandler(ctx, {
        title: "Child",
        parentDocument: makeId("missing_parent"),
      }),
    ).rejects.toThrow("Not found");
  });
});

describe("documents isAdmin", () => {
  const originalAdmin = process.env.ADMIN_USER_ID;

  afterEach(() => {
    if (originalAdmin !== undefined) {
      process.env.ADMIN_USER_ID = originalAdmin;
    } else {
      delete process.env.ADMIN_USER_ID;
    }
  });

  it("returns false when user is unauthenticated", async () => {
    const { ctx } = createContext({ identity: null });
    const result = await isAdminHandler(ctx);
    expect(result).toBe(false);
  });

  it("returns false when authenticated user is not an admin", async () => {
    process.env.ADMIN_USER_ID = "admin_user";
    const { ctx } = createContext({ identity: { subject: "regular_user" } });
    const result = await isAdminHandler(ctx);
    expect(result).toBe(false);
  });

  it("returns true when authenticated user is configured as admin", async () => {
    process.env.ADMIN_USER_ID = "admin_user";
    const { ctx } = createContext({ identity: { subject: "admin_user" } });
    const result = await isAdminHandler(ctx);
    expect(result).toBe(true);
  });
});

describe("documents getAdminStats", () => {
  const originalAdmin = process.env.ADMIN_USER_ID;

  beforeEach(() => {
    process.env.ADMIN_USER_ID = "admin_user";
  });

  afterEach(() => {
    if (originalAdmin !== undefined) {
      process.env.ADMIN_USER_ID = originalAdmin;
    } else {
      delete process.env.ADMIN_USER_ID;
    }
  });

  it("throws Unauthorized when unauthenticated", async () => {
    const { ctx } = createContext({ identity: null });
    await expect(getAdminStatsHandler(ctx)).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized when authenticated user is not an admin", async () => {
    const { ctx } = createContext({ identity: { subject: "regular_user" } });
    await expect(getAdminStatsHandler(ctx)).rejects.toThrow("Unauthorized");
  });

  it("returns global stats and all documents when caller is admin", async () => {
    const doc1 = createDoc("doc1", {
      userId: "author_a",
      isArchived: false,
      isPublished: true,
      _creationTime: 10,
    });
    const doc2 = createDoc("doc2", {
      userId: "author_b",
      isArchived: true,
      isPublished: false,
      _creationTime: 20,
    });
    const doc3 = createDoc("doc3", {
      userId: "author_a",
      isArchived: false,
      isPublished: false,
      _creationTime: 30,
    });

    const { ctx } = createContext({
      identity: { subject: "admin_user" },
      documents: [doc1, doc2, doc3],
    });

    const result = await getAdminStatsHandler(ctx);

    expect(result.stats).toEqual({
      totalDocuments: 3,
      activeDocuments: 2,
      archivedDocuments: 1,
      publishedDocuments: 1,
      authorCount: 2,
    });
    expect(result.documents).toHaveLength(3);
  });
});

describe("documents admin cross-user capabilities", () => {
  const originalAdmin = process.env.ADMIN_USER_ID;

  beforeEach(() => {
    process.env.ADMIN_USER_ID = "admin_user";
  });

  afterEach(() => {
    if (originalAdmin !== undefined) {
      process.env.ADMIN_USER_ID = originalAdmin;
    } else {
      delete process.env.ADMIN_USER_ID;
    }
  });

  it("allows admin to view all active documents across users in getSidebar", async () => {
    const docA = createDoc("docA", {
      userId: "author_a",
      parentDocument: undefined,
      _creationTime: 1,
    });
    const docB = createDoc("docB", {
      userId: "author_b",
      parentDocument: undefined,
      _creationTime: 2,
    });
    const archived = createDoc("archived", {
      userId: "author_a",
      parentDocument: undefined,
      isArchived: true,
    });

    const { ctx } = createContext({
      identity: { subject: "admin_user" },
      documents: [docA, docB, archived],
    });

    const results = await getSidebarHandler(ctx, { parentDocument: undefined });
    expect(results).toEqual([docB, docA]);
  });

  it("allows admin to view all active documents across users in getSearch", async () => {
    const docA = createDoc("docA", { userId: "author_a" });
    const docB = createDoc("docB", { userId: "author_b" });
    const archived = createDoc("archived", {
      userId: "author_a",
      isArchived: true,
    });

    const { ctx } = createContext({
      identity: { subject: "admin_user" },
      documents: [docA, docB, archived],
    });

    const results = await getSearchHandler(ctx);
    expect(results).toHaveLength(2);
    expect(results.map((d: any) => d.title)).toContain("docA");
    expect(results.map((d: any) => d.title)).toContain("docB");
  });

  it("allows admin to view all archived documents across users in getTrash", async () => {
    const archivedA = createDoc("archivedA", {
      userId: "author_a",
      isArchived: true,
      _creationTime: 1,
    });
    const archivedB = createDoc("archivedB", {
      userId: "author_b",
      isArchived: true,
      _creationTime: 2,
    });
    const active = createDoc("active", { userId: "author_a" });

    const { ctx } = createContext({
      identity: { subject: "admin_user" },
      documents: [archivedA, archivedB, active],
    });

    const results = await getTrashHandler(ctx);
    expect(results).toEqual([archivedB, archivedA]);
  });

  it("allows admin to view unpublished foreign documents via getById", async () => {
    const draft = createDoc("draft", {
      userId: "foreign_author",
      isPublished: false,
    });
    const { ctx } = createContext({
      identity: { subject: "admin_user" },
      documents: [draft],
    });

    const result = await getByIdHandler(ctx, { documentId: draft._id });
    expect(result).toEqual(draft);
  });

  it("inherits parent author userId when admin creates child note under foreign parent", async () => {
    const parent = createDoc("foreign_parent", { userId: "foreign_author" });
    const { ctx, documentMap } = createContext({
      identity: { subject: "admin_user" },
      documents: [parent],
    });

    const childId = await createHandler(ctx, {
      title: "Admin Child Note",
      parentDocument: parent._id,
    });

    const createdChild = documentMap.get(childId as Id<"documents">);
    expect(createdChild?.userId).toBe("foreign_author");
    expect(createdChild?.parentDocument).toBe(parent._id);
  });

  it("cascades foreign children archival when admin archives a foreign parent", async () => {
    const foreignRoot = createDoc("foreign_root", { userId: "foreign_author" });
    const foreignChild = createDoc("foreign_child", {
      userId: "foreign_author",
      parentDocument: foreignRoot._id,
    });

    const { ctx, documentMap } = createContext({
      identity: { subject: "admin_user" },
      documents: [foreignRoot, foreignChild],
    });

    await archiveHandler(ctx, { id: foreignRoot._id });
    await flushAsync();

    expect(documentMap.get(foreignRoot._id)?.isArchived).toBe(true);
    expect(documentMap.get(foreignChild._id)?.isArchived).toBe(true);
  });

  it("cascades foreign children restoration when admin restores a foreign parent", async () => {
    const foreignRoot = createDoc("foreign_root", {
      userId: "foreign_author",
      isArchived: true,
    });
    const foreignChild = createDoc("foreign_child", {
      userId: "foreign_author",
      parentDocument: foreignRoot._id,
      isArchived: true,
    });

    const { ctx, documentMap } = createContext({
      identity: { subject: "admin_user" },
      documents: [foreignRoot, foreignChild],
    });

    await restoreHandler(ctx, { id: foreignRoot._id });
    await flushAsync();

    expect(documentMap.get(foreignRoot._id)?.isArchived).toBe(false);
    expect(documentMap.get(foreignChild._id)?.isArchived).toBe(false);
  });

  it("allows admin to update, removeIcon, removeCoverImage, and remove foreign documents", async () => {
    const foreignDoc = createDoc("foreign_doc", {
      userId: "foreign_author",
      icon: "⚡",
      coverImage: "https://cover.jpg",
    });

    const { ctx, documentMap } = createContext({
      identity: { subject: "admin_user" },
      documents: [foreignDoc],
    });

    const updated = await updateHandler(ctx, {
      id: foreignDoc._id,
      title: "Admin Renamed",
    });
    expect(updated?.title).toBe("Admin Renamed");

    const noIcon = await removeIconHandler(ctx, { id: foreignDoc._id });
    expect(noIcon?.icon).toBeUndefined();

    const noCover = await removeCoverImageHandler(ctx, { id: foreignDoc._id });
    expect(noCover?.coverImage).toBeUndefined();

    await removeHandler(ctx, { id: foreignDoc._id });
    expect(documentMap.has(foreignDoc._id)).toBe(false);
  });
});
