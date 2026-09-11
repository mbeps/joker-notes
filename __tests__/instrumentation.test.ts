import { describe, expect, it, vi } from "vitest";
import { register } from "../instrumentation";
import * as logger from "../lib/logger";

describe("instrumentation", () => {
  it("calls configureLoggingSync when NEXT_RUNTIME is nodejs", async () => {
    const spy = vi.spyOn(logger, "configureLoggingSync").mockImplementation(() => {});
    const prevRuntime = process.env.NEXT_RUNTIME;

    try {
      process.env.NEXT_RUNTIME = "nodejs";
      await register();
      expect(spy).toHaveBeenCalled();
    } finally {
      process.env.NEXT_RUNTIME = prevRuntime;
      spy.mockRestore();
    }
  });

  it("does not call configureLoggingSync when NEXT_RUNTIME is not nodejs", async () => {
    const spy = vi.spyOn(logger, "configureLoggingSync").mockImplementation(() => {});
    const prevRuntime = process.env.NEXT_RUNTIME;

    try {
      process.env.NEXT_RUNTIME = "edge";
      await register();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      process.env.NEXT_RUNTIME = prevRuntime;
      spy.mockRestore();
    }
  });
});

