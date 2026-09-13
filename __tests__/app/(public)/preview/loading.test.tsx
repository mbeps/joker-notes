import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PreviewLoading from "@/app/(public)/preview/[documentId]/loading";

describe("PreviewLoading", () => {
  it("renders the preview document loading skeleton", () => {
    render(<PreviewLoading />);

    expect(screen.getByTestId("document-skeleton")).toBeInTheDocument();
  });
});

