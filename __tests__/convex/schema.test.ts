import { describe, expect, it } from "vitest";

import schema from "../../convex/schema";

describe("convex schema", () => {
  it("defines the documents table and indexes", () => {
    const exported = JSON.parse(schema.export());
    const documents = exported.tables.find(
      (table: any) => table.tableName === "documents",
    );

    expect(documents).toBeDefined();
    expect(documents.indexes.map((index: any) => index.indexDescriptor)).toEqual(
      expect.arrayContaining(["by_user", "by_user_parent"]),
    );
    expect(documents.documentType).toBeTruthy();
  });
});
