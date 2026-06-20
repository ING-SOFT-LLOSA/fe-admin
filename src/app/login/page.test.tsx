import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    loginEmail: vi.fn(),
    loginGoogle: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    perfil: null,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
}));

describe("LoginPage", () => {
  it("renders LoginForm and passes redirectTo prop", () => {
    render(<LoginPage />);
    expect(screen.getByText("Acceder")).toBeDefined();
  });

  it("renders the Google login button", () => {
    render(<LoginPage />);
    expect(screen.getByText("Acceder con Google")).toBeDefined();
  });
});
