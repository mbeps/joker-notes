import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const create = vi.fn();
const archive = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Test User" } }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      create: "create",
      archive: "archive",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (fn: unknown) => (fn === "archive" ? archive : create),
}));

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

import { FileIcon } from "lucide-react";
import { Item } from "@/app/(main)/_components/Item";
import { ROUTES } from "@/constants/routes";

const baseProps = { label: "My Doc", icon: FileIcon };

describe("Item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the label", () => {
    render(<Item {...baseProps} />);
    expect(screen.getByText("My Doc")).toBeInTheDocument();
  });

  it("renders the document emoji instead of the fallback icon", () => {
    render(<Item {...baseProps} documentIcon="🚀" />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("highlights the active item", () => {
    const { container } = render(<Item {...baseProps} active />);
    expect(container.firstElementChild?.className).toContain("bg-primary/5");
  });

  it("shows keyboard hints in search mode", () => {
    render(<Item {...baseProps} isSearch />);
    expect(screen.getByText("⌘")).toBeInTheDocument();
    expect(screen.getAllByText("K").length).toBeGreaterThan(0);
  });

  it("does not show action buttons without an id", () => {
    const { container } = render(<Item {...baseProps} />);
    expect(container.querySelector(".ml-auto.flex")).toBeNull();
  });

  it("calls onClick when the row is clicked", () => {
    const onClick = vi.fn();
    render(<Item {...baseProps} id="doc1" onClick={onClick} />);
    fireEvent.click(screen.getByText("My Doc"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("toggles expansion via the chevron without triggering row click", () => {
    const onClick = vi.fn();
    const onExpand = vi.fn();
    const { container } = render(
      <Item {...baseProps} id="doc1" onClick={onClick} onExpand={onExpand} />,
    );
    const chevron = container.querySelector(".lucide-chevron-right")!
      .parentElement!;
    fireEvent.click(chevron);
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("creates a child document, expands and navigates on plus click", async () => {
    create.mockResolvedValue("new-doc");
    const onExpand = vi.fn();
    const { container } = render(
      <Item {...baseProps} id="doc1" onExpand={onExpand} expanded={false} />,
    );
    const plusBtn = container.querySelector(".lucide-plus")!.parentElement!;
    fireEvent.click(plusBtn);
    await vi.waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        title: "Untitled",
        parentDocument: "doc1",
      }),
    );
    expect(onExpand).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail("new-doc"));
  });

  it("does not expand again if already expanded when creating", async () => {
    create.mockResolvedValue("new-doc");
    const onExpand = vi.fn();
    const { container } = render(
      <Item {...baseProps} id="doc1" onExpand={onExpand} expanded={true} />,
    );
    const plusBtn = container.querySelector(".lucide-plus")!.parentElement!;
    fireEvent.click(plusBtn);
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(onExpand).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail("new-doc"));
  });

  it("archives the document via dropdown menu item and navigates away", async () => {
    archive.mockResolvedValue(undefined);
    const { container } = render(<Item {...baseProps} id="doc1" />);
    const dropdownTrigger = container.querySelector(
      '[data-slot="dropdown-menu-trigger"]',
    )!;
    fireEvent.click(dropdownTrigger);
    const deleteItem = await screen.findByText("Delete");
    fireEvent.click(deleteItem);
    await vi.waitFor(() =>
      expect(archive).toHaveBeenCalledWith({ id: "doc1" }),
    );
    expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.path);
  });

  it("shows the last edited user in the dropdown", async () => {
    const { container } = render(<Item {...baseProps} id="doc1" />);
    const dropdownTrigger = container.querySelector(
      '[data-slot="dropdown-menu-trigger"]',
    )!;
    fireEvent.click(dropdownTrigger);
    expect(
      await screen.findByText(/Last edited by: Test User/),
    ).toBeInTheDocument();
  });

  it("renders the skeleton with indentation", () => {
    const { container } = render(<Item.Skeleton level={2} />);
    expect(container.firstElementChild?.getAttribute("style")).toContain(
      "padding-left",
    );
  });
});
