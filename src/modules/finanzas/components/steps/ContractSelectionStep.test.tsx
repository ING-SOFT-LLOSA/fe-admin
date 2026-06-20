import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api/users", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

import { fetchExpedientesPorUsuario } from "@/lib/api/users";
import ContractSelectionStep from "./ContractSelectionStep";

const mockFetchExpedientesPorUsuario = vi.mocked(fetchExpedientesPorUsuario);

const sampleClient = {
  id: 1,
  nombre: "Ana",
  apellidos: "García",
  email: "ana@test.com",
  documentoIdentidad: "12345678",
  tipoUsuario: "CLIENTE" as const,
  activo: true,
  telefono: null,
  createdAt: "",
};

const sampleExpediente = {
  uuidUsuarioActivo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  tipoFinanciamiento: "Crédito Hipotecario",
  faseComercial: "CONTRATO",
  fechaAdquisicion: "2026-01-15",
  createdAt: "2026-01-15",
  updatedAt: null,
  vigente: true,
  clientes: [],
  activos: [{
    id: "unit-1",
    pisoId: 1,
    nroPiso: 5,
    torreNombre: "Torre A",
    proyectoNombre: "Las Lomas",
    nro: "502",
    tipo: "DEPARTAMENTO",
    areaM2: 80,
    areaTechada: 75,
    estadoComercial: "VENDIDO",
    precio: 350000,
    descripcion: "Dpto 502",
  }],
};

describe("ContractSelectionStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchExpedientesPorUsuario.mockResolvedValue([sampleExpediente as any]);
  });

  it("renders step header", async () => {
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText("Seleccionar Contrato")).toBeDefined();
    expect(screen.getByText("Elige el contrato / unidad del cliente")).toBeDefined();
  });

  it("shows client summary card with name and email", async () => {
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(mockFetchExpedientesPorUsuario).toHaveBeenCalled();
    });
    expect(screen.getByText(/Ana García/)).toBeDefined();
    expect(screen.getByText(/12345678/)).toBeDefined();
    expect(screen.getByText(/ana@test\.com/)).toBeDefined();
  });

  it("shows client initials in avatar", async () => {
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("AG")).toBeDefined();
    });
  });

  it("shows contracts after loading", async () => {
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/EXP-/)).toBeDefined();
    });
    expect(screen.getByText("Crédito Hipotecario")).toBeDefined();
    expect(screen.getByText("Contrato")).toBeDefined();
  });

  it("shows loading state initially", () => {
    mockFetchExpedientesPorUsuario.mockReturnValue(new Promise(() => {}));
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText("Cargando contratos…")).toBeDefined();
  });

  it("shows empty state when no contracts", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([] as any);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    expect(await screen.findByText("Este cliente no tiene contratos activos.")).toBeDefined();
  });

  it("shows error state when fetch fails", async () => {
    mockFetchExpedientesPorUsuario.mockRejectedValue(new Error("Failed"));
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    expect(await screen.findByText("Failed")).toBeDefined();
  });

  it("shows generic error when non-Error thrown", async () => {
    mockFetchExpedientesPorUsuario.mockRejectedValue("fail");
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    expect(await screen.findByText("Error al cargar contratos")).toBeDefined();
  });

  it("calls onSelectContract when clicking a contract", async () => {
    const onSelectContract = vi.fn();
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={onSelectContract} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/EXP-/)).toBeDefined();
    });
    fireEvent.click(screen.getByText(/EXP-/));
    expect(onSelectContract).toHaveBeenCalledWith(sampleExpediente);
  });

  it("calls onBack when Cambiar is clicked", async () => {
    const onBack = vi.fn();
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={onBack} />);
    const cambiarBtn = await screen.findByText("Cambiar");
    fireEvent.click(cambiarBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it("shows singular 'contrato encontrado' for 1 result", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([sampleExpediente as any]);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("1 contrato encontrado")).toBeDefined();
    });
  });

  it("shows plural 'contratos encontrados' for multiple results", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([
      sampleExpediente as any,
      { ...sampleExpediente, uuidUsuarioActivo: "b1b2b3b4-b5b6-7890-bbbb-bb1234567890" } as any,
    ]);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("2 contratos encontrados")).toBeDefined();
    });
  });

  it("shows unit price in contract card", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([{
      ...sampleExpediente,
      activo: sampleExpediente.activos[0],
    } as any]);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(mockFetchExpedientesPorUsuario).toHaveBeenCalled();
    });
    expect(screen.getByText(/350[,.]?000/)).toBeDefined();
  });

  it("handles expedientes with multiple activos", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([{
      ...sampleExpediente,
      activos: [
        { ...sampleExpediente.activos[0], nro: "502" },
        { ...sampleExpediente.activos[0], nro: "503" },
      ],
    } as any]);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Unidad 502 \+ Unidad 503/)).toBeDefined();
    });
  });

  it("handles expedientes without activos", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([{
      ...sampleExpediente,
      activos: [],
    } as any]);
    render(<ContractSelectionStep client={sampleClient as any} onSelectContract={vi.fn()} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Expediente/)).toBeDefined();
    });
  });
});
