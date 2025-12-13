import { describe, expect, it } from "vitest";

import { EdgeStoreProvider, useEdgeStore } from "../../lib/edgestore";

describe("edgestore bindings", () => {
  it("exposes provider and hook factories", () => {
    expect(typeof EdgeStoreProvider).toBe("function");
    expect(typeof useEdgeStore).toBe("function");
  });
});
