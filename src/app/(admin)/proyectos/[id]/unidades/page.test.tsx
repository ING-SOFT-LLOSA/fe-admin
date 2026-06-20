import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectUnitsPage from "./page";

vi.mock("@/modules/inventario/components/UnitsOverviewView", () => ({
  default: ({ projectId }: any) => (
    <div data-testid="units-overview-view" data-project-id={projectId} />
  ),
}));

describe("ProjectUnitsPage", () => {
  it("renders UnitsOverviewView with projectId from params", async () => {
    const element = await ProjectUnitsPage({
      params: Promise.resolve({ id: "proj-units" }),
    });
    render(element);
    const el = screen.getByTestId("units-overview-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-project-id")).toBe("proj-units");
  });
});
