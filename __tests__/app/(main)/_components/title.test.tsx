import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: () => update,
}));

import { Title } from "@/app/(main)/_components/title";

const baseDoc = {
  _id: "doc1",
  title: "My Note",
  icon: undefined,
};

describe("Title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(undefined);
  });

  it("renders the document title as a button", () => {
    render(<Title initialData={baseDoc as never} />);
    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("renders the document icon when present", () => {
    render(<Title initialData={{ ...baseDoc, icon: "📄" } as never} />);
    expect(screen.getByText("📄")).toBeInTheDocument();
  });

  it("switches to an input on click", () => {
    render(<Title initialData={baseDoc as never} />);
    fireEvent.click(screen.getByText("My Note"));
    expect(screen.getByDisplayValue("My Note")).toBeInTheDocument();
  });

  it("updates the title via Convex on change", async () => {
    render(<Title initialData={baseDoc as never} />);
    fireEvent.click(screen.getByText("My Note"));
    const input = screen.getByDisplayValue("My Note");
    fireEvent.change(input, { target: { value: "Renamed" } });
    expect(update).toHaveBeenCalledWith({ id: "doc1", title: "Renamed" });
  });

  it("falls back to Untitled when the input is cleared", () => {
    render(<Title initialData={baseDoc as never} />);
    fireEvent.click(screen.getByText("My Note"));
    const input = screen.getByDisplayValue("My Note");
    fireEvent.change(input, { target: { value: "" } });
    expect(update).toHaveBeenCalledWith({ id: "doc1", title: "Untitled" });
  });

  it("closes the editor on Enter without saving again", () => {
    render(<Title initialData={baseDoc as never} />);
    fireEvent.click(screen.getByText("My Note"));
    const input = screen.getByDisplayValue("My Note");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByDisplayValue("My Note")).not.toBeInTheDocument();
    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("closes the editor on blur", () => {
    render(<Title initialData={baseDoc as never} />);
    fireEvent.click(screen.getByText("My Note"));
    const input = screen.getByDisplayValue("My Note");
    fireEvent.blur(input);
    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("renders the skeleton", () => {
    const { container } = render(<Title.Skeleton />);
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });
});

