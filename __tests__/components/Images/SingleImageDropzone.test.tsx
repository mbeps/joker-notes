import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SingleImageDropzone } from "../../../components/Images/SingleImageDropzone";

describe("SingleImageDropzone", () => {
  it("shows the upload prompt when no value is set", () => {
    render(<SingleImageDropzone />);
    expect(screen.getByText("Click or drag image to upload")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("previews a string url value", () => {
    render(<SingleImageDropzone value="https://cdn.example/pic.png" />);
    const img = document.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://cdn.example/pic.png");
    expect(screen.queryByText("Click or drag image to upload")).toBeNull();
  });

  it("previews a File value via object URL", () => {
    const file = new File(["x"], "pic.png", { type: "image/png" });
    const urlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:preview-url");
    render(<SingleImageDropzone value={file} />);
    expect(document.querySelector("img").getAttribute("src")).toBe(
      "blob:preview-url",
    );
    expect(urlSpy).toHaveBeenCalledWith(file);
    urlSpy.mockRestore();
  });

  it("calls onChange with undefined when the dismiss icon is clicked", () => {
    const onChange = vi.fn();
    render(
      <SingleImageDropzone
        value="https://cdn.example/pic.png"
        onChange={onChange}
      />,
    );
    // The dismiss control is the clickable wrapper around the X icon.
    const dismiss = document.querySelector(".group.absolute")!;
    dismiss.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("renders a spinner overlay when disabled", () => {
    const { container } = render(<SingleImageDropzone disabled />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("does not render the spinner overlay when enabled", () => {
    const { container } = render(<SingleImageDropzone />);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("exposes a file input", () => {
    render(<SingleImageDropzone />);
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("forwards a ref to the file input", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<SingleImageDropzone ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current instanceof HTMLInputElement).toBe(true);
  });
});
