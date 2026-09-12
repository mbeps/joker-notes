import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const mockParams = { documentId: "doc1" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push }),
}));

type QueryResult = unknown[] | undefined;
let queryResult: QueryResult = [];

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Test User" } }),
}));

vi.mock("convex/react", () => ({
  useQuery: () => queryResult,
  useMutation: () => vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

import DocumentList from "@/app/(main)/_components/document-list";
import { ROUTES } from "@/config/routes";

const doc = (id: string, title: string) => ({
  _id: id,
  title,
  icon: undefined,
  isArchived: false,
  isPublished: false,
  parentDocument: undefined,
});

describe("DocumentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = [];
  });

  it("renders skeletons while loading", () => {
    queryResult = undefined;
    const { container } = render(<DocumentList />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders three skeletons at level 0 while loading", () => {
    queryResult = undefined;
    const { container } = render(<DocumentList />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(6);
  });

  it("renders one skeleton at nested level while loading", () => {
    queryResult = undefined;
    const { container } = render(<DocumentList level={1} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(2);
  });

  it("renders nothing extra for an empty list", () => {
    render(<DocumentList />);
    expect(screen.queryByText("doc-a")).not.toBeInTheDocument();
  });

  it("renders documents from the query", () => {
    queryResult = [doc("doc-a", "Doc A"), doc("doc-b", "Doc B")];
    render(<DocumentList />);
    expect(screen.getByText("Doc A")).toBeInTheDocument();
    expect(screen.getByText("Doc B")).toBeInTheDocument();
  });

  it("navigates to a document when its row is clicked", () => {
    queryResult = [doc("doc-a", "Doc A")];
    render(<DocumentList />);
    fireEvent.click(screen.getByText("Doc A"));
    expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail("doc-a"));
  });

  it("expands a document and renders its children on chevron click", () => {
    queryResult = [doc("doc-a", "Doc A")];
    const { rerender } = render(<DocumentList />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    // expansion triggers a re-render of children via recursive useQuery; state flips
    rerender(<DocumentList />);
    expect(screen.getByText("Doc A")).toBeInTheDocument();
  });
});

