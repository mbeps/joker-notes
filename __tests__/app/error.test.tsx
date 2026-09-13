import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RootError from "@/app/error";
import { ROUTES } from "@/config/routes";

describe("RootError", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("renders error state UI with heading, description, retry button, and go back link", () => {
    const resetMock = vi.fn();
    const testError = new Error("Something broke globally");

    render(<RootError error={testError} reset={resetMock} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Something went wrong!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "An unexpected error occurred. Please try again or return to your documents.",
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledTimes(1);

    const backButton = screen.getByRole("button", { name: "Go back" });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", ROUTES.DOCUMENTS.path);
  });
});

