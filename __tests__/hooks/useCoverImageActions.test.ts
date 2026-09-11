import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "@/convex/_generated/dataModel";
import { useCoverImageActions } from "@/hooks/useCoverImageActions";

const mockUpload = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockRemoveCoverImage = vi.fn();

vi.mock("@/lib/edgestore", () => ({
  useEdgeStore: () => ({
    edgestore: {
      publicFiles: {
        upload: mockUpload,
        delete: mockDelete,
      },
    },
  }),
}));

vi.mock("convex/react", () => ({
  useMutation: (mutationRef: unknown) => {
    if (mutationRef === "update") return mockUpdate;
    if (mutationRef === "removeCoverImage") return mockRemoveCoverImage;
    return vi.fn();
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      update: "update",
      removeCoverImage: "removeCoverImage",
    },
  },
}));

describe("useCoverImageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadCover", () => {
    it("uploads file without replaceTargetUrl and updates Convex document", async () => {
      const docId = "doc-cover-1" as Id<"documents">;
      const file = new File(["dummy"], "cover.png", { type: "image/png" });
      const uploadedUrl = "https://edgestore.dev/cover.png";

      mockUpload.mockResolvedValueOnce({ url: uploadedUrl });
      mockUpdate.mockResolvedValueOnce({ _id: docId, coverImage: uploadedUrl });

      const { result } = renderHook(() => useCoverImageActions());

      expect(result.current.isSubmitting).toBe(false);

      let url!: string;
      await act(async () => {
        url = await result.current.uploadCover(docId, file);
      });

      expect(url).toBe(uploadedUrl);
      expect(mockUpload).toHaveBeenCalledWith({
        file,
        options: undefined,
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        id: docId,
        coverImage: uploadedUrl,
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it("uploads file with replaceTargetUrl when specified", async () => {
      const docId = "doc-cover-2" as Id<"documents">;
      const file = new File(["dummy2"], "cover2.png", { type: "image/png" });
      const uploadedUrl = "https://edgestore.dev/cover2.png";
      const oldUrl = "https://edgestore.dev/old.png";

      mockUpload.mockResolvedValueOnce({ url: uploadedUrl });
      mockUpdate.mockResolvedValueOnce({ _id: docId, coverImage: uploadedUrl });

      const { result } = renderHook(() => useCoverImageActions());

      let url!: string;
      await act(async () => {
        url = await result.current.uploadCover(docId, file, oldUrl);
      });

      expect(url).toBe(uploadedUrl);
      expect(mockUpload).toHaveBeenCalledWith({
        file,
        options: { replaceTargetUrl: oldUrl },
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it("resets isSubmitting even if upload throws error", async () => {
      const docId = "doc-cover-err" as Id<"documents">;
      const file = new File(["err"], "error.png", { type: "image/png" });

      mockUpload.mockRejectedValueOnce(new Error("Upload failed"));

      const { result } = renderHook(() => useCoverImageActions());

      await act(async () => {
        await expect(result.current.uploadCover(docId, file)).rejects.toThrow(
          "Upload failed",
        );
      });
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("removeCover", () => {
    it("deletes EdgeStore asset when url is provided and removes cover in Convex", async () => {
      const docId = "doc-del-1" as Id<"documents">;
      const url = "https://edgestore.dev/to-delete.png";

      mockDelete.mockResolvedValueOnce({ success: true });
      mockRemoveCoverImage.mockResolvedValueOnce({ _id: docId });

      const { result } = renderHook(() => useCoverImageActions());
      await result.current.removeCover(docId, url);

      expect(mockDelete).toHaveBeenCalledWith({ url });
      expect(mockRemoveCoverImage).toHaveBeenCalledWith({ id: docId });
    });

    it("only clears Convex document when url is not provided", async () => {
      const docId = "doc-del-2" as Id<"documents">;

      mockRemoveCoverImage.mockResolvedValueOnce({ _id: docId });

      const { result } = renderHook(() => useCoverImageActions());
      await result.current.removeCover(docId);

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockRemoveCoverImage).toHaveBeenCalledWith({ id: docId });
    });
  });
});
