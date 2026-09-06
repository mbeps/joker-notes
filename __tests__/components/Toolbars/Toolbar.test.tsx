import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Toolbar from "../../../components/Toolbars/Toolbar";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useCoverImage } from "../../../hooks/useCoverImage";

const updateMock = vi.hoisted(() => vi.fn());
const removeIconMock = vi.hoisted(() => vi.fn());

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      update: "update",
      removeIcon: "removeIcon",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (fn: unknown) => {
    return fn === "removeIcon" ? removeIconMock : updateMock;
  },
}));

vi.mock("../../../components/Icon/IconPicker", () => ({
  default: ({
    children,
    onChange,
    asChild,
  }: {
    children: React.ReactNode;
    onChange: (icon: string) => void;
    asChild?: boolean;
  }) => (
    <span
      data-testid="icon-picker"
      data-as-child={asChild ? "true" : "false"}
      onClick={() => onChange("😀")}
    >
      {children}
    </span>
  ),
}));

const makeDoc = (overrides: Partial<Doc<"documents">> = {}): Doc<"documents"> =>
  ({
    _id: "doc-1",
    title: "My Note",
    userId: "user-1",
    isArchived: false,
    isPublished: false,
    ...overrides,
  }) as Doc<"documents">;

describe("Toolbar", () => {
  beforeEach(() => {
    updateMock.mockReset();
    removeIconMock.mockReset();
    act(() => {
      useCoverImage.setState({ isOpen: false, url: undefined });
    });
  });

  it("renders the title in read mode by default", () => {
    render(<Toolbar initialData={makeDoc()} />);
    expect(screen.getByText("My Note")).not.toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows Add icon and Add cover buttons when no icon or cover exists", () => {
    render(<Toolbar initialData={makeDoc()} />);
    expect(screen.getByText("Add icon")).not.toBeNull();
    expect(screen.getByText("Add cover")).not.toBeNull();
  });

  it("opens the cover image modal via Add cover", () => {
    render(<Toolbar initialData={makeDoc()} />);
    fireEvent.click(screen.getByText("Add cover"));
    expect(useCoverImage.getState().isOpen).toBe(true);
  });

  it("hides add controls when an icon already exists", () => {
    render(<Toolbar initialData={makeDoc({ icon: "😀" })} />);
    expect(screen.getByText("😀")).not.toBeNull();
    expect(screen.queryByText("Add icon")).toBeNull();
  });

  it("persists a selected emoji via the update mutation", () => {
    render(<Toolbar initialData={makeDoc({ icon: "😀" })} />);
    fireEvent.click(screen.getByTestId("icon-picker"));
    expect(updateMock).toHaveBeenCalledWith({ id: "doc-1", icon: "😀" });
  });

  it("removes the icon via the X button", () => {
    render(<Toolbar initialData={makeDoc({ icon: "😀" })} />);
    const removeBtn = screen
      .getByTestId("icon-picker")
      .parentElement!.querySelector("button")!;
    fireEvent.click(removeBtn);
    expect(removeIconMock).toHaveBeenCalledWith({ id: "doc-1" });
  });

  it("enters edit mode on click and persists typed title", () => {
    render(<Toolbar initialData={makeDoc()} />);
    fireEvent.click(screen.getByText("My Note"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("My Note");
    fireEvent.change(textarea, { target: { value: "Renamed" } });
    expect(updateMock).toHaveBeenCalledWith({
      id: "doc-1",
      title: "Renamed",
    });
  });

  it("falls back to Untitled when the title is cleared", () => {
    render(<Toolbar initialData={makeDoc()} />);
    fireEvent.click(screen.getByText("My Note"));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "" } });
    expect(updateMock).toHaveBeenCalledWith({
      id: "doc-1",
      title: "Untitled",
    });
  });

  it("exits edit mode on Enter without a newline", () => {
    render(<Toolbar initialData={makeDoc()} />);
    fireEvent.click(screen.getByText("My Note"));
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("exits edit mode on blur", () => {
    render(<Toolbar initialData={makeDoc()} />);
    fireEvent.click(screen.getByText("My Note"));
    const textarea = screen.getByRole("textbox");
    fireEvent.blur(textarea);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("does not allow editing in preview mode", () => {
    render(<Toolbar initialData={makeDoc({ icon: "😀" })} preview />);
    expect(screen.getByText("😀")).not.toBeNull();
    expect(screen.queryByText("Add cover")).toBeNull();
    fireEvent.click(screen.getByText("My Note"));
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
