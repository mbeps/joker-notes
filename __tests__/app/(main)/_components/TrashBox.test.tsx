import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const restore = vi.fn();
const remove = vi.fn();
const mockParams = { documentId: "doc1" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push }),
}));

type QueryResult = Array<{ _id: string; title: string }> | undefined;
let queryResult: QueryResult = [];

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      remove: "remove",
      restore: "restore",
      getTrash: "getTrash",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: () => queryResult,
  useMutation: (fn: unknown) => (fn === "remove" ? remove : restore),
}));

vi.mock("@/components/Modals/ConfirmModal", () => {
  const Fake = ({
    children,
    onConfirm,
  }: {
    children: React.ReactNode;
    onConfirm: () => void;
  }) => (
    <div
      data-testid="confirm-modal"
      onClick={(e) => {
        e.stopPropagation();
        onConfirm();
      }}
    >
      {children}
    </div>
  );
  return { default: Fake };
});

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

import TrashBox from "@/app/(main)/_components/TrashBox";

describe("TrashBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = [];
  });

  it("shows a spinner while loading", () => {
    queryResult = undefined;
    const { container } = render(<TrashBox />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows the empty message when there are no trashed documents", () => {
    render(<TrashBox />);
    expect(screen.getByText("No documents found.")).toBeInTheDocument();
  });

  it("renders trashed documents", () => {
    queryResult = [
      { _id: "doc1", title: "Trashed A" },
      { _id: "doc2", title: "Trashed B" },
    ];
    render(<TrashBox />);
    expect(screen.getByText("Trashed A")).toBeInTheDocument();
    expect(screen.getByText("Trashed B")).toBeInTheDocument();
  });

  it("filters documents by the search input", () => {
    queryResult = [
      { _id: "doc1", title: "Trashed A" },
      { _id: "doc2", title: "Trashed B" },
    ];
    render(<TrashBox />);
    fireEvent.change(screen.getByPlaceholderText(/filter by page title/i), {
      target: { value: "B" },
    });
    expect(screen.getByText("Trashed B")).toBeInTheDocument();
    expect(screen.queryByText("Trashed A")).not.toBeInTheDocument();
  });

  it("navigates to a document on click", () => {
    queryResult = [{ _id: "doc2", title: "Trashed B" }];
    render(<TrashBox />);
    fireEvent.click(screen.getByText("Trashed B"));
    expect(push).toHaveBeenCalledWith("/documents/doc2");
  });

  it("restores a document via the undo button without navigating", () => {
    queryResult = [
      { _id: "doc1", title: "Trashed A" },
      { _id: "doc2", title: "Trashed B" },
    ];
    const { container } = render(<TrashBox />);
    const restoreBtn = container.querySelector(".lucide-undo")!.parentElement!;
    fireEvent.click(restoreBtn);
    expect(restore).toHaveBeenCalledWith({ id: "doc1" });
    expect(push).not.toHaveBeenCalled();
  });

  it("removes a non-active document without redirecting", () => {
    remove.mockResolvedValue(undefined);
    queryResult = [{ _id: "doc9", title: "Other Doc" }];
    const { container } = render(<TrashBox />);
    const deleteBtn = container
      .querySelector(".lucide-trash")!
      .closest('[data-testid="confirm-modal"]')!;
    fireEvent.click(deleteBtn);
    expect(remove).toHaveBeenCalledWith({ id: "doc9" });
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to /documents when removing the active document", async () => {
    remove.mockResolvedValue(undefined);
    queryResult = [{ _id: "doc1", title: "Active Trashed" }];
    const { container } = render(<TrashBox />);
    const deleteBtn = container
      .querySelector(".lucide-trash")!
      .closest('[data-testid="confirm-modal"]')!;
    fireEvent.click(deleteBtn);
    await vi.waitFor(() => expect(remove).toHaveBeenCalledWith({ id: "doc1" }));
    expect(push).toHaveBeenCalledWith("/documents");
  });
});
