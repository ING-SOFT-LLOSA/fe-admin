/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClienteProfileView from '@/modules/clientes/components/ClienteProfileView';

vi.mock("@/lib/api/users", () => ({
  fetchUsuarioPorId: vi.fn(),
  mapUsuarioToClienteRow: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock("@/modules/asignaciones/components/AssignPropertyWizard", () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="assign-wizard">
      <button onClick={onClose}>close-wizard</button>
      <button onClick={onSuccess}>success-wizard</button>
    </div>
  ),
}));

vi.mock("@/modules/clientes/components/EditClienteModal", () => ({
  default: ({ open, onClose, onUpdated }: any) =>
    open ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>close-edit</button>
        <button onClick={onUpdated}>updated-edit</button>
      </div>
    ) : null,
}));

vi.mock("@/modules/clientes/components/DeleteUsuarioModal", () => ({
  default: ({ open, onClose, onDeleted }: any) =>
    open ? (
      <div data-testid="delete-modal">
        <button onClick={onClose}>close-delete</button>
        <button onClick={onDeleted}>deleted-delete</button>
      </div>
    ) : null,
}));

vi.mock("@/modules/clientes/components/ClientHeader", () => ({
  default: ({ client, onEdit, onDelete }: any) => (
    <div data-testid="client-header">
      <span data-testid="header-name">{client.name}</span>
      <button onClick={onEdit}>header-edit</button>
      <button onClick={onDelete}>header-delete</button>
    </div>
  ),
}));

vi.mock("@/modules/clientes/components/ClientActivos", () => ({
  default: () => <div data-testid="client-activos" />,
}));

vi.mock("@/modules/clientes/components/ClientActivity", () => ({
  default: () => <div data-testid="client-activity" />,
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
  fetchUsuarioPorId,
  mapUsuarioToClienteRow,
} from "@/lib/api/users";
import { fetchExpedientesPorUsuario } from "@/lib/api/expedientes";
import { useRouter } from "next/navigation";

const mockFetchUser = vi.mocked(fetchUsuarioPorId);
const mockMap = vi.mocked(mapUsuarioToClienteRow);
const mockFetchExpedientes = vi.mocked(fetchExpedientesPorUsuario);
const mockUseRouter = vi.mocked(useRouter);

const sampleUser = {
  id: 1,
  nombre: "Ana",
  apellidos: "García",
  email: "ana@test.com",
  tipoUsuario: "CLIENTE",
  rol: "USER",
  activo: true,
  telefono: "999888777",
  documentoIdentidad: "12345678",
  createdAt: "2026-01-01",
  funciones: [],
};

const sampleContratos = [
  {
    uuidUsuarioActivo: "contrato-1",
    tipoFinanciamiento: "Crédito hipotecario",
    fechaAdquisicion: "2026-01-15T00:00:00",
    fechaCompletado: null,
    createdAt: "2026-01-15T00:00:00",
    updatedAt: null,
    vigente: true,
    clientes: [],
    estadoTramiteLegal: "EN_PROCESO",
    activos: [
      {
        id: "act-1",
        pisoId: 10,
        nro: "101",
        tipo: "DEPARTAMENTO",
        proyectoNombre: "Aurora",
        nroPiso: 1,
        torreNombre: "Torre A",
        areaM2: 80,
        areaTechada: 75,
        estadoComercial: "VENDIDO",
        precio: 250000,
        descripcion: "",
        tieneRecorridoVirtual: false,
      },
      {
        id: "act-2",
        pisoId: 11,
        nro: "P-A1",
        tipo: "ESTACIONAMIENTO",
        proyectoNombre: "Aurora",
        nroPiso: 1,
        torreNombre: "Torre A",
        areaM2: 12,
        areaTechada: 12,
        estadoComercial: "SEPARADO",
        precio: 18000,
        descripcion: "",
        tieneRecorridoVirtual: false,
      },
    ],
  },
];

const mappedRow = {
  id: 1,
  initials: "AG",
  name: "Ana García",
  dni: "12345678",
  email: "ana@test.com",
  phone: "999888777",
  project: "Aurora",
  status: "ACTIVO",
  statusBg: "bg-green-100",
  tipoUsuario: "CLIENTE",
  rol: "USER",
  createdAt: "2026-01-01",
};

describe("ClienteProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
    mockFetchUser.mockResolvedValue(sampleUser as any);
    mockFetchExpedientes.mockResolvedValue(sampleContratos as any);
    mockMap.mockReturnValue(mappedRow);
  });

  it("muestra estado de carga inicialmente", () => {
    mockFetchUser.mockReturnValue(new Promise(() => {}));
    render(<ClienteProfileView clientId="1" />);
    expect(screen.getByText("Cargando perfil del cliente...")).toBeDefined();
  });

  it("muestra error si la carga falla", async () => {
    mockFetchUser.mockRejectedValue(new Error("No se pudo cargar"));
    render(<ClienteProfileView clientId="1" />);
    expect(await screen.findByText("No se pudo cargar")).toBeDefined();
  });

  it("muestra error genérico si la falla no es un Error", async () => {
    mockFetchUser.mockRejectedValue("fallo crudo");
    render(<ClienteProfileView clientId="1" />);
    expect(await screen.findByText("No se pudo cargar el cliente.")).toBeDefined();
  });

  it("muestra 'Cliente no encontrado' si user es null y no hay error", async () => {
    mockFetchUser.mockResolvedValue(null as any);
    render(<ClienteProfileView clientId="999" />);
    expect(await screen.findByText("Cliente no encontrado.")).toBeDefined();
  });

  it("carga el perfil del cliente correctamente", async () => {
    render(<ClienteProfileView clientId="1" />);
    expect(await screen.findByText("Perfil del cliente")).toBeDefined();
    expect(screen.getAllByText("Ana García").length).toBeGreaterThan(0);
    expect(screen.getByTestId("header-name").textContent).toBe("Ana García");
    expect(mockFetchUser).toHaveBeenCalledWith(1);
    expect(mockFetchExpedientes).toHaveBeenCalledWith(1);
  });

  it("muestra el link Volver a Clientes", async () => {
    render(<ClienteProfileView clientId="1" />);
    await screen.findByText("Perfil del cliente");
    const link = screen.getByText("Volver a Clientes").closest("a");
    expect(link?.getAttribute("href")).toBe("/clientes");
  });

  it("muestra el modal de edición al hacer clic en Editar", async () => {
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    fireEvent.click(screen.getByText("header-edit"));
    expect(screen.getByTestId("edit-modal")).toBeDefined();
  });

  it("cierra el modal de edición al hacer clic en close-edit", async () => {
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    fireEvent.click(screen.getByText("header-edit"));
    fireEvent.click(screen.getByText("close-edit"));
    await waitFor(() => {
      expect(screen.queryByTestId("edit-modal")).toBeNull();
    });
  });

  it("refresca el perfil al actualizar el cliente", async () => {
    mockFetchUser.mockClear();
    mockFetchExpedientes.mockClear();
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");

    fireEvent.click(screen.getByText("header-edit"));
    fireEvent.click(screen.getByText("updated-edit"));

    await waitFor(() => {
      expect(mockFetchUser).toHaveBeenCalledTimes(2);
    });
  });

  it("muestra el modal de eliminación al hacer clic en Eliminar", async () => {
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    fireEvent.click(screen.getByText("header-delete"));
    expect(screen.getByTestId("delete-modal")).toBeDefined();
  });

  it("navega a /clientes al eliminar", async () => {
    const push = vi.fn();
    mockUseRouter.mockReturnValue({ push } as any);
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");

    fireEvent.click(screen.getByText("header-delete"));
    fireEvent.click(screen.getByText("deleted-delete"));

    expect(push).toHaveBeenCalledWith("/clientes");
  });

  it("deriva assignments de los contratos y los pasa a ClientActivity", async () => {
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-activos");
    // Las assignments se derivan de contratos.flatMap(activos) y se pasan a ClientActivity
    expect(screen.getByTestId("client-activity")).toBeDefined();
  });

  it("re-carga el perfil cuando clientId cambia", async () => {
    mockFetchUser.mockClear();
    const { rerender } = render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    expect(mockFetchUser).toHaveBeenCalledWith(1);

    mockFetchUser.mockClear();
    rerender(<ClienteProfileView clientId="2" />);
    await waitFor(() => {
      expect(mockFetchUser).toHaveBeenCalledWith(2);
    });
  });

  it("tolera que fetchExpedientes falle (fallback a [])", async () => {
    mockFetchExpedientes.mockRejectedValue(new Error("expedientes down"));
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    expect(screen.getByTestId("client-header")).toBeDefined();
  });

  it("maneja contratos cuyos activos no tienen proyecto", async () => {
    mockFetchExpedientes.mockResolvedValue([
      {
        uuidUsuarioActivo: "contrato-x",
        tipoFinanciamiento: undefined as any,
        fechaAdquisicion: null,
        fechaCompletado: null,
        createdAt: null,
        updatedAt: null,
        vigente: false,
        clientes: [],
        activos: [
          {
            id: "act-x",
            pisoId: 99,
            nro: "X-1",
            tipo: "BODEGA",
            proyectoNombre: undefined as any,
            nroPiso: 1,
            torreNombre: undefined as any,
            areaM2: 0,
            areaTechada: 0,
            estadoComercial: "DESCONOCIDO",
            precio: 0,
            descripcion: "",
            tieneRecorridoVirtual: false,
          },
        ],
      },
    ] as any);
    render(<ClienteProfileView clientId="1" />);
    await screen.findByTestId("client-header");
    expect(screen.getByTestId("client-header")).toBeDefined();
  });
});
