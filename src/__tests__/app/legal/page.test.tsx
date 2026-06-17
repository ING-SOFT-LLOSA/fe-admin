import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LegalOverview from "@/modules/legal/components/LegalOverview";
import { useRouter } from "next/navigation";
import {
  fetchCommercialStepper,
  fetchEtapasExpediente,
  fetchTodosLosContratos,
} from "@/lib/api/expedientes";
import { fetchProyectos, fetchTorresPorProyecto } from "@/lib/api/proyectos";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchProyectos: vi.fn(),
  fetchTorresPorProyecto: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchTodosLosContratos: vi.fn(),
  fetchEtapasExpediente: vi.fn(),
  fetchCommercialStepper: vi.fn(),
}));

const mockRouterPush = vi.fn();

const mockProject = { id: "proj-1", nombre: "Torre Central" };
const mockContract = {
  uuidUsuarioActivo: "uuid-1",
  vigente: true,
  activos: [
    {
      proyectoNombre: "Torre Central",
      torreNombre: "Torre A",
      tipo: "DEPARTAMENTO",
      nro: "1201",
    },
  ],
  clientes: [{ nombre: "Ana", apellidos: "Paredes", email: "ana@test.com" }],
  ultimaActualizacion: new Date().toISOString(),
};

const mockStage = {
  etapaProceso: "CONTRATO",
  estado: "EN_PROGRESO",
  hitosCompletados: 1,
  totalHitos: 2,
};

describe("LegalOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockRouterPush } as never);
    vi.mocked(fetchProyectos).mockResolvedValue([mockProject] as never);
    vi.mocked(fetchTodosLosContratos).mockResolvedValue([mockContract] as never);
    vi.mocked(fetchEtapasExpediente).mockResolvedValue([mockStage] as never);
    vi.mocked(fetchCommercialStepper).mockResolvedValue({
      etapas: [{ etapa: "CONTRATO", hitos: [{ estado: "COMPLETADO" }, { estado: "EN_PROGRESO" }] }],
    } as never);
    vi.mocked(fetchTorresPorProyecto).mockResolvedValue([{ nombre: "Torre A" }] as never);
  });

  it("renders without crashing", async () => {
    render(<LegalOverview />);
    expect(screen.getByText("Gestión Legal")).toBeDefined();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(fetchProyectos).mockImplementation(() => new Promise(() => {}));
    vi.mocked(fetchTodosLosContratos).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<LegalOverview />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows error message when API fails", async () => {
    vi.mocked(fetchTodosLosContratos).mockRejectedValue(new Error("No se pudieron cargar los expedientes."));

    render(<LegalOverview />);

    expect(await screen.findByText("No se pudieron cargar los expedientes.")).toBeDefined();
  });

  it("shows correct data when API resolves successfully", async () => {
    render(<LegalOverview />);

    expect(await screen.findByText("EXP-UUID-1")).toBeDefined();
    expect(screen.getByText("Torre A · Dpto 1201")).toBeDefined();
    expect(screen.getByText("Ana Paredes")).toBeDefined();
expect(screen.getAllByText("Vigente").length).toBeGreaterThan(0);
  });

  it("filters rows through the search field", async () => {
    vi.mocked(fetchTodosLosContratos).mockResolvedValueOnce([
      mockContract,
      {
        ...mockContract,
        uuidUsuarioActivo: "uuid-2",
        clientes: [{ nombre: "Bruno", apellidos: "Lopez", email: "bruno@test.com" }],
      },
    ] as never);
    vi.mocked(fetchEtapasExpediente).mockResolvedValue([mockStage] as never);
    vi.mocked(fetchCommercialStepper).mockResolvedValue({
      etapas: [{ etapa: "CONTRATO", hitos: [] }],
    } as never);

    render(<LegalOverview />);
    expect(await screen.findByText("Ana Paredes")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("Cliente, unidad o exp…"), {
      target: { value: "Bruno" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Ana Paredes")).toBeNull();
      expect(screen.getByText("Bruno Lopez")).toBeDefined();
    });
  });
});
