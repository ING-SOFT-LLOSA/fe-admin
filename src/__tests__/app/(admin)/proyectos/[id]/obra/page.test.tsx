import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectObraPage from '@/app/(admin)/proyectos/[id]/obra/page';

vi.mock("@/modules/obra/components/ConstructionProgressView", () => ({
  default: ({ projectId, context }: any) => (
    <div data-testid="construction-progress-view" data-project-id={projectId} data-context={context} />
  ),
}));

describe("ProjectObraPage", () => {
  it("renders ConstructionProgressView with projectId and context='project'", async () => {
    const element = await ProjectObraPage({
      params: Promise.resolve({ id: "obra-1" }),
    });
    render(element);
    const el = screen.getByTestId("construction-progress-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-project-id")).toBe("obra-1");
    expect(el.getAttribute("data-context")).toBe("project");
  });
});
