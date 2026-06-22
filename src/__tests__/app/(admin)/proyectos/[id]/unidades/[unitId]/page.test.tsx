import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectUnitDetailPage from '@/app/(admin)/proyectos/[id]/unidades/[unitId]/page';

vi.mock("@/modules/inventario/components/UnitDetailView", () => ({
  default: ({ projectId, unitId }: any) => (
    <div data-testid="unit-detail-view" data-project-id={projectId} data-unit-id={unitId} />
  ),
}));

describe("ProjectUnitDetailPage", () => {
  it("renders UnitDetailView with projectId and unitId from params", async () => {
    const element = await ProjectUnitDetailPage({
      params: Promise.resolve({ id: "proj-1", unitId: "unit-55" }),
    });
    render(element);
    const el = screen.getByTestId("unit-detail-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-project-id")).toBe("proj-1");
    expect(el.getAttribute("data-unit-id")).toBe("unit-55");
  });
});
