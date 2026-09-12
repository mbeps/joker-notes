import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockParams = { documentId: "doc1" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Test User" } }),
}));

type DocResult = Record<string, unknown> | null | undefined;
let docResult: DocResult;

vi.mock("convex/react", () => ({
  useQuery: () => docResult,
  useMutation: () => vi.fn(),
}));

vi.mock("@/app/(main)/_components/title", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/(main)/_components/title")>();
  const MockTitle = ({ initialData }: { initialData: { title?: string } }) => (
    <div>title:{initialData.title}</div>
  );
  MockTitle.Skeleton = actual.Title.Skeleton;
  return {
    ...actual,
    Title: MockTitle,
  };
});

vi.mock("@/app/(main)/_components/banner", () => ({
  default: ({ documentId }: { documentId: string }) => (
    <div>banner:{documentId}</div>
  ),
}));

vi.mock("@/app/(main)/_components/menu", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/(main)/_components/menu")>();
  const MockMenu = ({ documentId }: { documentId: string }) => (
    <div>menu:{documentId}</div>
  );
  MockMenu.Skeleton = actual.Menu.Skeleton;
  return {
    ...actual,
    Menu: MockMenu,
  };
});

vi.mock("@/app/(main)/_components/publish", () => ({
  default: ({ initialData }: { initialData: { _id: string } }) => (
    <div>publish:{initialData._id}</div>
  ),
}));

import Navbar from "@/app/(main)/_components/navbar";

const document = {
  _id: "doc1",
  title: "My Note",
  icon: "📄",
  isArchived: false,
  isPublished: false,
};

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docResult = undefined;
  });

  it("renders skeletons while loading", () => {
    const { container } = render(
      <Navbar isCollapsed={false} onResetWidth={() => {}} />,
    );
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders nothing when the document does not exist", () => {
    docResult = null;
    const { container } = render(
      <Navbar isCollapsed={false} onResetWidth={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, publish and menu for a loaded document", () => {
    docResult = document;
    render(<Navbar isCollapsed={false} onResetWidth={() => {}} />);
    expect(screen.getByText("title:My Note")).toBeInTheDocument();
    expect(screen.getByText("publish:doc1")).toBeInTheDocument();
    expect(screen.getByText("menu:doc1")).toBeInTheDocument();
  });

  it("does not show the banner for an active document", () => {
    docResult = document;
    render(<Navbar isCollapsed={false} onResetWidth={() => {}} />);
    expect(screen.queryByText(/banner:/)).not.toBeInTheDocument();
  });

  it("shows the banner for an archived document", () => {
    docResult = { ...document, isArchived: true };
    render(<Navbar isCollapsed={false} onResetWidth={() => {}} />);
    expect(screen.getByText("banner:doc1")).toBeInTheDocument();
  });

  it("hides the expand menu icon when sidebar is expanded", () => {
    docResult = document;
    const { container } = render(
      <Navbar isCollapsed={false} onResetWidth={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: "" })).toBeNull();
    void container;
  });

  it("calls onResetWidth when the collapsed menu icon is clicked", () => {
    docResult = document;
    const onResetWidth = vi.fn();
    render(<Navbar isCollapsed={true} onResetWidth={onResetWidth} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onResetWidth).toHaveBeenCalledTimes(1);
  });
});

