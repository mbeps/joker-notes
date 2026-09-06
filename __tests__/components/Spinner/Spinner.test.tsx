import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from "../../../components/Spinner/Spinner";

describe("Spinner", () => {
  it("renders a loader icon", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.firstChild).toHaveClass("animate-spin");
  });

  it.each(["sm", "lg", "icon"] as const)(
    "applies the %s size variant",
    (size) => {
      const expected = { sm: "h-2 w-2", lg: "h-6 w-6", icon: "h-10 w-10" }[
        size
      ];
      const { container } = render(<Spinner size={size} />);
      expect(container.firstChild).toHaveClass(expected);
    },
  );

  it("defaults to the h-4 w-4 variant", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass("h-4", "w-4");
  });
});
