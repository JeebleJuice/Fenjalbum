import { describe, expect, it } from "vitest";
import { explicitDateBounds, parseDateSearch } from "@/lib/date-search";

describe("date search", () => {
  it("parses Danish-style date ranges with non-padded dates", () => {
    const result = parseDateSearch("21/03/2026 - 25/4/2026");
    expect(result?.from.toISOString()).toBe("2026-03-21T00:00:00.000Z");
    expect(result?.to.toISOString()).toBe("2026-04-25T23:59:59.999Z");
  });

  it("treats one date as a complete day and rejects impossible dates", () => {
    const result = parseDateSearch("7/10/2026");
    expect(result?.from.toISOString()).toBe("2026-10-07T00:00:00.000Z");
    expect(result?.to.toISOString()).toBe("2026-10-07T23:59:59.999Z");
    expect(parseDateSearch("31/02/2026")).toBeNull();
  });

  it("builds open-ended explicit bounds", () => {
    expect(explicitDateBounds("2026-03-21", undefined).from?.toISOString()).toBe("2026-03-21T00:00:00.000Z");
    expect(explicitDateBounds(undefined, "2026-03-25").to?.toISOString()).toBe("2026-03-25T23:59:59.999Z");
  });

  it("accepts whole years in the dedicated boundary filters", () => {
    expect(explicitDateBounds("2025", undefined).from?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(explicitDateBounds(undefined, "2025").to?.toISOString()).toBe("2025-12-31T23:59:59.999Z");
  });

  it("treats a year or year range as complete calendar years", () => {
    expect(parseDateSearch("2025")?.from.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(parseDateSearch("2025")?.to.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    expect(parseDateSearch("2024 - 2025")?.to.toISOString()).toBe("2025-12-31T23:59:59.999Z");
  });
});
