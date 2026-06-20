import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectDetailPage from "./page";

vi.mock("@/modules/proyectos/components/ProjectDetailView", () => ({
  default: ({ projectId }: any) => (
    <div data-testid="project-detail-view" data-project-id={projectId} />
  ),
}));

describe("ProjectDetailPage", () => {
  it("renders ProjectDetailView with projectId from params", async () => {
    const element = await ProjectDetailPage({
      params: Promise.resolve({ id: "proj-99" }),
    });
    render(element);
    expect(screen.getByTestId("project-detail-view")).toBeDefined();
    expect(screen.getByTestId("project-detail-view").getAttribute("data-project-id")).toBe("proj-99");
  });
});
