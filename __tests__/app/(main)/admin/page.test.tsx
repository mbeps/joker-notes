import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseQuery = vi.fn();
const mockArchive = vi.fn();
const mockRestore = vi.fn();
const mockRemove = vi.fn();
const mockToastPromise = vi.fn();
const mockFetch = vi.fn();

let mockIsAdmin: boolean | undefined = true;
let mockAdminData: any = undefined;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("convex/react", () => ({
  useQuery: (queryFn: any, args?: any) => {
    mockUseQuery(queryFn, args);
    if (queryFn?.name === "isAdmin" || queryFn?._def?.name === "isAdmin") {
      return mockIsAdmin;
    }
    if (args === "skip") {
      return undefined;
    }
    return queryFn === "isAdmin" ? mockIsAdmin : mockAdminData;
  },
  useMutation: (mutationRef: unknown) => {
    if (mutationRef === "archive") return mockArchive;
    if (mutationRef === "restore") return mockRestore;
    if (mutationRef === "remove") return mockRemove;
    return vi.fn();
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      isAdmin: "isAdmin",
      getAdminStats: "getAdminStats",
      archive: "archive",
      restore: "restore",
      remove: "remove",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    promise: (...args: unknown[]) => mockToastPromise(...args),
  },
}));

vi.mock("@/components/modal/confirm-modal", () => {
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

vi.mock("@/components/ui/tooltip", () => {
  const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  const TooltipTrigger = ({
    render,
    children,
  }: {
    render?: React.ReactNode;
    children?: React.ReactNode;
  }) => <>{render ?? children}</>;
  const TooltipContent = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  const TooltipPositioner = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  return { Tooltip, TooltipTrigger, TooltipContent, TooltipPositioner };
});

import AdminPage from "@/app/(main)/admin/page";
import { ROUTES } from "@/config/routes";

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin = true;
    mockAdminData = undefined;
    mockFetch.mockResolvedValue({
      json: async () => ({
        author_1: "alpha@example.com",
        author_2: "beta@example.com",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  it("renders skeleton loader and skips getAdminStats while isAdmin is loading", () => {
    mockIsAdmin = undefined;
    mockAdminData = undefined;

    render(<AdminPage />);
    expect(screen.getByTestId("admin-skeleton")).toBeInTheDocument();
    expect(mockUseQuery).toHaveBeenCalledWith("getAdminStats", "skip");
  });

  it("redirects unauthorized users back to /documents and skips getAdminStats when isAdmin is false", () => {
    mockIsAdmin = false;
    mockAdminData = undefined;

    render(<AdminPage />);
    expect(mockUseQuery).toHaveBeenCalledWith("getAdminStats", "skip");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.DOCUMENTS.path);
    expect(screen.queryByTestId("admin-skeleton")).not.toBeInTheDocument();
  });

  it("renders skeleton loader when isAdmin is true but getAdminStats is still loading", () => {
    mockIsAdmin = true;
    mockAdminData = undefined;

    render(<AdminPage />);
    expect(mockUseQuery).toHaveBeenCalledWith("getAdminStats", {});
    expect(screen.getByTestId("admin-skeleton")).toBeInTheDocument();
  });

  describe("when user is administrator and data is loaded", () => {
    beforeEach(() => {
      mockIsAdmin = true;
      mockAdminData = {
        stats: {
          totalDocuments: 3,
          activeDocuments: 2,
          archivedDocuments: 1,
          publishedDocuments: 1,
          authorCount: 2,
        },
        documents: [
          {
            _id: "doc_1",
            title: "Project Alpha",
            userId: "author_1",
            icon: "🚀",
            isArchived: false,
            isPublished: true,
            _creationTime: 1700000000000,
          },
          {
            _id: "doc_2",
            title: "Draft Beta",
            userId: "author_2",
            isArchived: false,
            isPublished: false,
            parentDocument: "doc_1",
            _creationTime: 1700000100000,
          },
          {
            _id: "doc_3",
            title: "",
            userId: "author_1",
            isArchived: true,
            isPublished: false,
            parentDocument: "doc_1",
            _creationTime: 1700000200000,
          },
        ],
      };
    });

    it("renders compact metric cards", () => {
      render(<AdminPage />);

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();

      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      // "Published" also appears as a status badge
      expect(screen.getAllByText("Published").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Authors")).toBeInTheDocument();

      expect(screen.getByTestId("stat-total-documents")).toHaveTextContent("3");
      expect(screen.getByTestId("stat-active-notes")).toHaveTextContent("2");
      expect(screen.getByTestId("stat-published-notes")).toHaveTextContent("1");
      expect(screen.getByTestId("stat-unique-authors")).toHaveTextContent("2");
    });

    it("renders author emails resolved from the users API", async () => {
      render(<AdminPage />);

      expect(await screen.findAllByText("alpha@example.com")).toHaveLength(2);
      expect(screen.getByText("beta@example.com")).toBeInTheDocument();
    });

    it("renders document rows with status badges and subpage counts", async () => {
      render(<AdminPage />);

      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.getByText("🚀")).toBeInTheDocument();
      expect(screen.getByText("Draft Beta")).toBeInTheDocument();
      expect(screen.getAllByText("Published").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Untitled")).toBeInTheDocument();
      expect(screen.getByText("Archived")).toBeInTheDocument();

      // doc_1 has two children (doc_2 and doc_3)
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });

    it("filters documents table by search query", async () => {
      render(<AdminPage />);

      // ensure the email map has resolved before filtering by author
      await screen.findAllByText("alpha@example.com");

      const filterInput = screen.getByPlaceholderText(
        /filter notes by title or author/i,
      );

      fireEvent.change(filterInput, { target: { value: "Alpha" } });
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.queryByText("Draft Beta")).not.toBeInTheDocument();

      fireEvent.change(filterInput, { target: { value: "alpha@" } });
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.queryByText("Draft Beta")).not.toBeInTheDocument();

      fireEvent.change(filterInput, { target: { value: "nonexistent" } });
      expect(
        screen.getByText("No documents match your search."),
      ).toBeInTheDocument();
    });

    it("navigates to document editor when Open note button is clicked", () => {
      render(<AdminPage />);

      const openButtons = screen.getAllByRole("button", {
        name: /open note/i,
      });
      fireEvent.click(openButtons[0]);

      expect(mockPush).toHaveBeenCalledWith(
        ROUTES.DOCUMENTS.detail("doc_1"),
      );
    });

    it("archives an active note and restores an archived note", async () => {
      render(<AdminPage />);

      fireEvent.click(
        screen.getAllByRole("button", { name: /archive/i })[0],
      );
      expect(mockArchive).toHaveBeenCalledWith({ id: "doc_1" });

      fireEvent.click(
        screen.getAllByRole("button", { name: /restore/i })[0],
      );
      expect(mockRestore).toHaveBeenCalledWith({ id: "doc_3" });
    });

    it("deletes a note after confirmation", async () => {
      render(<AdminPage />);

      fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
      fireEvent.click(screen.getAllByTestId("confirm-modal")[0]);

      expect(mockRemove).toHaveBeenCalledWith({ id: "doc_1" });
      expect(mockToastPromise).toHaveBeenCalled();
    });
  });
});
