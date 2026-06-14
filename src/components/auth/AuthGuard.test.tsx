import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthGuard from "./AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

// Mock the AuthContext hook
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe("AuthGuard", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it("should show loading screen if auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
    } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <AuthGuard>
        <div data-testid="child-content">Protected Children</div>
      </AuthGuard>
    );

    expect(screen.getByText("Cargando sesión…")).toBeDefined();
    expect(screen.queryByTestId("child-content")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should redirect to /login and return null if not authenticated and on protected path", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    const { container } = render(
      <AuthGuard>
        <div data-testid="child-content">Protected Children</div>
      </AuthGuard>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("child-content")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("should not redirect and render children if not authenticated but already on login path", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    } as any);
    vi.mocked(usePathname).mockReturnValue("/login");

    render(
      <AuthGuard>
        <div data-testid="child-content">Login Form Children</div>
      </AuthGuard>
    );

    expect(screen.getByTestId("child-content")).toBeDefined();
    expect(screen.getByText("Login Form Children")).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should render children if authenticated and on any path", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <AuthGuard>
        <div data-testid="child-content">Protected Children</div>
      </AuthGuard>
    );

    expect(screen.getByTestId("child-content")).toBeDefined();
    expect(screen.getByText("Protected Children")).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
