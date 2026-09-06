import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocumentNotFound from "@/app/(main)/(routes)/documents/[documentId]/not-found";
import { ROUTES } from "@/constants/routes";

describe("DocumentNotFound", () => {
  it("renders document 404 with link to documents using centralised route", () => {
    render(<DocumentNotFound />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Document not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The document you are looking for does not exist or has been deleted.",
      ),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Back to documents" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", ROUTES.DOCUMENTS.path);
  });
});
