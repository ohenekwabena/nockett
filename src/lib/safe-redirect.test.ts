import { describe, it, expect } from "vitest";
import { safeInternalPath } from "./safe-redirect";

describe("safeInternalPath", () => {
  it("allows same-origin, path-absolute targets", () => {
    expect(safeInternalPath("/tickets?ticket=NCK-2481")).toBe("/tickets?ticket=NCK-2481");
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("/audit#row-5")).toBe("/audit#row-5");
  });

  it("falls back to /dashboard for empty or missing input", () => {
    expect(safeInternalPath(null)).toBe("/dashboard");
    expect(safeInternalPath(undefined)).toBe("/dashboard");
    expect(safeInternalPath("")).toBe("/dashboard");
  });

  it("rejects open-redirect vectors", () => {
    expect(safeInternalPath("//evil.com")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.com")).toBe("/dashboard");
    expect(safeInternalPath("http://evil.com/tickets")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.com")).toBe("/dashboard");
    expect(safeInternalPath("evil.com")).toBe("/dashboard");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects control-character tricks and honors a custom fallback", () => {
    expect(safeInternalPath("/\tevil.com")).toBe("/dashboard");
    expect(safeInternalPath("/\nevil.com")).toBe("/dashboard");
    expect(safeInternalPath("//evil.com", "/home")).toBe("/home");
  });
});
