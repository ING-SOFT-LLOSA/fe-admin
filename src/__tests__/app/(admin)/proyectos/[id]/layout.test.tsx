import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectWorkspaceLayout from '@/app/(admin)/proyectos/[id]/layout';

vi.mock("@/modules/proyectos/components/ProjectWorkspaceShell", () => ({
  default: ({ projectId, children }: any) => (
    <div data-testid="workspace-shell" data-project-id={projectId}>
      {children}
    </div>
  ),
}));

describe("ProjectWorkspaceLayout", () => {
  it("renders ProjectWorkspaceShell with projectId from params", async () => {
    const element = await ProjectWorkspaceLayout({
      children: <div data-testid="child-content">Child</div>,
      params: Promise.resolve({ id: "proj-42" }),
    });
    render(element);
    expect(screen.getByTestId("workspace-shell")).toBeDefined();
    expect(screen.getByTestId("workspace-shell").getAttribute("data-project-id")).toBe("proj-42");
  });

  it("renders children inside the shell", async () => {
    const element = await ProjectWorkspaceLayout({
      children: <div data-testid="child-content">Child</div>,
      params: Promise.resolve({ id: "1" }),
    });
    render(element);
    expect(screen.getByTestId("child-content")).toBeDefined();
  });
});
