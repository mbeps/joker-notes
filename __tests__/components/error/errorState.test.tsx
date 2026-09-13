import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorState } from "@/components/error/error-state";
import { ROUTES } from "@/config/routes";

describe("ErrorState", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("renders with default props", () => {
    render(<ErrorState />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Something went wrong!" }),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Go back" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.DOCUMENTS.path);

    const images = screen.getAllByRole("img", { name: "Error" });
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveClass("dark:hidden");
    expect(images[1]).toHaveClass("hidden", "dark:block");
  });

  it("renders custom title, description, button text, href, and image alt", () => {
    render(
      <ErrorState
        title="Custom Error Title"
        description="Detailed description of the issue."
        buttonText="Return Home"
        buttonHref={ROUTES.HOME.path}
        imageAlt="Custom error illustration"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Custom Error Title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Detailed description of the issue."),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Return Home" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.HOME.path);

    const images = screen.getAllByRole("img", {
      name: "Custom error illustration",
    });
    expect(images).toHaveLength(2);
  });

  it("renders retry button and triggers reset callback on click", () => {
    const resetMock = vi.fn();
    render(<ErrorState reset={resetMock} retryText="Try once more" />);

    const retryButton = screen.getByRole("button", { name: "Try once more" });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("logs error to console when error prop is provided", () => {
    const testError = new Error("Test runtime failure");
    render(<ErrorState error={testError} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Application error:",
      testError,
    );
  });

  it("does not log to console when error prop is omitted", () => {
    render(<ErrorState />);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

