/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProjectWorkspaceShell from '@/modules/proyectos/components/ProjectWorkspaceShell';
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
  fetchAllActivosPorProyecto: vi.fn(),
}));

vi.mock("@/modules/proyectos/components/ProjectSectionNav", () => ({
  default: () => <nav data-testid="section-nav">SectionNav</nav>,
}));

vi.mock("@/modules/proyectos/utils/format", () => ({
  formatProjectDate: vi.fn(() => "01 ene. 2026"),
}));

import { apiFetch } from "@/lib/api/http";
import { fetchAllActivosPorProyecto } from "@/modules/inventario/services";

const mockApiFetch = vi.mocked(apiFetch);
const mockFetchAllActivos = vi.mocked(fetchAllActivosPorProyecto);

const mockProject = {
  id: "p-123",
  nombre: "Las Lomas",
  distrito: "Miraflores",
  direccion: "Av. Principal 123",
  fechaInicio: "2026-01-01",
};

const mockUnits = [
  { estadoComercial: "DISPONIBLE" },
  { estadoComercial: "DISPONIBLE" },
  { estadoComercial: "SEPARADO" },
  { estadoComercial: "VENDIDO" },
  { estadoComercial: "EN_CONTRATO" },
] as any;

describe("ProjectWorkspaceShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/proyectos/p-123");
  });

  it("renders loading skeleton while fetching project", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    expect(document.querySelector(".skeleton")).toBeTruthy();
  });

  it('shows "Proyecto no encontrado" when project does not exist', async () => {
    mockApiFetch.mockResolvedValue([]);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Proyecto no encontrado")).toBeDefined();
    });
    expect(screen.getByText("Detalle del proyecto")).toBeDefined();
  });

  it("renders project name and details when project is found", async () => {
    mockApiFetch.mockResolvedValue([mockProject]);
    mockFetchAllActivos.mockResolvedValue(mockUnits);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Las Lomas")).toBeDefined();
    });
    expect(screen.getByText("Detalle del proyecto")).toBeDefined();
    expect(screen.getByText(/Av\. Principal 123/)).toBeDefined();
    expect(screen.getByText(/Inicio 01 ene\. 2026/)).toBeDefined();
  });

  it("displays correct unit counts: Unidades, Disponibles, Separadas, Vendidas", async () => {
    mockApiFetch.mockResolvedValue([mockProject]);
    mockFetchAllActivos.mockResolvedValue(mockUnits);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Las Lomas")).toBeDefined();
    });

    expect(screen.getByText("Unidades").nextElementSibling?.textContent).toBe("5");
    expect(screen.getByText("Disponibles").nextElementSibling?.textContent).toBe("2");
    expect(screen.getByText("Separadas").nextElementSibling?.textContent).toBe("1");
    expect(screen.getByText("Vendidas").nextElementSibling?.textContent).toBe("2");
  });

  it('shows "Dirección no registrada" when direction is missing', async () => {
    mockApiFetch.mockResolvedValue([
      { id: "p-123", nombre: "Test Project", fechaInicio: "2026-01-01" },
    ]);
    mockFetchAllActivos.mockResolvedValue([] as any);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeDefined();
    });
    expect(screen.getByText(/Dirección no registrada/)).toBeDefined();
  });

  it("shows zero units when fetchActivosPorProyecto fails gracefully", async () => {
    mockApiFetch.mockResolvedValue([mockProject]);
    mockFetchAllActivos.mockRejectedValue(new Error("Fetch error"));
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Las Lomas")).toBeDefined();
    });
    expect(screen.getByText("Unidades").nextElementSibling?.textContent).toBe("0");
  });

  it('renders "Volver a proyectos" link with href /proyectos', () => {
    mockApiFetch.mockResolvedValue([]);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    const link = screen.getByText("Volver a proyectos").closest("a");
    expect(link).toBeDefined();
    expect(link?.getAttribute("href")).toBe("/proyectos");
  });

  it("renders ProjectSectionNav", () => {
    mockApiFetch.mockResolvedValue([]);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    expect(screen.getByTestId("section-nav")).toBeDefined();
  });

  it("renders children", () => {
    mockApiFetch.mockResolvedValue([]);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Child content</div>
      </ProjectWorkspaceShell>
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("finds correct project among multiple projects in the list", async () => {
    mockApiFetch.mockResolvedValue([
      { id: "a", nombre: "Alpha" },
      { id: "b", nombre: "Beta" },
      { id: "target", nombre: "Target Project", direccion: "Target Address", fechaInicio: "2026-03-01" },
    ]);
    mockFetchAllActivos.mockResolvedValue([] as any);
    render(
      <ProjectWorkspaceShell projectId="target">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Target Project")).toBeDefined();
    });
  });

  it("counts EN_CONTRATO units as Vendidas", async () => {
    mockApiFetch.mockResolvedValue([mockProject]);
    mockFetchAllActivos.mockResolvedValue([
      { estadoComercial: "VENDIDO" },
      { estadoComercial: "EN_CONTRATO" },
      { estadoComercial: "EN_CONTRATO" },
    ] as any);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Las Lomas")).toBeDefined();
    });
    expect(screen.getByText("Unidades").nextElementSibling?.textContent).toBe("3");
    expect(screen.getByText("Vendidas").nextElementSibling?.textContent).toBe("3");
  });

  it("uses createdAt as fallback startDate when fechaInicio is missing", async () => {
    mockApiFetch.mockResolvedValue([
      { id: "p-123", nombre: "Created Project", createdAt: "2026-06-15" },
    ]);
    mockFetchAllActivos.mockResolvedValue([] as any);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("Created Project")).toBeDefined();
    });
    expect(screen.getByText(/Inicio 01 ene\. 2026/)).toBeDefined();
  });

  it("falls back to empty string when both fechaInicio and createdAt are absent", async () => {
    mockApiFetch.mockResolvedValue([
      { id: "p-123", nombre: "No Dates Project", direccion: "Address" },
    ]);
    mockFetchAllActivos.mockResolvedValue([] as any);
    render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );
    await waitFor(() => {
      expect(screen.getByText("No Dates Project")).toBeDefined();
    });
    expect(screen.getByText(/Address/)).toBeDefined();
  });

  it("returns early without calling fetchActivosPorProyecto when unmounted during apiFetch", async () => {
    let resolveApiFetch: (value: unknown) => void;
    const deferred = new Promise<unknown>((resolve) => {
      resolveApiFetch = resolve;
    });
    mockApiFetch.mockReturnValue(deferred);

    const { unmount } = render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );

    unmount();
    resolveApiFetch!([]);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockFetchAllActivos).not.toHaveBeenCalled();
  });

  it("skips setUnits when unmounted after project is found but before activos fetch resolves", async () => {
    mockApiFetch.mockResolvedValue([mockProject]);

    let resolveFetchActivos: (value: unknown) => void;
    const deferredActivos = new Promise<unknown>((resolve) => {
      resolveFetchActivos = resolve;
    });
    mockFetchAllActivos.mockReturnValue(deferredActivos);

    const { unmount } = render(
      <ProjectWorkspaceShell projectId="p-123">
        <div data-testid="child">Content</div>
      </ProjectWorkspaceShell>
    );

    await waitFor(() => {
      expect(mockFetchAllActivos).toHaveBeenCalled();
    });

    unmount();
    resolveFetchActivos!([]);

    await new Promise((r) => setTimeout(r, 0));
  });
});
