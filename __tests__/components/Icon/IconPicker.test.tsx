import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IconPicker from "../../../components/Icon/IconPicker";
import { useCoverImage } from "../../../hooks/useCoverImage";

const onEmojiClick = vi.fn();

vi.mock("emoji-picker-react", () => ({
  default: (props: { onEmojiClick: (data: { emoji: string }) => void }) => {
    onEmojiClick.current = props.onEmojiClick;
    return <div data-testid="emoji-picker" />;
  },
  Theme: { DARK: "dark", LIGHT: "light" },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

describe("IconPicker", () => {
  beforeEach(() => {
    act(() => {
      useCoverImage.setState({ isOpen: false, url: undefined });
    });
  });

  it("renders the trigger children and hides the picker until opened", () => {
    render(
      <IconPicker onChange={vi.fn()}>
        <button>Add icon</button>
      </IconPicker>,
    );
    expect(screen.getByText("Add icon")).not.toBeNull();
    expect(screen.queryByTestId("emoji-picker")).toBeNull();
  });

  it("shows the emoji picker when the trigger is clicked and emits selection", () => {
    const onChange = vi.fn();
    render(
      <IconPicker onChange={onChange}>
        <button>Add icon</button>
      </IconPicker>,
    );

    fireEvent.click(screen.getByText("Add icon"));
    expect(screen.getByTestId("emoji-picker")).not.toBeNull();

    // Simulate an emoji click through the captured callback.
    onEmojiClick.current({ emoji: "🎉" });
    expect(onChange).toHaveBeenCalledWith("🎉");
  });
});
