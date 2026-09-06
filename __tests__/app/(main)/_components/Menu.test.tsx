import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const archive = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Test User" } }),
}));

vi.mock("convex/react", () => ({
  useMutation: () => archive,
}));

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

import { Menu } from "@/app/(main)/_components/Menu";

describe("Menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger button", () => {
    const { container } = render(<Menu documentId="doc1" />);
    expect(container.querySelector("button")).toBeInTheDocument();
  });

  it("archives the document and navigates away on Delete click", async () => {
    archive.mockResolvedValue(undefined);
    const { container } = render(<Menu documentId="doc1" />);
    const trigger =
      container.querySelector('[data-slot="dropdown-menu-trigger"]') ||
      screen.getByRole("button");
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Delete"));
    await vi.waitFor(() =>
      expect(archive).toHaveBeenCalledWith({ id: "doc1" }),
    );
    expect(push).toHaveBeenCalledWith("/documents");
  });

  it("shows the last edited user in the dropdown", async () => {
    render(<Menu documentId="doc1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/Last edited by: Test User/),
    ).toBeInTheDocument();
  });

  it("renders the skeleton", () => {
    const { container } = render(<Menu.Skeleton />);
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });
});
