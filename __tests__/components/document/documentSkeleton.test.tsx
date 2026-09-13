import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentSkeleton } from "@/components/document/document-skeleton";

describe("DocumentSkeleton", () => {
  it("renders the document skeleton container and skeleton blocks", () => {
    render(<DocumentSkeleton />);

    const container = screen.getByTestId("document-skeleton");
    expect(container).toBeInTheDocument();

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    // 1 cover skeleton + 4 content skeletons = 5 total skeletons
    expect(skeletons.length).toBe(5);
  });
});

