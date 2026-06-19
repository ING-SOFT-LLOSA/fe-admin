/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectWorkspaceShell from "./ProjectWorkspaceShell";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/api/http", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/modules/inventario/services", () => ({
  fetchActivosPorProyecto: vi.fn(),
}));

vi.mock("@/modules/proyectos/components/ProjectSectionNav", () => ({
  default: () => <nav data-testid="section-nav">SectionNav</nav>,
}));

import { apiFetch } from "@/lib/api/http";
import { fetchActivosPorProyecto } from "@/modules/inventario/services";

const mockApiFetch = vi.mocked(apiFetch);
const mockFetchActivos = vi.mocked(fetchActivosPorProyecto);

describe("ProjectWorkspaceShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/proyectos/123");
    mockApiFetch.mockResolvedValue([]);
    mockFetchActivos.mockResolvedValue({ content: [] } as any);
  });

  it("muestra el enlace Volver a proyectos", () => {
    render(
      <ProjectWorkspaceShell projectId="123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );

    expect(screen.getByText("Volver a proyectos")).toBeDefined();
  });

  it("renderiza el ProjectSectionNav", () => {
    render(
      <ProjectWorkspaceShell projectId="123">
        <div>Content</div>
      </ProjectWorkspaceShell>
    );

    expect(screen.getByTestId("section-nav")).toBeDefined();
  });

  it("renderiza los children", () => {
    render(
      <ProjectWorkspaceShell projectId="123">
        <div data-testid="child">Child content</div>
      </ProjectWorkspaceShell>
    );

    expect(screen.getByTestId("child")).toBeDefined();
  });
});
