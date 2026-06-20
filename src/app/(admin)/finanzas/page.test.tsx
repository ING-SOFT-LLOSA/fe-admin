import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FinancePage from "./page";

vi.mock("@/modules/finanzas/components/FinancePaymentScheduleView", () => ({
  default: ({ initialProjectId }: any) => (
    <div data-testid="finance-view" data-project-id={initialProjectId} />
  ),
}));

describe("FinancePage", () => {
  it("renders FinancePaymentScheduleView with null when no searchParams", async () => {
    const element = await FinancePage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    const el = screen.getByTestId("finance-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-project-id")).toBeNull();
  });

  it("renders FinancePaymentScheduleView with project from searchParams", async () => {
    const element = await FinancePage({
      searchParams: Promise.resolve({ project: "proj-1" }),
    });
    render(element);
    const el = screen.getByTestId("finance-view");
    expect(el.getAttribute("data-project-id")).toBe("proj-1");
  });
});
