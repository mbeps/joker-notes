import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateDocument = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { firstName: "Bruce" },
  }),
}));

vi.mock("@/hooks/use-document-actions", () => ({
  useDocumentActions: () => ({
    createDocument: mockCreateDocument,
  }),
}));

import DocumentPage from "@/app/(main)/documents/page";

describe("DocumentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome header and create button", () => {
    render(<DocumentPage />);
    expect(
      screen.getByText("Welcome to Bruce's Joker"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create a note/i }),
    ).toBeInTheDocument();
  });

  it("invokes createDocument when button is clicked", () => {
    render(<DocumentPage />);
    fireEvent.click(screen.getByRole("button", { name: /create a note/i }));
    expect(mockCreateDocument).toHaveBeenCalled();
  });
});

