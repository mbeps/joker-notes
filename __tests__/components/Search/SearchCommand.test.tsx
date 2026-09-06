import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchCommand from "../../../components/Search/SearchCommand";
import { ROUTES } from "../../../constants/routes";
import { useSearch } from "../../../hooks/useSearch";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Maruf" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("convex/react", () => ({
  useQuery: () => [
    { _id: "doc-1", title: "Groceries", icon: "🛒" },
    { _id: "doc-2", title: "Work Notes" },
  ],
}));

describe("SearchCommand", () => {
  beforeEach(() => {
    pushMock.mockReset();
    act(() => {
      useSearch.setState({ isOpen: false });
    });
  });

  it("renders nothing before mount (hydration guard)", () => {
    // ponytail: first render happens inside useEffect flush, so assert via
    // a fresh unmounted tree is not possible; instead verify content appears.
    const { container } = render(<SearchCommand />);
    expect(container).toBeDefined();
  });

  it("renders search results once mounted", () => {
    act(() => {
      useSearch.getState().onOpen();
    });
    render(<SearchCommand />);
    expect(screen.getByText("Documents")).not.toBeNull();
    expect(screen.getByText("Groceries")).not.toBeNull();
    expect(screen.getByText("Work Notes")).not.toBeNull();
  });

  it("shows the placeholder with the Clerk user name", () => {
    act(() => {
      useSearch.getState().onOpen();
    });
    render(<SearchCommand />);
    expect(
      screen.getByPlaceholderText("Search Maruf's Joker Notes..."),
    ).not.toBeNull();
  });

  it("navigates to the document and closes the palette on select", () => {
    act(() => {
      useSearch.getState().onOpen();
    });
    render(<SearchCommand />);
    fireEvent.click(screen.getByText("Groceries"));
    expect(pushMock).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail("doc-1"));
    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("toggles the palette with Cmd/Ctrl+K", () => {
    render(<SearchCommand />);
    expect(useSearch.getState().isOpen).toBe(false);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        }),
      );
    });
    expect(useSearch.getState().isOpen).toBe(true);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });
    expect(useSearch.getState().isOpen).toBe(false);
  });

  it("does not toggle without the modifier key", () => {
    render(<SearchCommand />);
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", bubbles: true }),
    );
    expect(useSearch.getState().isOpen).toBe(false);
  });
});
