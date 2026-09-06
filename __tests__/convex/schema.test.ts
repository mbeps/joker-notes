import { describe, expect, it } from "vitest";

import schema from "../../convex/schema";

type ExportedField = { fieldType: { type: string }; optional: boolean };
type ExportedIndex = { indexDescriptor: string; fields: string[] };
type ExportedTable = {
  tableName: string;
  documentType: { value: Record<string, ExportedField> };
  indexes: ExportedIndex[];
};

const exportSchema = () =>
  JSON.parse((schema as unknown as { export: () => string }).export()) as {
    tables: ExportedTable[];
    schemaValidation: boolean;
  };

const getDocumentsTable = () => {
  const exported = exportSchema();
  const documents = exported.tables.find(
    (table) => table.tableName === "documents",
  );
  expect(documents).toBeDefined();
  return documents as ExportedTable;
};

const getFieldNames = (table: ExportedTable, optional: boolean) =>
  Object.entries(table.documentType.value)
    .filter(([, field]) => field.optional === optional)
    .map(([name]) => name)
    .sort();

describe("convex schema", () => {
  it("defines the documents table and indexes", () => {
    const documents = getDocumentsTable();

    expect(documents.indexes.map((index) => index.indexDescriptor)).toEqual(
      expect.arrayContaining(["by_user", "by_user_parent"]),
    );
    expect(documents.documentType).toBeTruthy();
  });

  it("defines exactly the expected required fields", () => {
    const documents = getDocumentsTable();

    const requiredFields = getFieldNames(documents, false);

    expect(requiredFields).toEqual([
      "isArchived",
      "isPublished",
      "title",
      "userId",
    ]);
  });

  it("defines the optional fields", () => {
    const documents = getDocumentsTable();

    const optionalFields = getFieldNames(documents, true);

    expect(optionalFields).toEqual([
      "content",
      "coverImage",
      "icon",
      "parentDocument",
    ]);
  });

  it("indexes by_user on userId only", () => {
    const documents = getDocumentsTable();

    const byUser = documents.indexes.find(
      (index) => index.indexDescriptor === "by_user",
    );

    expect(byUser?.fields).toEqual(["userId"]);
  });

  it("indexes by_user_parent on [userId, parentDocument]", () => {
    const documents = getDocumentsTable();

    const byUserParent = documents.indexes.find(
      (index) => index.indexDescriptor === "by_user_parent",
    );

    expect(byUserParent?.fields).toEqual(["userId", "parentDocument"]);
  });

  it("defines no search or vector indexes", () => {
    const documents = getDocumentsTable() as ExportedTable & {
      searchIndexes?: unknown[];
      vectorIndexes?: unknown[];
    };

    expect(documents.searchIndexes ?? []).toEqual([]);
    expect(documents.vectorIndexes ?? []).toEqual([]);
  });

  it("enforces strict schema validation", () => {
    expect(exportSchema().schemaValidation).toBe(true);
  });

  it("defines only the documents table", () => {
    const exported = exportSchema();

    expect(exported.tables.map((table) => table.tableName)).toEqual([
      "documents",
    ]);
  });
});
