import { describe, expect, it, vi } from "vitest";

import {
  archive,
  create,
  getById,
  getSearch,
  getSidebar,
  getTrash,
  remove,
  removeCoverImage,
  removeIcon,
  restore,
  update,
} from "../../convex/documents";
import { Id } from "../../convex/_generated/dataModel";

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
    patch: vi.fn(
      async (id: Id<"documents">, patch: Partial<MockDocument>) => {
        const current = documentMap.get(id);
        if (!current) return undefined;
        const updated = { ...current, ...patch };
        documentMap.set(id, updated);
        return updated;
      },
    ),
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
    await expect(archiveHandler(ctx, { id: makeId("missing") })).rejects.toThrow(
      "Not found",
    );
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
    await expect(restoreHandler(ctx, { id: makeId("missing") })).rejects.toThrow(
      "Not found",
    );
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
    const { ctx } = createContext({ identity: { subject: "other" }, documents: [draft] });
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
    await expect(
      removeIconHandler(ctx, { id: makeId("doc") }),
    ).rejects.toThrow("Unauthenticated");
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
    await expect(
      removeCoverImageHandler(ctx, { id: doc._id }),
    ).rejects.toThrow("Unauthorized");
  });

  it("clears cover images for owned documents", async () => {
    const doc = createDoc("doc", { coverImage: "cover" });
    const { ctx, documentMap } = createContext({ documents: [doc] });

    const updated = await removeCoverImageHandler(ctx, { id: doc._id });
    expect(updated?.coverImage).toBeUndefined();
    expect(documentMap.get(doc._id)?.coverImage).toBeUndefined();
  });
});
