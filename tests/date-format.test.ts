import { describe, expect, it } from "vitest";
import { formatCaptureDate, formatDisplayDate, formatDisplayDateTime } from "@/lib/date-format";

describe("display date formatting", () => {
  it("uses an unambiguous day/month/year format", () => {
    const date = new Date(2026, 7, 21, 14, 5);
    expect(formatDisplayDate(date)).toBe("21/08/2026");
    expect(formatDisplayDateTime(date)).toBe("21/08/2026 14:05");
  });

  it("handles invalid values safely", () => {
    expect(formatDisplayDate("not-a-date")).toBe("Unknown");
    expect(formatDisplayDateTime("not-a-date")).toBe("Unknown");
  });

  it("does not present the upload date as a missing capture date", () => {
    expect(formatCaptureDate(null)).toBe("Capture date unknown");
    expect(formatCaptureDate("2026-08-21T12:00:00.000Z")).toBe("21/08/2026");
  });
});
