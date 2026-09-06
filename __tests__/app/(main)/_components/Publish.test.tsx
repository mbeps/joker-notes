import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: () => update,
}));

vi.mock("@/hooks/useOrigin", () => ({
  useOrigin: () => "http://localhost:3000",
}));

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

import Publish from "@/app/(main)/_components/Publish";

const baseDoc = {
  _id: "doc1",
  title: "My Note",
  isPublished: false,
};

describe("Publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(undefined);
  });

  it("renders the publish trigger", () => {
    render(<Publish initialData={baseDoc as never} />);
    expect(
      screen.getByRole("button", { name: /publish/i }),
    ).toBeInTheDocument();
  });

  it("shows the globe icon when published", () => {
    const { container } = render(
      <Publish initialData={{ ...baseDoc, isPublished: true } as never} />,
    );
    expect(container.querySelector(".text-sky-500")).toBeInTheDocument();
  });

  it("opens the popover and publishes an unpublished note", async () => {
    render(<Publish initialData={baseDoc as never} />);
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));
    await screen.findByText("Publish this note");
    const publishButtons = screen.getAllByRole("button", { name: "Publish" });
    fireEvent.click(publishButtons[publishButtons.length - 1]);
    await vi.waitFor(() =>
      expect(update).toHaveBeenCalledWith({ id: "doc1", isPublished: true }),
    );
  });

  it("unpublishes a published note from the popover", async () => {
    render(
      <Publish initialData={{ ...baseDoc, isPublished: true } as never} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));
    fireEvent.click(await screen.findByText("Unpublish"));
    await vi.waitFor(() =>
      expect(update).toHaveBeenCalledWith({ id: "doc1", isPublished: false }),
    );
  });

  it("shows the live indicator for a published note in the popover", async () => {
    render(
      <Publish initialData={{ ...baseDoc, isPublished: true } as never} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));
    expect(
      await screen.findByText(/This note is live on web/),
    ).toBeInTheDocument();
  });

  it("copies the public URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <Publish initialData={{ ...baseDoc, isPublished: true } as never} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));
    const input = await screen.findByDisplayValue(
      "http://localhost:3000/preview/doc1",
    );
    const copyButton = input.parentElement!.querySelector("button")!;
    fireEvent.click(copyButton);
    expect(writeText).toHaveBeenCalledWith(
      "http://localhost:3000/preview/doc1",
    );
  });
});
