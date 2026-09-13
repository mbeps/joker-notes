import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocumentLoading from "@/app/(main)/documents/[documentId]/loading";

describe("DocumentLoading", () => {
  it("renders the document loading skeleton", () => {
    render(<DocumentLoading />);

    expect(screen.getByTestId("document-skeleton")).toBeInTheDocument();
  });
});

