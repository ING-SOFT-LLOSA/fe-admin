/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ClientsPage from "@/app/(admin)/clientes/page";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { fetchUsuarios } from "@/lib/api/users";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  mapUsuarioToClienteRow: vi.fn((u: any) => ({
    id: u.id,
    initials: `${u.nombre?.[0] ?? ""}${u.apellidos?.[0] ?? ""}`.toUpperCase(),
    name: `${u.nombre} ${u.apellidos ?? ""}`.trim(),
    email: u.email,
    phone: u.telefono ?? "-",
    project: u.project ?? "Edificio Central",
    status: u.activo ? "Activo" : "Inactivo",
    statusBg: u.activo ? "bg-emerald-50" : "bg-slate-100",
  })),
}));

const mockPush = vi.fn();
const mockPerfil = { id: 1, nombre: "Admin" };
const clientes = [
  { id: 1, nombre: "Ana", apellidos: "Paredes", email: "ana@test.com", telefono: "999", tipoUsuario: "CLIENTE", activo: true },
  { id: 2, nombre: "Bruno", apellidos: "Lopez", email: "bruno@test.com", telefono: "888", tipoUsuario: "CLIENTE", activo: false },
];

describe("ClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ perfil: mockPerfil } as never);
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never);
    vi.mocked(fetchUsuarios).mockResolvedValue(clientes as never);
  });

  it("renders without crashing", async () => {
    render(<ClientsPage />);
    expect(screen.getByText("Clientes y Asignaciones")).toBeDefined();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(fetchUsuarios).mockImplementation(() => new Promise(() => {}));
    render(<ClientsPage />);
    expect(screen.getByText("Cargando clientes...")).toBeDefined();
  });

  it("shows error message when API fails", async () => {
    vi.mocked(fetchUsuarios).mockRejectedValue(new Error("No se pudieron cargar los clientes."));
    render(<ClientsPage />);
    expect(await screen.findByText("No se pudieron cargar los clientes.")).toBeDefined();
  });

  it("shows correct data when API resolves successfully", async () => {
    render(<ClientsPage />);
    expect(await screen.findByText("Ana Paredes")).toBeDefined();
    expect(screen.getByText("ana@test.com")).toBeDefined();
  });

  it("filters rows by search input", async () => {
    render(<ClientsPage />);

    expect(await screen.findByText("Ana Paredes")).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText("Buscar cliente..."), {
      target: { value: "Bruno" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.queryByText("Ana Paredes")).toBeNull();
      expect(screen.getByText("Bruno Lopez")).toBeDefined();
    });
  });
});
