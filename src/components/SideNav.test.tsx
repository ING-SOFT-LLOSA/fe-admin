/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SideNav from "./SideNav";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SideNav", () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(usePathname).mockReturnValue("/proyectos");
    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogout,
      perfil: { funciones: ["PROY_VER", "OBRA_VER", "PAGOS_VER"] },
    } as any);
  });

  it("muestra los items de navegación principales", () => {
    render(<SideNav />);
    expect(screen.getByText("Proyectos e Inventario")).toBeDefined();
    expect(screen.getByText("Clientes y Asignaciones")).toBeDefined();
    expect(screen.getByText("Avance de Obra")).toBeDefined();
    expect(screen.getByText("Gestión Legal")).toBeDefined();
    expect(screen.getByText("Pagos y Cronogramas")).toBeDefined();
    expect(screen.getByText("Agenda y Citas")).toBeDefined();
  });

  it("muestra el botón de Cerrar Sesión", () => {
    render(<SideNav />);
    expect(screen.getByText("Cerrar Sesión")).toBeDefined();
  });

  it("llama a logout y redirige a /login al cerrar sesión", () => {
    mockLogout.mockResolvedValue(undefined);
    render(<SideNav />);

    fireEvent.click(screen.getByText("Cerrar Sesión"));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("oculta la sección de Administración si el perfil no tiene permisos", () => {
    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogout,
      perfil: { funciones: ["PROY_VER"] },
    } as any);

    render(<SideNav />);
    expect(screen.queryByText("Gestión de Empleados")).toBeNull();
  });

  it("muestra la sección de Administración si el perfil tiene USER_GESTIONAR", () => {
    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogout,
      perfil: { funciones: ["USER_GESTIONAR", "ROL_GESTIONAR", "PROY_VER"] },
    } as any);

    render(<SideNav />);
    expect(screen.getByText("Gestión de Empleados")).toBeDefined();
  });

  it("resalta el link activo basado en pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/clientes/123");
    render(<SideNav />);

    const link = screen.getByText("Clientes y Asignaciones").closest("a");
    expect(link?.className).toContain("border-l-4");
  });
});
