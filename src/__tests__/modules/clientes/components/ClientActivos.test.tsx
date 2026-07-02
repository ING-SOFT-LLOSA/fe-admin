/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClientActivos from '@/modules/clientes/components/ClientActivos';

vi.mock("@/lib/api/expedientes", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock("@/modules/clientes/components/UnlinkPropertyModal", () => ({
  default: ({ open, assignment, onClose, onUnlinked }: any) => {
    if (!open) return null;
    return (
      <div data-testid="mock-unlink-modal">
        <span data-testid="mock-unlink-project">{assignment?.projectName}</span>
        <span data-testid="mock-unlink-units">{assignment?.unitLabel}</span>
        <button onClick={onUnlinked}>Mock Confirm</button>
        <button onClick={onClose}>Mock Close</button>
      </div>
    );
  }
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchProyectos: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { fetchExpedientesPorUsuario } from "@/lib/api/expedientes";
import { fetchProyectos } from "@/lib/api/proyectos";
import { useRouter } from "next/navigation";

const mockFetchExpedientes = vi.mocked(fetchExpedientesPorUsuario);
const mockFetchProyectos = vi.mocked(fetchProyectos);
const mockUseRouter = vi.mocked(useRouter);


const activoDepto = {
  id: "act-1",
  pisoId: 10,
  nro: "101",
  torreNombre: "Torre A",
  proyectoNombre: "Aurora",
  nroPiso: 1,
  tipo: "DEPARTAMENTO",
  areaM2: 80,
  areaTechada: 75,
  estadoComercial: "VENDIDO",
  precio: 250000,
  descripcion: "",
};

const activoCochera = {
  id: "act-2",
  pisoId: 11,
  nro: "P-A1",
  torreNombre: "Torre A",
  proyectoNombre: "Aurora",
  nroPiso: 1,
  tipo: "ESTACIONAMIENTO",
  areaM2: 12,
  areaTechada: 0,
  estadoComercial: "SEPARADO",
  precio: 18000,
  descripcion: "",
};

const activoDeposito = {
  id: "act-3",
  pisoId: 12,
  nro: "D-1",
  torreNombre: "Torre A",
  proyectoNombre: "Aurora",
  nroPiso: 1,
  tipo: "DEPOSITO",
  areaM2: 5,
  areaTechada: 5,
  estadoComercial: "DISPONIBLE",
  precio: 5000,
  descripcion: "",
};

const activoOficina = {
  id: "act-5",
  pisoId: 30,
  nro: "301",
  torreNombre: "Torre B",
  proyectoNombre: "Beta",
  nroPiso: 3,
  tipo: "OFICINA",
  areaM2: 100,
  areaTechada: 100,
  estadoComercial: "DESCONOCIDO",
  precio: 500000,
  descripcion: "",
};

// Contrato activo (vigente, con 1 activo)
const contratoActivo = {
  uuidUsuarioActivo: "ua-1",
  tipoFinanciamiento: "CREDITO_HIPOTECARIO",
  fechaAdquisicion: null,
  fechaCompletado: null,
  createdAt: null,
  updatedAt: null,
  vigente: true,
  clientes: [],
  activos: [activoDepto],
  estadoTramiteLegal: "CONTRATO",
};

// Contrato activo con varias unidades, distintos tipos/estados
const contratoMultiunidad = {
  uuidUsuarioActivo: "ua-multi",
  tipoFinanciamiento: "AL_CONTADO",
  fechaAdquisicion: null,
  fechaCompletado: null,
  createdAt: null,
  updatedAt: null,
  vigente: true,
  clientes: [],
  activos: [activoDepto, activoCochera, activoDeposito, activoOficina],
  estadoTramiteLegal: "PAGO",
};

const sampleProyectos = [
  { id: "p-1", nombre: "Aurora" },
  { id: "p-2", nombre: "Beta" },
];

describe("ClientActivos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    mockFetchExpedientes.mockResolvedValue([]);
    mockFetchProyectos.mockResolvedValue(sampleProyectos as any);
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
  });

  it("muestra el estado de carga inicialmente", () => {
    mockFetchExpedientes.mockReturnValue(new Promise(() => {}));
    render(<ClientActivos clientId={1} />);
    expect(screen.getByText("Cargando contratos...")).toBeDefined();
  });

  it("muestra el título de la sección y los contadores", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoMultiunidad] as any);
    render(<ClientActivos clientId={1} />);
    expect(screen.getByText("Propiedades del cliente")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("1 contrato activo")).toBeDefined();
      expect(screen.getByText("4 unidades")).toBeDefined();
    });
  });

  it("muestra el estado vacío si el cliente no tiene contratos", async () => {
    mockFetchExpedientes.mockResolvedValue([]);
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("Sin contratos vinculados")).toBeDefined();
  });

  it("muestra mensaje de error si falla la carga", async () => {
    mockFetchExpedientes.mockRejectedValue(new Error("boom"));
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("boom")).toBeDefined();
  });

  it("muestra mensaje de error genérico si la falla no es un Error", async () => {
    mockFetchExpedientes.mockRejectedValue("fallo crudo");
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("No se pudieron cargar los contratos.")).toBeDefined();
  });

  it("muestra contador singular cuando hay 1 contrato y 1 unidad", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("1 contrato activo")).toBeDefined();
      expect(screen.getByText("1 unidad")).toBeDefined();
    });
  });

  it("muestra contador plural cuando hay varios contratos activos", async () => {
    mockFetchExpedientes.mockResolvedValue([
      contratoActivo,
      { ...contratoMultiunidad, uuidUsuarioActivo: "ua-2" },
    ] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("2 contratos activos")).toBeDefined();
    });
  });

  it("muestra el número de contrato y la etapa del trámite legal", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Contrato 01")).toBeDefined();
      // estadoTramiteLegal CONTRATO → label "Contrato"
      expect(screen.getAllByText("Contrato").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("muestra el label de financiamiento", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Crédito hipotecario")).toBeDefined();
    });
  });

  it("muestra el label de unidad según el tipo (DEPARTAMENTO, ESTACIONAMIENTO, DEPOSITO, OFICINA)", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoMultiunidad] as any);
    render(<ClientActivos clientId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Departamento 101/)).toBeDefined();
      expect(screen.getByText(/Cochera P-A1/)).toBeDefined();
      expect(screen.getByText(/Depósito D-1/)).toBeDefined();
      // OFICINA fallback → usa el tipo como label
      expect(screen.getByText(/OFICINA 301/)).toBeDefined();
    });
  });

  it("muestra los iconos correctos según el tipo", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoMultiunidad] as any);
    const { container } = render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Departamento 101/)).toBeDefined();
    });
    // apartment, directions_car, inventory_2
    const icons = container.querySelectorAll(".material-symbols-outlined");
    const text = Array.from(icons).map((i) => i.textContent).join(" ");
    expect(text).toContain("apartment");
    expect(text).toContain("directions_car");
    expect(text).toContain("inventory_2");
  });

  it("muestra el badge de estado correcto para cada activo", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoMultiunidad] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Vendido")).toBeDefined();
      expect(screen.getByText("Separado")).toBeDefined();
      expect(screen.getByText("Disponible")).toBeDefined();
      // estado desconocido → usa el valor crudo
      expect(screen.getByText("DESCONOCIDO")).toBeDefined();
    });
  });

  it("formatea el precio en soles peruanos", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("S/ 250,000")).toBeDefined();
  });

  it("genera link al detalle de unidad cuando hay proyecto coincidente", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      const link = screen.getByText("Ver detalle de unidad").closest("a");
      expect(link?.getAttribute("href")).toBe("/proyectos/p-1/unidades/act-1");
    });
  });

  it("genera link genérico cuando no encuentra proyecto coincidente", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    mockFetchProyectos.mockResolvedValue([] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      const link = screen.getByText("Ver detalle de unidad").closest("a");
      expect(link?.getAttribute("href")).toBe("/proyectos");
    });
  });

  it("navega al expediente legal al hacer click en Expediente legal", async () => {
    const push = vi.fn();
    mockUseRouter.mockReturnValue({ push } as any);
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/legal/ua-1");
    });
  });

  it("re-carga los datos cuando refreshKey cambia", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    const { rerender } = render(<ClientActivos clientId={1} refreshKey={0} />);
    await screen.findByText(/Departamento 101/);
    expect(mockFetchExpedientes).toHaveBeenCalledTimes(1);

    mockFetchExpedientes.mockClear();
    rerender(<ClientActivos clientId={1} refreshKey={1} />);
    await waitFor(() => {
      expect(mockFetchExpedientes).toHaveBeenCalled();
    });
  });

  it("re-carga los datos cuando clientId cambia", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    const { rerender } = render(<ClientActivos clientId={1} />);
    await screen.findByText(/Departamento 101/);

    mockFetchExpedientes.mockClear();
    rerender(<ClientActivos clientId={2} />);
    await waitFor(() => {
      expect(mockFetchExpedientes).toHaveBeenCalledWith(2);
    });
  });

  it("tolera que fetchProyectos falle con fallback a []", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    mockFetchProyectos.mockRejectedValue(new Error("boom"));

    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Departamento 101/)).toBeDefined();
    });
  });

  it("tolera que fetchExpedientes retorne null (fallback a [])", async () => {
    mockFetchExpedientes.mockResolvedValue(null as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Sin contratos vinculados")).toBeDefined();
    });
  });

  it("muestra la torre y piso de la unidad", async () => {
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Torre A · Piso 1/)).toBeDefined();
    });
  });

  it("muestra el historial de contratos cancelados", async () => {
    const contratoCancelado = {
      ...contratoActivo,
      uuidUsuarioActivo: "ua-cancelado",
      vigente: false,
    };
    mockFetchExpedientes.mockResolvedValue([contratoActivo, contratoCancelado] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Contratos cancelados \(1\)/)).toBeDefined();
    });
  });

  it("trata un contrato sin unidades como cancelado", async () => {
    const contratoSinUnidades = {
      ...contratoActivo,
      uuidUsuarioActivo: "ua-sin-unidades",
      activos: [],
    };
    mockFetchExpedientes.mockResolvedValue([contratoSinUnidades] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Sin contratos activos")).toBeDefined();
      expect(screen.getByText(/Contratos cancelados \(1\)/)).toBeDefined();
    });
  });

  it("abre el modal de cancelar contrato con el nombre de proyecto del DTO y propaga onUnlinked", async () => {
    const onUnlinked = vi.fn();
    mockFetchExpedientes.mockResolvedValue([contratoActivo] as any);

    render(<ClientActivos clientId={1} onUnlinked={onUnlinked} />);
    const btn = await screen.findByText("Cancelar contrato");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-unlink-modal")).toBeDefined();
    });
    // projectName proviene de activos[0].proyectoNombre del DTO
    expect(screen.getByTestId("mock-unlink-project").textContent).toBe("Aurora");
    // unitLabel es el resumen de las unidades del contrato
    expect(screen.getByTestId("mock-unlink-units").textContent).toBe("Departamento 101");

    const confirmBtn = screen.getByText("Mock Confirm");
    fireEvent.click(confirmBtn);

    expect(onUnlinked).toHaveBeenCalled();
  });

  it("usa 'Proyecto' como fallback cuando el activo no tiene proyectoNombre", async () => {
    const contratoSinProyecto = {
      ...contratoActivo,
      uuidUsuarioActivo: "ua-sin-proyecto",
      activos: [{ ...activoDepto, proyectoNombre: undefined }],
    };
    mockFetchExpedientes.mockResolvedValue([contratoSinProyecto] as any);

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Cancelar contrato");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-unlink-modal")).toBeDefined();
    });
    expect(screen.getByTestId("mock-unlink-project").textContent).toBe("Proyecto");
  });
});
