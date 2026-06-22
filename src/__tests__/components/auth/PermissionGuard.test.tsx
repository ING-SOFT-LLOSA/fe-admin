/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Mock the AuthContext hook
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("PermissionGuard", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it("should render null and not redirect if authentication is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: null,
      isLoading: true,
      isAuthenticated: false,
    } as any);

    render(
      <PermissionGuard requiredFuncs={["USER_VER"]}>
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should render null and not redirect if user is not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: null,
      isLoading: false,
      isAuthenticated: false,
    } as any);

    render(
      <PermissionGuard requiredFuncs={["USER_VER"]}>
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should render children if user is ADMIN, even if they lack required functions", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: {
        id: 1,
        nombre: "Admin",
        email: "admin@test.com",
        rol: "ADMIN",
        activo: true,
        funciones: [],
      },
      isLoading: false,
      isAuthenticated: true,
    } as any);

    render(
      <PermissionGuard requiredFuncs={["USER_GESTIONAR"]}>
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("protected-content").textContent).toBe("Secret Content");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should render children if user has required function", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: {
        id: 2,
        nombre: "Manager",
        email: "mgr@test.com",
        rol: "USER",
        activo: true,
        funciones: ["USER_GESTIONAR"],
      },
      isLoading: false,
      isAuthenticated: true,
    } as any);

    render(
      <PermissionGuard requiredFuncs={["USER_GESTIONAR"]}>
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("protected-content").textContent).toBe("Secret Content");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should redirect to fallbackUrl and render null if user lacks required functions", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: {
        id: 3,
        nombre: "Employee",
        email: "emp@test.com",
        rol: "USER",
        activo: true,
        funciones: ["USER_VER"],
      },
      isLoading: false,
      isAuthenticated: true,
    } as any);

    render(
      <PermissionGuard requiredFuncs={["USER_GESTIONAR"]} fallbackUrl="/custom-fallback">
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/custom-fallback");
  });

  it("should render children if no required functions are specified", () => {
    vi.mocked(useAuth).mockReturnValue({
      perfil: {
        id: 4,
        nombre: "Regular User",
        email: "user@test.com",
        rol: "USER",
        activo: true,
        funciones: [],
      },
      isLoading: false,
      isAuthenticated: true,
    } as any);

    render(
      <PermissionGuard>
        <div data-testid="protected-content">Secret Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("protected-content").textContent).toBe("Secret Content");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
