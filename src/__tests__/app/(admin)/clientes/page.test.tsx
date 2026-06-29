/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ClientsPage from '@/app/(admin)/clientes/page';

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  mapUsuarioToClienteRow: vi.fn(),
}));

vi.mock("@/modules/clientes/components/CreateClienteModal", () => ({
  default: ({ open, onClose, onCreated }: any) =>
    open ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>close-create</button>
        <button onClick={onCreated}>created-create</button>
      </div>
    ) : null,
}));

vi.mock("@/modules/asignaciones/components/AssignPropertyWizard", () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="assign-wizard">
      <button onClick={onClose}>close-wizard</button>
      <button onClick={onSuccess}>success-wizard</button>
    </div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import { useRouter } from "next/navigation";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockMap = vi.mocked(mapUsuarioToClienteRow);
const mockUseRouter = vi.mocked(useRouter);

const sampleUsers = [
  {
    id: 1,
    nombre: "Ana",
    apellidos: "García",
    email: "ana@test.com",
    tipoUsuario: "CLIENTE",
    rol: "USER",
    activo: true,
    telefono: "999888777",
    documentoIdentidad: "12345678",
    funciones: [],
  },
  {
    id: 2,
    nombre: "Luis",
    apellidos: "Pérez",
    email: "luis@test.com",
    tipoUsuario: "CLIENTE",
    rol: "USER",
    activo: false,
    telefono: "999111222",
    documentoIdentidad: "22222222",
    funciones: [],
  },
  {
    id: 3,
    nombre: "EmpleadoX",
    apellidos: "Test",
    email: "empleado@test.com",
    tipoUsuario: "EMPLEADO",
    rol: "USER",
    activo: true,
    funciones: [],
  },
];

const sampleRow = {
  id: 1,
  initials: "AG",
  name: "Ana García",
  dni: "12345678",
  email: "ana@test.com",
  phone: "999888777",
  project: "—",
  status: "ACTIVO",
  statusBg: "bg-green-100",
  tipoUsuario: "CLIENTE",
  rol: "USER",
  createdAt: "2026-01-01",
};

describe("ClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
    mockFetchUsuarios.mockResolvedValue(sampleUsers as any);
    mockMap.mockImplementation((u) => ({ ...sampleRow, id: u.id, name: `${u.nombre} ${u.apellidos}`, email: u.email, status: u.activo ? "ACTIVO" : "INACTIVO" }));
  });

  it("muestra el título y descripción de la página", async () => {
    render(<ClientsPage />);
    expect(screen.getByText("Clientes y Asignaciones")).toBeDefined();
    expect(
      screen.getByText(/Registra clientes, gestiona sus datos y vincula unidades/),
    ).toBeDefined();
  });

  it("muestra el estado de carga inicialmente", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    render(<ClientsPage />);
    expect(screen.getByText(/Cargando clientes/)).toBeDefined();
  });

  it("filtra solo los usuarios tipo CLIENTE", async () => {
    render(<ClientsPage />);
    await screen.findByText("Ana García");
    expect(screen.getByText("Luis Pérez")).toBeDefined();
    expect(screen.queryByText("EmpleadoX Test")).toBeNull();
  });

  it("muestra email y teléfono de cada cliente", async () => {
    render(<ClientsPage />);
    await screen.findByText("Ana García");
    expect(screen.getByText("ana@test.com")).toBeDefined();
    expect(screen.getByText("luis@test.com")).toBeDefined();
  });

  it("muestra estado ACTIVO e INACTIVO", async () => {
    render(<ClientsPage />);
    await screen.findByText("Ana García");
    expect(screen.getByText("ACTIVO")).toBeDefined();
    expect(screen.getByText("INACTIVO")).toBeDefined();
  });

  it("muestra error si fetchUsuarios falla", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("Network error"));
    render(<ClientsPage />);
    expect(await screen.findByText("Network error")).toBeDefined();
  });

  it("muestra error genérico si falla con un error no-Error", async () => {
    mockFetchUsuarios.mockRejectedValue("crudo");
    render(<ClientsPage />);
    expect(
      await screen.findByText("No se pudieron cargar los clientes."),
    ).toBeDefined();
  });

  it("permite buscar clientes por texto", async () => {
    render(<ClientsPage />);
    await screen.findByText("Ana García");

    const input = screen.getByPlaceholderText("Buscar cliente...");
    fireEvent.change(input, { target: { value: "Luis" } });
    fireEvent.click(screen.getByRole("button", { name: /^Buscar$/ }));

    await waitFor(() => {
      expect(screen.queryByText("Ana García")).toBeNull();
      expect(screen.getByText("Luis Pérez")).toBeDefined();
    });
  });

  it("filtra por email en la búsqueda", async () => {
    render(<ClientsPage />);
    await screen.findByText("Ana García");

    const input = screen.getByPlaceholderText("Buscar cliente...");
    fireEvent.change(input, { target: { value: "ana@test" } });
    fireEvent.click(screen.getByRole("button", { name: /^Buscar$/ }));

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeDefined();
      expect(screen.queryByText("Luis Pérez")).toBeNull();
    });
  });

  it("navega al perfil del cliente al hacer clic en la fila", async () => {
    const push = vi.fn();
    mockUseRouter.mockReturnValue({ push } as any);
    render(<ClientsPage />);
    const row = await screen.findByText("Ana García");
    fireEvent.click(row);
    expect(push).toHaveBeenCalledWith("/clientes/1");
  });

  it("abre el modal de Crear Cliente al hacer clic en el botón", async () => {
    render(<ClientsPage />);
    await screen.findByText("Clientes y Asignaciones");
    fireEvent.click(screen.getAllByText("Crear cliente")[0]);
    expect(screen.getByTestId("create-modal")).toBeDefined();
  });

  it("abre el wizard de Asignar propiedad", async () => {
    render(<ClientsPage />);
    fireEvent.click(screen.getByText("Asignar propiedad"));
    expect(screen.getByTestId("assign-wizard")).toBeDefined();
  });

  it("re-carga clientes al cerrar el modal de creación", async () => {
    render(<ClientsPage />);
    await screen.findByText("Clientes y Asignaciones");

    mockFetchUsuarios.mockClear();
    fireEvent.click(screen.getAllByText("Crear cliente")[0]);
    fireEvent.click(screen.getByText("created-create"));

    await waitFor(() => {
      expect(mockFetchUsuarios).toHaveBeenCalled();
    });
  });

  it("permite navegar entre páginas (Anterior/Siguiente)", async () => {
    // Crear 15 clientes para llenar 2 páginas
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      nombre: `Cliente${i + 1}`,
      apellidos: "Test",
      email: `cliente${i + 1}@test.com`,
      tipoUsuario: "CLIENTE",
      rol: "USER",
      activo: true,
      telefono: "999",
      funciones: [],
    }));
    mockFetchUsuarios.mockResolvedValue(manyUsers as any);
    mockMap.mockImplementation((u) => ({
      ...sampleRow,
      id: u.id,
      name: `${u.nombre} ${u.apellidos}`,
      email: u.email,
    }));

    render(<ClientsPage />);
    await screen.findByText("Cliente1 Test");

    expect(screen.getByText((_, el) => el?.tagName.toLowerCase() === "p" && /Mostrando 1 a 10 de 15 clientes/.test(el.textContent || ""))).toBeDefined();
    const nextBtn = screen.getByTitle("Página siguiente");
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.tagName.toLowerCase() === "p" && /Mostrando 11 a 15 de 15 clientes/.test(el.textContent || ""))).toBeDefined();
    });
  });
});
