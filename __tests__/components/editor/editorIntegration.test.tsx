import { BlockNoteEditor } from "@blocknote/core";
import { Transform } from "prosemirror-transform";
import { describe, expect, it } from "vitest";

describe("Editor Integration & ProseMirror Resolutions", () => {
  it("has Transform.prototype.changedRange defined on prosemirror-transform", () => {
    expect(typeof Transform.prototype.changedRange).toBe("function");
  });

  it("successfully creates a real BlockNoteEditor instance without runtime errors", () => {
    const editor = BlockNoteEditor.create();
    expect(editor).toBeDefined();
    expect(editor.document).toBeDefined();
    expect(Array.isArray(editor.document)).toBe(true);
    expect(editor.document.length).toBeGreaterThan(0);
  });
});

