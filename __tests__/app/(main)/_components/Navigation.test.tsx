import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Navigation is deeply coupled to layout refs, media queries, popovers and
// child components. We mock all children and hooks to test its own logic.
const push = vi.fn();
const create = vi.fn();
const searchOnOpen = vi.fn();
const settingsOnOpen = vi.fn();
const mockParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  usePathname: () => "/documents",
  useRouter: () => ({ push }),
}));

vi.mock("convex/react", () => ({
  useMutation: () => create,
}));

vi.mock("usehooks-ts", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/hooks/useSearch", () => ({
  useSearch: () => ({ onOpen: searchOnOpen }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ onOpen: settingsOnOpen }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { fullName: "Test User", imageUrl: "https://example.com" },
  }),
}));

vi.mock("@/app/(main)/_components/UserItem", () => ({
  default: () => <div>user-item</div>,
}));
vi.mock("@/app/(main)/_components/DocumentList", () => ({
  default: () => <div>document-list</div>,
}));
vi.mock("@/app/(main)/_components/Navbar", () => ({
  default: () => <div>navbar</div>,
}));
vi.mock("@/app/(main)/_components/TrashBox", () => ({
  default: () => <div>trash-box</div>,
}));

vi.mock("@/app/(main)/_components/Item", () => ({
  Item: ({
    label,
    onClick,
  }: {
    label: string;
    onClick?: () => void;
    icon?: unknown;
    isSearch?: boolean;
  }) => (
    <div role="button" data-testid={`item-${label}`} onClick={onClick}>
      {label}
    </div>
  ),
}));

import Navigation from "@/app/(main)/_components/Navigation";

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue("new-doc");
  });

  it("renders the sidebar with user item and document list", () => {
    render(<Navigation />);
    expect(screen.getByText("user-item")).toBeInTheDocument();
    expect(screen.getByText("document-list")).toBeInTheDocument();
  });

  it("renders navigation items", () => {
    render(<Navigation />);
    expect(screen.getByTestId("item-Search")).toBeInTheDocument();
    expect(screen.getByTestId("item-Settings")).toBeInTheDocument();
    expect(screen.getByTestId("item-New page")).toBeInTheDocument();
    expect(screen.getByTestId("item-Add a page")).toBeInTheDocument();
    expect(screen.getByTestId("item-Search")).toBeInTheDocument();
  });

  it("opens search via the Search item", () => {
    render(<Navigation />);
    screen.getByTestId("item-Search").click();
    expect(searchOnOpen).toHaveBeenCalledTimes(1);
  });

  it("opens settings via the Settings item", () => {
    render(<Navigation />);
    screen.getByTestId("item-Settings").click();
    expect(settingsOnOpen).toHaveBeenCalledTimes(1);
  });

  it("creates a new page via the New page item", async () => {
    render(<Navigation />);
    screen.getByTestId("item-New page").click();
    await vi.waitFor(() =>
      expect(create).toHaveBeenCalledWith({ title: "Untitled" }),
    );
    expect(push).toHaveBeenCalledWith("/documents/new-doc");
  });

  it("creates a new page via the Add a page item", async () => {
    render(<Navigation />);
    screen.getByTestId("item-Add a page").click();
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/documents/new-doc");
  });

  it("renders the navbar when a document is open", () => {
    mockParams.documentId = "doc1";
    render(<Navigation />);
    expect(screen.getByText("navbar")).toBeInTheDocument();
  });

  it("renders an empty nav when no document is open", () => {
    delete mockParams.documentId;
    render(<Navigation />);
    expect(screen.queryByText("navbar")).not.toBeInTheDocument();
  });
});
