import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PreviewNotFound from "@/app/(public)/preview/[documentId]/not-found";
import { ROUTES } from "@/config/routes";

describe("PreviewNotFound", () => {
  it("renders preview 404 with link to home using centralised route", () => {
    render(<PreviewNotFound />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Note not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The note you are looking for does not exist or is no longer published.",
      ),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Back to home" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.HOME.path);
  });
});
