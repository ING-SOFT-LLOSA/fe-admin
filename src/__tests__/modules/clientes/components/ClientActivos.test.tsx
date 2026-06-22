/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ClientActivos from '@/modules/clientes/components/ClientActivos';

vi.mock("@/lib/api/expedientes", () => ({
  fetchActivosPorUsuario: vi.fn(),
  fetchContratoActivo: vi.fn(),
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

import {
  fetchActivosPorUsuario,
  fetchContratoActivo,
} from "@/lib/api/expedientes";
import { fetchProyectos } from "@/lib/api/proyectos";
import { useRouter } from "next/navigation";

const mockFetchActivos = vi.mocked(fetchActivosPorUsuario);
const mockFetchContrato = vi.mocked(fetchContratoActivo);
const mockFetchProyectos = vi.mocked(fetchProyectos);
const mockUseRouter = vi.mocked(useRouter);

const sampleActivos = [
  {
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
  },
  {
    id: "act-2",
    pisoId: 11,
    nro: "P-A1",
    torreNombre: "Torre A",
    proyectoNombre: "Aurora",
    nroPiso: 1,
    tipo: "ESTACIONAMIENTO",
    areaM2: 12,
    areaTechada: 12,
    estadoComercial: "SEPARADO",
    precio: 18000,
    descripcion: "",
  },
  {
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
  },
  {
    id: "act-4",
    pisoId: 20,
    nro: "201",
    torreNombre: "Torre B",
    proyectoNombre: "Beta",
    nroPiso: 2,
    tipo: "DEPARTAMENTO",
    areaM2: 90,
    areaTechada: 85,
    estadoComercial: "RESERVADO",
    precio: 300000,
    descripcion: "",
  },
  {
    id: "act-5",
    pisoId: 30,
    nro: "301",
    torreNombre: null,
    proyectoNombre: null,
    nroPiso: 3,
    tipo: "OFICINA",
    areaM2: 100,
    areaTechada: 100,
    estadoComercial: "DESCONOCIDO",
    precio: 500000,
    descripcion: "",
  },
];

const sampleProyectos = [
  { id: "p-1", nombre: "Aurora" },
  { id: "p-2", nombre: "Beta" },
];

describe("ClientActivos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    mockFetchActivos.mockResolvedValue([]);
    mockFetchProyectos.mockResolvedValue(sampleProyectos as any);
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
  });

  it("muestra el estado de carga inicialmente", () => {
    mockFetchActivos.mockReturnValue(new Promise(() => {}));
    render(<ClientActivos clientId={1} />);
    expect(screen.getByText("Cargando activos...")).toBeDefined();
  });

  it("muestra el título de la sección y el contador", async () => {
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
    render(<ClientActivos clientId={1} />);
    expect(screen.getByText("Propiedades del Cliente")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText(/5 activos/)).toBeDefined();
    });
  });

  it("muestra el estado vacío si el cliente no tiene propiedades", async () => {
    mockFetchActivos.mockResolvedValue([]);
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("No tiene propiedades vinculadas.")).toBeDefined();
    expect(screen.getByText("0 activos")).toBeDefined();
  });

  it("muestra mensaje de error si falla la carga", async () => {
    mockFetchActivos.mockRejectedValue(new Error("boom"));
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("boom")).toBeDefined();
  });

  it("muestra mensaje de error genérico si la falla no es un Error", async () => {
    mockFetchActivos.mockRejectedValue("fallo crudo");
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("No se pudieron cargar los activos.")).toBeDefined();
  });

  it("muestra mensaje singular cuando hay 1 activo", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("1 activo")).toBeDefined();
    });
  });

  it("agrupa los activos por proyecto", async () => {
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
    render(<ClientActivos clientId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Aurora")).toBeDefined();
      expect(screen.getByText("Beta")).toBeDefined();
    });
    expect(screen.getByText("Sin proyecto")).toBeDefined();
  });

  it("muestra el contador de unidades por proyecto", async () => {
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
    render(<ClientActivos clientId={1} />);

    await waitFor(() => {
      // Aurora: 3 unidades (act-1, act-2, act-3), Beta: 1 unidad, Sin proyecto: 1
      expect(screen.getByText("3 unidades")).toBeDefined();
      expect(screen.getAllByText("1 unidad").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("muestra el label de unidad según el tipo (DEPARTAMENTO, ESTACIONAMIENTO, DEPOSITO, OFICINA)", async () => {
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
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
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
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
    mockFetchActivos.mockResolvedValue(sampleActivos as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Vendido")).toBeDefined();
      expect(screen.getByText("Separado")).toBeDefined();
      expect(screen.getByText("Disponible")).toBeDefined();
      expect(screen.getByText("Reservado")).toBeDefined();
      // estado desconocido → usa el valor crudo
      expect(screen.getByText("DESCONOCIDO")).toBeDefined();
    });
  });

  it("formatea el precio en soles peruanos", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    render(<ClientActivos clientId={1} />);
    expect(await screen.findByText("S/ 250,000")).toBeDefined();
  });

  it("genera link al detalle de unidad cuando hay proyecto coincidente", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      const link = screen.getByText("Ver detalle de unidad").closest("a");
      expect(link?.getAttribute("href")).toBe("/proyectos/p-1/unidades/act-1");
    });
  });

  it("genera link genérico cuando no encuentra proyecto coincidente", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchProyectos.mockResolvedValue([] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      const link = screen.getByText("Ver detalle de unidad").closest("a");
      expect(link?.getAttribute("href")).toBe("/proyectos");
    });
  });

  it("navega al expediente legal al hacer click en Ver expediente", async () => {
    const push = vi.fn();
    mockUseRouter.mockReturnValue({ push } as any);
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchContrato.mockResolvedValue({
      uuidUsuarioActivo: "ua-xyz",
    } as any);

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Ver expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockFetchContrato).toHaveBeenCalledWith("act-1");
      expect(push).toHaveBeenCalledWith("/legal/ua-xyz");
    });
  });

  it("muestra alert si fetchContrato no devuelve uuidUsuarioActivo", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchContrato.mockResolvedValue({} as any);

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Ver expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "No se encontró un expediente legal asociado para esta propiedad.",
      );
    });
  });

  it("muestra alert de error 404 cuando el expediente no existe", async () => {
    const { ApiError } = await import("@/lib/api/http");
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchContrato.mockRejectedValue(new ApiError("Not found", 404, "/api/contrato"));

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Ver expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "No se encontró un expediente legal asociado para esta propiedad.",
      );
    });
  });

  it("muestra alert de error genérico cuando fetchContrato falla con otro error", async () => {
    const { ApiError } = await import("@/lib/api/http");
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchContrato.mockRejectedValue(new ApiError("Server error", 500, "/api/contrato"));

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Ver expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error al cargar el expediente legal.",
      );
    });
  });

  it("muestra 'Cargando...' en el botón mientras se carga el expediente", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchContrato.mockReturnValue(new Promise(() => {}));

    render(<ClientActivos clientId={1} />);
    const btn = await screen.findByText("Ver expediente legal");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("Cargando...")).toBeDefined();
    });
  });

  it("re-carga los datos cuando refreshKey cambia", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    const { rerender } = render(<ClientActivos clientId={1} refreshKey={0} />);
    await screen.findByText(/Departamento 101/);
    expect(mockFetchActivos).toHaveBeenCalledTimes(1);

    mockFetchActivos.mockClear();
    rerender(<ClientActivos clientId={1} refreshKey={1} />);
    await waitFor(() => {
      expect(mockFetchActivos).toHaveBeenCalled();
    });
  });

  it("re-carga los datos cuando clientId cambia", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    const { rerender } = render(<ClientActivos clientId={1} />);
    await screen.findByText(/Departamento 101/);

    mockFetchActivos.mockClear();
    rerender(<ClientActivos clientId={2} />);
    await waitFor(() => {
      expect(mockFetchActivos).toHaveBeenCalledWith(2);
    });
  });

  it("tolera que fetchProyectos falle con fallback a []", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchProyectos.mockRejectedValue(new Error("boom"));

    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Departamento 101/)).toBeDefined();
    });
  });

  it("tolera que fetchProyectos retorne datos no-array (fallback a [])", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    mockFetchProyectos.mockResolvedValue(null as any);

    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Departamento 101/)).toBeDefined();
    });
  });

  it("tolera que fetchActivos retorne null (fallback a [])", async () => {
    mockFetchActivos.mockResolvedValue(null as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText("No tiene propiedades vinculadas.")).toBeDefined();
    });
  });

  it("muestra la torre, piso y áreas", async () => {
    mockFetchActivos.mockResolvedValue([sampleActivos[0]] as any);
    render(<ClientActivos clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Torre A · Piso 1 · 80 m² · Tech\. 75 m²/)).toBeDefined();
    });
  });
});
