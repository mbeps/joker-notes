import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";

describe("ROUTES", () => {
  it("returns the home static route", () => {
    expect(ROUTES.HOME.path).toBe("/");
  });

  it("returns the documents static route", () => {
    expect(ROUTES.DOCUMENTS.path).toBe("/documents");
  });

  it("builds dynamic document detail route", () => {
    expect(ROUTES.DOCUMENTS.detail("123")).toBe("/documents/123");
  });

  it("returns the preview static route", () => {
    expect(ROUTES.PREVIEW.path).toBe("/preview");
  });

  it("builds dynamic preview detail route", () => {
    expect(ROUTES.PREVIEW.detail("456")).toBe("/preview/456");
  });
});

