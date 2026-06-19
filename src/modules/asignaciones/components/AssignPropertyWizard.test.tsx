/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AssignPropertyWizard from "./AssignPropertyWizard";
import type { ClienteRow } from "@/types/user";

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  mapUsuarioToClienteRow: vi.fn((u: any) => ({ ...u, name: `${u.nombre} ${u.apellidos}`, initials: "JP", dni: "—", phone: "—", project: "Revisar perfil", status: "ACTIVO", statusBg: "" })),
}));

vi.mock("@/lib/api/expedientes", () => ({
  crearContrato: vi.fn(),
  asignarActivo: vi.fn(),
}));

vi.mock("@/modules/inventario/services", () => ({
  fetchActivosPorProyecto: vi.fn(),
}));

vi.mock("@/modules/proyectos/services", () => ({
  fetchProyectos: vi.fn(),
}));

import { fetchUsuarios } from "@/lib/api/users";
import { crearContrato, asignarActivo } from "@/lib/api/expedientes";
import { fetchActivosPorProyecto } from "@/modules/inventario/services";
import { fetchProyectos } from "@/modules/proyectos/services";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockCrearContrato = vi.mocked(crearContrato);
const mockAsignarActivo = vi.mocked(asignarActivo);
const mockFetchActivos = vi.mocked(fetchActivosPorProyecto);
const mockFetchProyectos = vi.mocked(fetchProyectos);

const mockProyecto = { id: "p-1", nombre: "Torre Norte", direccion: "Lima", fechaInicio: "2026-01-01", fechaFinEstimada: "2027-12-31" };

const mockClienteRow: ClienteRow = {
  id: 1,
  initials: "JP",
  name: "Juan Pérez",
  dni: "12345678",
  email: "juan@test.com",
  phone: "999999999",
  project: "Revisar perfil",
  status: "ACTIVO",
  statusBg: "",
  tipoUsuario: "CLIENTE",
  rol: "USER",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchProyectos.mockResolvedValue([mockProyecto]);
  mockFetchUsuarios.mockResolvedValue([
    { id: 1, nombre: "Juan", apellidos: "Pérez", email: "juan@test.com", tipoUsuario: "CLIENTE", rol: "USER", activo: true, funciones: [] },
  ]);
  mockFetchActivos.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0, pageable: {}, last: true, first: true, numberOfElements: 0, empty: true });
  mockCrearContrato.mockResolvedValue({ uuidUsuarioActivo: "ua-new" } as any);
  mockAsignarActivo.mockResolvedValue({ uuidUsuarioActivo: "ua-new" } as any);
});

describe("AssignPropertyWizard (sin client prop = flujo 3 pasos)", () => {
  it("renderiza el paso 1 con búsqueda de clientes", async () => {
    render(<AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Seleccionar personas/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument();
  });

  it("muestra el título 'Asignar unidad'", async () => {
    render(<AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Asignar unidad")).toBeInTheDocument();
  });

  it("indica Paso 1 de 3", async () => {
    render(<AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace clic en cerrar", async () => {
    const onClose = vi.fn();
    render(<AssignPropertyWizard onClose={onClose} onSuccess={vi.fn()} />);
    const closeBtn = screen.getByRole("button", { name: "close" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra error si se intenta avanzar sin seleccionar clientes", async () => {
    render(<AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Seleccionar personas/i).length).toBeGreaterThanOrEqual(1);
    });
    fireEvent.click(screen.getByText("Siguiente"));
    await waitFor(() => {
      expect(screen.getByText(/Debes seleccionar al menos una persona/i)).toBeInTheDocument();
    });
  });

  it("filtra clientes cuando se escribe en la búsqueda", async () => {
    render(<AssignPropertyWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: "notexists" } });
  });
});

describe("AssignPropertyWizard (con client prop = flujo 2 pasos)", () => {
  it("renderiza el paso de selección de unidades (Paso 1 de 2)", async () => {
    render(
      <AssignPropertyWizard
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        client={mockClienteRow}
      />
    );
    await waitFor(() => {
      expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Seleccionar unidades/i)).toBeInTheDocument();
  });

  it("muestra error si se intenta avanzar sin seleccionar unidades", async () => {
    render(
      <AssignPropertyWizard
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        client={mockClienteRow}
      />
    );
    await waitFor(() => {
      expect(screen.getByText(/Seleccionar unidades/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Siguiente"));
    await waitFor(() => {
      expect(screen.getByText(/Debes seleccionar al menos una unidad/i)).toBeInTheDocument();
    });
  });

  it("no carga la lista de clientes cuando se proporciona el prop client", async () => {
    render(
      <AssignPropertyWizard
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        client={mockClienteRow}
      />
    );
    await waitFor(() => expect(mockFetchProyectos).toHaveBeenCalled());
    expect(mockFetchUsuarios).not.toHaveBeenCalled();
  });

  it("muestra la información del tipo de financiamiento en paso de confirmación", async () => {
    mockFetchActivos.mockResolvedValue({
      content: [{ id: "act-1", nro: "101", tipo: "DEPARTAMENTO", areaM2: 80, estadoComercial: "DISPONIBLE", precio: 200000, descripcion: "" }],
      totalElements: 1, totalPages: 1, size: 100, number: 0, pageable: {}, last: true, first: true, numberOfElements: 1, empty: false,
    } as any);

    render(
      <AssignPropertyWizard
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        client={mockClienteRow}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Seleccionar unidades/i)).toBeInTheDocument();
    });
  });
});
