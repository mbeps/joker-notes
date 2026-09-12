import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmModal from "@/components/modal/confirm-modal";

describe("ConfirmModal", () => {
  it("opens the dialog when the trigger is clicked", () => {
    render(
      <ConfirmModal onConfirm={vi.fn()}>
        <button>Delete</button>
      </ConfirmModal>,
    );

    expect(screen.queryByText("Are you absolutely sure?")).toBeNull();
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Are you absolutely sure?")).not.toBeNull();
    expect(screen.getByText("This action cannot be undone.")).not.toBeNull();
  });

  it("calls onConfirm when Confirm is pressed", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal onConfirm={onConfirm}>
        <button>Delete</button>
      </ConfirmModal>,
    );

    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when Cancel is pressed", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal onConfirm={onConfirm}>
        <button>Delete</button>
      </ConfirmModal>,
    );

    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

