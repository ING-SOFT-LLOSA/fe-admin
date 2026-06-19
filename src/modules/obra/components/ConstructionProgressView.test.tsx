/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConstructionProgressView from "./ConstructionProgressView";

vi.mock("@/lib/api/obra", () => ({
  getAvanceGeneral: vi.fn(),
  getEtapasByProyecto: vi.fn(),
  getAvancesActivo: vi.fn(),
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchActivosPorProyecto: vi.fn(),
}));

vi.mock("@/modules/proyectos/services", () => ({
  fetchProyectos: vi.fn(),
}));

vi.mock("./ObraTabHitos", () => ({
  default: () => <div data-testid="tab-hitos">Hitos</div>,
}));

vi.mock("./ObraTabReportes", () => ({
  default: () => <div data-testid="tab-reportes">Reportes</div>,
}));

vi.mock("./ObraTabDocumentacion", () => ({
  default: () => <div data-testid="tab-documentacion">Documentación</div>,
}));

vi.mock("./ObraTabTimeline", () => ({
  default: () => <div data-testid="timeline">Timeline</div>,
}));

import { fetchProyectos } from "@/modules/proyectos/services";
import { getAvanceGeneral, getEtapasByProyecto } from "@/lib/api/obra";
import { fetchActivosPorProyecto } from "@/lib/api/proyectos";

const mockFetchProyectos = vi.mocked(fetchProyectos);
const mockGetAvance = vi.mocked(getAvanceGeneral);
const mockGetEtapas = vi.mocked(getEtapasByProyecto);
const mockFetchActivos = vi.mocked(fetchActivosPorProyecto);

describe("ConstructionProgressView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProyectos.mockResolvedValue([]);
    mockGetAvance.mockResolvedValue({ porcentajeAvance: 50 });
    mockGetEtapas.mockResolvedValue([]);
    mockFetchActivos.mockResolvedValue({ content: [] } as any);
  });

  it("muestra pantalla de carga inicial", () => {
    mockFetchProyectos.mockReturnValue(new Promise(() => {}));
    render(<ConstructionProgressView projectId="p-1" />);
    expect(screen.getByText("Cargando obra...")).toBeDefined();
  });

  it("muestra mensaje de error si la carga falla", async () => {
    mockFetchProyectos.mockRejectedValue(new Error("Error de red"));
    render(<ConstructionProgressView projectId="p-1" />);
    expect(await screen.findByText("Error de red")).toBeDefined();
  });

  it("muestra los tabs Hitos, Reportes y Documentación al cargar", async () => {
    mockFetchProyectos.mockResolvedValue([{ id: "p-1", nombre: "Aurora" }] as any);
    mockGetAvance.mockResolvedValue({ porcentajeAvance: 50 });
    mockGetEtapas.mockResolvedValue([]);
    mockFetchActivos.mockResolvedValue({ content: [] } as any);

    render(<ConstructionProgressView projectId="p-1" />);
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.getAllByText("Hitos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Reportes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Documentación").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra el nombre del proyecto en el header cuando context es obra", async () => {
    mockFetchProyectos.mockResolvedValue([{ id: "p-1", nombre: "Aurora" }] as any);
    mockGetAvance.mockResolvedValue({ porcentajeAvance: 50 });
    mockGetEtapas.mockResolvedValue([]);
    mockFetchActivos.mockResolvedValue({ content: [] } as any);

    render(<ConstructionProgressView projectId="p-1" context="obra" />);
    expect(await screen.findByText(/Aurora/)).toBeDefined();
  });
});
