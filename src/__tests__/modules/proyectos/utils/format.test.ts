import { describe, it, expect } from "vitest";
import { formatProjectDate } from '@/modules/proyectos/utils/format';

describe("formatProjectDate", () => {
  it("should return '-' for null or undefined date", () => {
    expect(formatProjectDate(null)).toBe("-");
    expect(formatProjectDate(undefined)).toBe("-");
    expect(formatProjectDate("")).toBe("-");
  });

  it("should return '-' for an invalid date string", () => {
    expect(formatProjectDate("invalid-date-string")).toBe("-");
  });

  it("should format a valid date string correctly", () => {
    // 2026-06-13 -> 13 jun. 2026 (or similar in es-PE locale)
    const formatted = formatProjectDate("2026-06-13T12:00:00Z");
    expect(formatted).toContain("13");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/13\s+(?:jun\.?|de\s+junio)\s+2026/i);
  });

  it("should format a valid Date object correctly", () => {
    const date = new Date(2026, 5, 13); // June 13, 2026
    const formatted = formatProjectDate(date);
    expect(formatted).toContain("13");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/13\s+(?:jun\.?|de\s+junio)\s+2026/i);
  });
});
