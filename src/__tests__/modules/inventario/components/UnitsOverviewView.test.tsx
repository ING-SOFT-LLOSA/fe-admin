import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/modules/inventario/services", () => ({
  fetchAllActivosPorProyecto: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { fetchAllActivosPorProyecto } from "@/modules/inventario/services";
import UnitsOverviewView from '@/modules/inventario/components/UnitsOverviewView';

const mockFetchAllActivos = vi.mocked(fetchAllActivosPorProyecto);

const sampleUnit = {
  id: "unit-1",
  nro: "502",
  pisoId: 1,
  nroPiso: 5,
  torreNombre: "Torre A",
  proyectoNombre: "Las Lomas",
  tipo: "DEPARTAMENTO",
  areaM2: 80,
  areaTechada: 75,
  estadoComercial: "DISPONIBLE",
  precio: 350000,
  descripcion: "Dpto 502 en Torre A",
};

describe("UnitsOverviewView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllActivos.mockResolvedValue([sampleUnit] as any);
  });

  it("renders search and filter controls", async () => {
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ej. 101, departamento, terraza")).toBeDefined();
    });
    expect(screen.getByLabelText("Buscar unidad")).toBeDefined();
    expect(screen.getByLabelText("Tipo")).toBeDefined();
    expect(screen.getByLabelText("Estado comercial")).toBeDefined();
  });

  it("shows loading state initially", () => {
    mockFetchAllActivos.mockReturnValue(new Promise(() => {}));
    render(<UnitsOverviewView projectId="proj-1" />);
    expect(screen.getByText("Cargando inventario...")).toBeDefined();
  });

  it("shows unit data in table after loading", async () => {
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("502")).toBeDefined();
    });
    expect(screen.getAllByText("DEPARTAMENTO").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("DISPONIBLE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/350,000/)).toBeDefined();
  });

  it("shows error message when fetch fails", async () => {
    mockFetchAllActivos.mockRejectedValue(new Error("Load error"));
    render(<UnitsOverviewView projectId="proj-1" />);
    expect(await screen.findByText("Load error")).toBeDefined();
  });

  it("shows generic error when non-Error thrown", async () => {
    mockFetchAllActivos.mockRejectedValue("error");
    render(<UnitsOverviewView projectId="proj-1" />);
    expect(await screen.findByText("No se pudo cargar el inventario.")).toBeDefined();
  });

  it("filters units by type", async () => {
    mockFetchAllActivos.mockResolvedValue([
      sampleUnit,
      { ...sampleUnit, id: "unit-2", nro: "E-1", tipo: "COCHERA" },
    ] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("502")).toBeDefined();
    });
    expect(screen.getByText("E-1")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "COCHERA" } });
    await waitFor(() => {
      expect(screen.queryByText("502")).toBeNull();
    });
    expect(screen.getByText("E-1")).toBeDefined();
  });

  it("filters units by status", async () => {
    mockFetchAllActivos.mockResolvedValue([
      sampleUnit,
      { ...sampleUnit, id: "unit-2", nro: "101", estadoComercial: "VENDIDO" },
    ] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("101")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("Estado comercial"), { target: { value: "VENDIDO" } });
    await waitFor(() => {
      expect(screen.queryByText("502")).toBeNull();
    });
    expect(screen.getByText("101")).toBeDefined();
  });

  it("filters units by search text", async () => {
    mockFetchAllActivos.mockResolvedValue([
      sampleUnit,
      { ...sampleUnit, id: "unit-2", nro: "101", descripcion: "Terraza grande" },
    ] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("101")).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText("Ej. 101, departamento, terraza"), { target: { value: "terraza" } });
    await waitFor(() => {
      expect(screen.queryByText("502")).toBeNull();
    });
    expect(screen.getByText("101")).toBeDefined();
  });

  it("shows empty state when no units match filters", async () => {
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("502")).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText("Ej. 101, departamento, terraza"), { target: { value: "zzz_nonexistent" } });
    await waitFor(() => {
      expect(screen.getByText("No hay unidades para los filtros seleccionados.")).toBeDefined();
    });
  });

  it("shows Abrir detalle link with correct href", async () => {
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("502")).toBeDefined();
    });
    const link = screen.getByText("Abrir detalle");
    expect(link.closest("a")?.getAttribute("href")).toBe("/proyectos/proj-1/unidades/unit-1");
  });

  it("shows empty state when fetch returns empty array", async () => {
    mockFetchAllActivos.mockResolvedValue([] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("No hay unidades para los filtros seleccionados.")).toBeDefined();
    });
  });

  it("sorts units by type order then nro", async () => {
    mockFetchAllActivos.mockResolvedValue([
      { ...sampleUnit, id: "c", nro: "E-3", tipo: "COCHERA" },
      { ...sampleUnit, id: "a", nro: "502", tipo: "DEPARTAMENTO" },
      { ...sampleUnit, id: "b", nro: "101", tipo: "DEPARTAMENTO" },
    ] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);
      const nros = dataRows.map(r => r.textContent?.match(/^(101|502|E-3)/)?.[0]).filter(Boolean);
      expect(nros).toEqual(["101", "502", "E-3"]);
    });
  });

  it("shows different status badge styles", async () => {
    mockFetchAllActivos.mockResolvedValue([
      { ...sampleUnit, id: "v1", nro: "V1", estadoComercial: "VENDIDO" },
      { ...sampleUnit, id: "s1", nro: "S1", estadoComercial: "SEPARADO" },
      { ...sampleUnit, id: "b1", nro: "B1", estadoComercial: "BLOQUEADO" },
    ] as any);
    render(<UnitsOverviewView projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("V1")).toBeDefined();
    });
    expect(screen.getAllByText("SEPARADO").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BLOQUEADO").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("VENDIDO").length).toBeGreaterThanOrEqual(1);
  });
});
