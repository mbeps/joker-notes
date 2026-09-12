import { describe, expect, it } from "vitest";
import { ASSETS } from "@/config/assets";

describe("ASSETS", () => {
  it("defines correct paths for logos", () => {
    expect(ASSETS.LOGOS.LIGHT).toBe("/logos/logo-light.svg");
    expect(ASSETS.LOGOS.DARK).toBe("/logos/logo-dark.svg");
  });

  it("defines correct paths for documents illustration", () => {
    expect(ASSETS.DOCUMENTS.LIGHT).toBe("/documents/documents-light.png");
    expect(ASSETS.DOCUMENTS.DARK).toBe("/documents/documents-dark.png");
  });

  it("defines correct paths for reading illustration", () => {
    expect(ASSETS.READING.LIGHT).toBe("/reading/reading-light.png");
    expect(ASSETS.READING.DARK).toBe("/reading/reading-dark.png");
  });

  it("defines correct paths for empty states", () => {
    expect(ASSETS.EMPTY.LIGHT).toBe("/empty/empty-light.png");
    expect(ASSETS.EMPTY.DARK).toBe("/empty/empty-dark.png");
  });

  it("defines correct paths for error states", () => {
    expect(ASSETS.ERROR.LIGHT).toBe("/error/error-light.png");
    expect(ASSETS.ERROR.DARK).toBe("/error/error-dark.png");
  });
});

