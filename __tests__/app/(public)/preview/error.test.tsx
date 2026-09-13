import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreviewError from "@/app/(public)/preview/[documentId]/error";
import { ROUTES } from "@/config/routes";

describe("PreviewError", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("renders preview error state with retry button and link back to home", () => {
    const resetMock = vi.fn();
    const testError = new Error("Failed to load preview note");

    render(<PreviewError error={testError} reset={resetMock} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Failed to load preview",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An unexpected error occurred while loading this note preview. Please try again or return home.",
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledTimes(1);

    const backButton = screen.getByRole("button", { name: "Back to home" });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", ROUTES.HOME.path);
  });
});

