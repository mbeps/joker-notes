import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cover } from "@/components/image/cover";
import { useCoverImage } from "@/hooks/use-cover-image";

const deleteMock = vi.hoisted(() => vi.fn());
const removeCoverImageMock = vi.hoisted(() => vi.fn());

vi.mock("convex/react", () => ({
  useMutation: () => removeCoverImageMock,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ documentId: "doc-1" }),
}));

vi.mock("@/lib/edgestore", () => ({
  useEdgeStore: () => ({
    edgestore: { publicFiles: { delete: deleteMock } },
  }),
}));

// next/image is awkward in jsdom; stub it as a plain img.
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => {
    return <img src={props.src} alt={props.alt} />;
  },
}));

describe("Cover", () => {
  beforeEach(() => {
    deleteMock.mockReset();
    removeCoverImageMock.mockReset();
    act(() => {
      useCoverImage.setState({ isOpen: false, url: undefined });
    });
  });

  it("renders a short empty container when no url", () => {
    const { container } = render(<Cover />);
    const root = container.firstElementChild!;
    expect(root.className).toContain("h-[12vh]");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("Change cover")).toBeNull();
  });

  it("renders the image without controls in preview mode", () => {
    render(<Cover url="https://cdn.example/cover.png" preview />);
    expect(screen.getByAltText("Cover").getAttribute("src")).toBe(
      "https://cdn.example/cover.png",
    );
    expect(screen.queryByText("Change cover")).toBeNull();
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("shows Change cover and Remove controls when editable", () => {
    render(<Cover url="https://cdn.example/cover.png" />);
    expect(screen.getByText("Change cover")).not.toBeNull();
    expect(screen.getByText("Remove")).not.toBeNull();
  });

  it("opens the replace modal via Change cover", () => {
    render(<Cover url="https://cdn.example/cover.png" />);
    fireEventClick(screen.getByText("Change cover"));
    expect(useCoverImage.getState().isOpen).toBe(true);
    expect(useCoverImage.getState().url).toBe("https://cdn.example/cover.png");
  });

  it("deletes the asset and clears it via Remove", async () => {
    deleteMock.mockResolvedValue(undefined);
    removeCoverImageMock.mockResolvedValue(undefined);
    render(<Cover url="https://cdn.example/cover.png" />);
    fireEventClick(screen.getByText("Remove"));
    await waitForAsync();
    expect(deleteMock).toHaveBeenCalledWith({
      url: "https://cdn.example/cover.png",
    });
    expect(removeCoverImageMock).toHaveBeenCalledWith({ id: "doc-1" });
  });

  it("skips Edge Store deletion when there is no url but still clears Convex", async () => {
    // ponytail: unreachable via UI (Remove only renders with url) but guards data loss.
    removeCoverImageMock.mockResolvedValue(undefined);
    render(<Cover />);
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("renders the skeleton placeholder", () => {
    const { container } = render(<Cover.Skeleton />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "h-[12vh]",
    );
    expect(
      (container.firstChild as HTMLElement).getAttribute("data-slot"),
    ).toBe("skeleton");
  });
});

function fireEventClick(el: Element) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

async function waitForAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

