import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentError from "@/app/(main)/documents/[documentId]/error";
import { ROUTES } from "@/config/routes";

describe("DocumentError", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("renders document error state with retry button and link back to documents", () => {
    const resetMock = vi.fn();
    const testError = new Error("Failed to load document data");

    render(<DocumentError error={testError} reset={resetMock} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Failed to load document",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An unexpected error occurred while loading this note. Please try again or go back.",
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledTimes(1);

    const backButton = screen.getByRole("button", {
      name: "Back to documents",
    });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", ROUTES.DOCUMENTS.path);
  });
});

