import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const remove = vi.fn();
const restore = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      remove: "remove",
      restore: "restore",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (fn: unknown) => (fn === "restore" ? restore : remove),
}));

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

vi.mock("@/components/Modals/ConfirmModal", () => {
  const Fake = ({
    children,
    onConfirm,
  }: {
    children: React.ReactNode;
    onConfirm: () => void;
  }) => (
    <div>
      <button onClick={onConfirm}>confirm-trigger</button>
      {children}
    </div>
  );
  return { default: Fake };
});

import Banner from "@/app/(main)/_components/Banner";

describe("Banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trash warning", () => {
    render(<Banner documentId="doc1" />);
    expect(screen.getByText("This page is in the Trash.")).toBeInTheDocument();
  });

  it("restores the document when Restore is clicked", () => {
    render(<Banner documentId="doc1" />);
    fireEvent.click(screen.getByRole("button", { name: /restore/i }));
    expect(restore).toHaveBeenCalledWith({ id: "doc1" });
  });

  it("removes the document and navigates away when confirmed", async () => {
    remove.mockResolvedValue(undefined);
    render(<Banner documentId="doc1" />);
    fireEvent.click(screen.getByText("confirm-trigger"));
    await vi.waitFor(() => expect(remove).toHaveBeenCalledWith({ id: "doc1" }));
    expect(push).toHaveBeenCalledWith("/documents");
  });
});
