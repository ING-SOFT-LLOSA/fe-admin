/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmployeeSideNav from "./EmployeeSideNav";
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

describe("EmployeeSideNav", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(usePathname).mockReturnValue("/employee/dashboard");
    vi.mocked(useAuth).mockReturnValue({
      perfil: { funciones: ["CONTRATO_VER", "OBRA_VER"] },
    } as any);
  });

  it("muestra los items de navegación del portal empleado", () => {
    render(<EmployeeSideNav />);
    expect(screen.getByText("Mi Dashboard")).toBeDefined();
    expect(screen.getByText("Mis Clientes")).toBeDefined();
    expect(screen.getByText("Mis Contratos")).toBeDefined();
    expect(screen.getByText("Cronograma")).toBeDefined();
    expect(screen.getByText("Avances de Obra")).toBeDefined();
    expect(screen.getByText("Seguimiento")).toBeDefined();
  });

  it("muestra un badge en Seguimiento", () => {
    render(<EmployeeSideNav />);
    expect(screen.getByText("3")).toBeDefined();
  });

  it("oculta items que requieren permisos que el perfil no tiene", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: { funciones: [] },
    } as any);

    render(<EmployeeSideNav />);
    expect(screen.queryByText("Mis Contratos")).toBeNull();
    expect(screen.queryByText("Avances de Obra")).toBeNull();
  });

  it("mantiene items sin requiredFuncs visibles incluso sin permisos", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: { funciones: [] },
    } as any);

    render(<EmployeeSideNav />);
    expect(screen.getByText("Mi Dashboard")).toBeDefined();
    expect(screen.getByText("Mis Clientes")).toBeDefined();
    expect(screen.getByText("Cronograma")).toBeDefined();
    expect(screen.getByText("Seguimiento")).toBeDefined();
  });

  it("resalta el link activo basado en pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/employee/clients");
    render(<EmployeeSideNav />);

    const link = screen.getByText("Mis Clientes").closest("a");
    expect(link?.className).toContain("bg-white");
  });

  it("redirige a /login al hacer clic en Cerrar Sesión", () => {
    render(<EmployeeSideNav />);

    fireEvent.click(screen.getByText("Cerrar Sesión"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("muestra el título Portal Empleado", () => {
    render(<EmployeeSideNav />);
    expect(screen.getByText("Portal Empleado")).toBeDefined();
    expect(screen.getByText("Llosa Edificaciones")).toBeDefined();
  });
});
