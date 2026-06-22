import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectPaymentScheduleView from '@/modules/finanzas/components/ProjectPaymentScheduleView';

vi.mock("@/modules/finanzas/components/FinancePaymentScheduleView", () => ({
  default: () => <div data-testid="finance-view">Finance View</div>,
}));

describe("ProjectPaymentScheduleView", () => {
  it("renderiza FinancePaymentScheduleView con projectId", () => {
    render(<ProjectPaymentScheduleView projectId="p-123" />);
    expect(screen.getByTestId("finance-view")).toBeDefined();
  });
});
