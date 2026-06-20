import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ExpedienteDetailRoute from "./page";

vi.mock("@/modules/legal/components/ExpedienteDetailView", () => ({
  default: ({ uuidUsuarioActivo }: any) => (
    <div data-testid="expediente-detail-view" data-uuid={uuidUsuarioActivo} />
  ),
}));

describe("ExpedienteDetailRoute", () => {
  it("renders ExpedienteDetailView with uuid from params", async () => {
    const element = await ExpedienteDetailRoute({
      params: Promise.resolve({ uuidUsuarioActivo: "abc-123" }),
    });
    render(element);
    const el = screen.getByTestId("expediente-detail-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-uuid")).toBe("abc-123");
  });
});
