/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RoleGuard from "./RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("RoleGuard", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it("muestra null mientras auth está cargando", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
    } as any);

    const { container } = render(
      <RoleGuard allowedTipos={["EMPLEADO"]}>
        <div data-testid="child">Contenido</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("muestra null si no está autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    } as any);

    const { container } = render(
      <RoleGuard allowedTipos={["EMPLEADO"]}>
        <div data-testid="child">Contenido</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
  });

  it("redirige si el tipoUsuario no está en allowedTipos", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      perfil: { tipoUsuario: "CLIENTE" },
    } as any);

    const { container } = render(
      <RoleGuard allowedTipos={["EMPLEADO"]}>
        <div data-testid="child">Contenido</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("redirige a fallbackUrl personalizada si no está en allowedTipos", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      perfil: { tipoUsuario: "CLIENTE" },
    } as any);

    render(
      <RoleGuard allowedTipos={["EMPLEADO"]} fallbackUrl="/no-autorizado">
        <div data-testid="child">Contenido</div>
      </RoleGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith("/no-autorizado");
  });

  it("renderiza children si el tipoUsuario está en allowedTipos", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      perfil: { tipoUsuario: "EMPLEADO" },
    } as any);

    render(
      <RoleGuard allowedTipos={["EMPLEADO", "ADMIN"]}>
        <div data-testid="child">Contenido protegido</div>
      </RoleGuard>
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Contenido protegido")).toBeDefined();
  });
});
