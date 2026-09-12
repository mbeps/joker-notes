import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFound } from "@/components/not-found/not-found";
import { ROUTES } from "@/config/routes";

describe("NotFound", () => {
  it("renders with default props", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Go back" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.DOCUMENTS.path);

    const images = screen.getAllByRole("img", { name: "Not found" });
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveClass("dark:hidden");
    expect(images[1]).toHaveClass("hidden", "dark:block");
  });

  it("renders with custom title, description, button, and image alt", () => {
    render(
      <NotFound
        title="Custom Missing Item"
        description="This custom item could not be located."
        buttonText="Return Home"
        buttonHref={ROUTES.HOME.path}
        imageAlt="Custom alt"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Custom Missing Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This custom item could not be located."),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Return Home" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.HOME.path);

    const images = screen.getAllByRole("img", { name: "Custom alt" });
    expect(images).toHaveLength(2);
  });

  it("renders without description when description is omitted or empty", () => {
    render(<NotFound description="" />);

    expect(
      screen.queryByText("The page you are looking for does not exist."),
    ).toBeNull();
  });
});

