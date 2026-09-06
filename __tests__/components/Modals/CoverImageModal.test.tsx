import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CoverImageModal from "../../../components/Modals/CoverImageModal";
import { useCoverImage } from "../../../hooks/useCoverImage";

const uploadMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());

vi.mock("convex/react", () => ({
  useMutation: () => updateMock,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ documentId: "doc-1" }),
}));

vi.mock("@/lib/edgestore", () => ({
  useEdgeStore: () => ({
    edgestore: { publicFiles: { upload: uploadMock } },
  }),
}));

describe("CoverImageModal", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    updateMock.mockReset();
    act(() => {
      useCoverImage.setState({ isOpen: false, url: undefined });
    });
  });

  it("renders the dialog when the store is open", () => {
    act(() => {
      useCoverImage.getState().onOpen();
    });
    render(<CoverImageModal />);
    expect(screen.getByText("Cover Image")).not.toBeNull();
    expect(screen.getByText("Click or drag image to upload")).not.toBeNull();
  });

  it("uploads the file and updates the document when a file is chosen", async () => {
    uploadMock.mockResolvedValue({ url: "https://cdn.example/cover.png" });
    updateMock.mockResolvedValue(undefined);
    act(() => {
      useCoverImage.getState().onOpen();
    });
    render(<CoverImageModal />);

    const input = document.querySelector('input[type="file"]')!;
    const file = new File(["data"], "cover.png", { type: "image/png" });
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith(
        expect.objectContaining({ file }),
      );
    });
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({
        id: "doc-1",
        coverImage: "https://cdn.example/cover.png",
      });
    });
    // Modal closes after successful upload.
    expect(useCoverImage.getState().isOpen).toBe(false);
  });

  it("does nothing when onChange receives no file", async () => {
    act(() => {
      useCoverImage.getState().onOpen();
    });
    render(<CoverImageModal />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [] } });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(useCoverImage.getState().isOpen).toBe(true);
  });
});
