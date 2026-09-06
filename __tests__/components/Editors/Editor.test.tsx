import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Editor from "../../../components/Editors/Editor";

const onChangeViewMock = vi.hoisted(() => vi.fn());
const useCreateBlockNote = vi.hoisted(() => vi.fn());

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

vi.mock("@/lib/edgestore", () => ({
  useEdgeStore: () => ({
    edgestore: {
      publicFiles: { upload: vi.fn().mockResolvedValue({ url: "u" }) },
    },
  }),
}));

vi.mock("@blocknote/core", () => ({
  BlockNoteEditor: {},
}));

vi.mock("@blocknote/react", () => ({
  useCreateBlockNote,
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: (props: {
    editor: unknown;
    editable?: boolean;
    theme?: string;
    onChange?: () => void;
  }) => {
    onChangeViewMock.current = props;
    return (
      <div
        data-testid="blocknote-view"
        data-theme={props.theme}
        data-editable={String(props.editable)}
      />
    );
  },
}));

describe("Editor", () => {
  beforeEach(() => {
    useCreateBlockNote.mockReset();
    onChangeViewMock.current = undefined;
  });

  it("creates the editor without initial content by default", () => {
    render(<Editor onChange={vi.fn()} />);
    expect(useCreateBlockNote).toHaveBeenCalledWith(
      expect.objectContaining({ initialContent: undefined }),
    );
  });

  it("parses initialContent into blocks", () => {
    const blocks = [
      { type: "paragraph", content: [{ type: "text", text: "hi" }] },
    ];
    render(
      <Editor onChange={vi.fn()} initialContent={JSON.stringify(blocks)} />,
    );
    expect(useCreateBlockNote).toHaveBeenCalledWith(
      expect.objectContaining({ initialContent: blocks }),
    );
  });

  it("passes the dark theme and editability to BlockNoteView", () => {
    render(<Editor onChange={vi.fn()} />);
    const view = screen.getByTestId("blocknote-view");
    expect(view.getAttribute("data-theme")).toBe("dark");
    expect(view.getAttribute("data-editable")).toBe("undefined");
  });

  it("renders read-only when editable is false", () => {
    render(<Editor onChange={vi.fn()} editable={false} />);
    expect(
      screen.getByTestId("blocknote-view").getAttribute("data-editable"),
    ).toBe("false");
  });
});
