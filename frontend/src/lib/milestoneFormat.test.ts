import { describe, it, expect } from "vitest";
import { formatTimeRemainingDays } from "./milestoneFormat";

describe("formatTimeRemainingDays", () => {
  it("handles complete", () => {
    expect(formatTimeRemainingDays(0)).toBe("Plan complete");
  });
  it("handles singular day", () => {
    expect(formatTimeRemainingDays(1)).toBe("1 day");
  });
  it("handles plural", () => {
    expect(formatTimeRemainingDays(42)).toBe("42 days");
  });
  it("handles missing", () => {
    expect(formatTimeRemainingDays(null)).toBe("—");
  });
});
