import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootNotFound from "@/app/not-found";
import { ROUTES } from "@/config/routes";

describe("RootNotFound", () => {
  it("renders global 404 with link to documents using centralised route", () => {
    render(<RootNotFound />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Go back" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.DOCUMENTS.path);
  });
});
