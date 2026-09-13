import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLoading from "@/app/loading";

describe("RootLoading", () => {
  it("renders a full-height centered loading container with spinner", () => {
    const { container } = render(<RootLoading />);

    expect(container.firstChild).toHaveClass(
      "flex",
      "h-full",
      "items-center",
      "justify-center",
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("animate-spin");
  });
});

