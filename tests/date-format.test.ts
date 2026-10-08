import { describe, expect, it } from "vitest";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-format";

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
});
