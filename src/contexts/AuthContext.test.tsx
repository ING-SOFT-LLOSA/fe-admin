import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "@/lib/auth/api";
import * as login from "@/lib/auth/login";
import * as session from "@/lib/auth/session";

// Mock the imported modules
vi.mock("@/lib/auth/api", () => ({
  fetchPerfil: vi.fn(),
}));

vi.mock("@/lib/auth/login", () => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(),
  getStoredPerfil: vi.fn(),
  getStoredToken: vi.fn(),
  saveSession: vi.fn(),
}));

// Test consumer component
function TestConsumer() {
  const { perfil, token, isLoading, isAuthenticated, loginEmail, loginGoogle, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "idle"}</div>
      <div data-testid="auth">{isAuthenticated ? "authenticated" : "unauthenticated"}</div>
      <div data-testid="username">{perfil ? perfil.nombre : "no-user"}</div>
      <div data-testid="token">{token ? token : "no-token"}</div>
      <button data-testid="btn-login-email" onClick={() => loginEmail("test@test.com", "pass")}>
        Login Email
      </button>
      <button data-testid="btn-login-google" onClick={() => loginGoogle()}>
        Login Google
      </button>
      <button data-testid="btn-logout" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize as loading and restore session if token exists", async () => {
    const mockPerfil = {
      id: 1,
      nombre: "Stored User",
      email: "stored@test.com",
      tipoUsuario: "EMPLEADO",
      rol: "ADMIN",
      activo: true,
      funciones: [],
    };

    vi.mocked(session.getStoredToken).mockReturnValue("valid-token");
    vi.mocked(session.getStoredPerfil).mockReturnValue(mockPerfil);
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    // Wait until loading finishes and state updates
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("username").textContent).toBe("Stored User");
    expect(screen.getByTestId("token").textContent).toBe("valid-token");
    expect(session.saveSession).toHaveBeenCalledWith("valid-token", mockPerfil);
  });

  it("should finish loading as unauthenticated if no stored token is present", async () => {
    vi.mocked(session.getStoredToken).mockReturnValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
  });

  it("should clear session and finish loading if token restore fails", async () => {
    vi.mocked(session.getStoredToken).mockReturnValue("bad-token");
    vi.mocked(api.fetchPerfil).mockRejectedValue(new Error("Token expired"));

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(session.clearSession).toHaveBeenCalled();
  });

  it("should login with email successfully", async () => {
    vi.mocked(session.getStoredToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    const loggedInPerfil = {
      id: 2,
      nombre: "Email User",
      email: "email@test.com",
      tipoUsuario: "CLIENTE",
      rol: "USER",
      activo: true,
      funciones: [],
    };

    vi.mocked(login.loginWithEmail).mockResolvedValue(loggedInPerfil);
    // After login, it reads stored token from storage
    vi.mocked(session.getStoredToken).mockReturnValue("new-token");

    await act(async () => {
      screen.getByTestId("btn-login-email").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("Email User");
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("token").textContent).toBe("new-token");
  });

  it("should login with Google successfully", async () => {
    vi.mocked(session.getStoredToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    const googlePerfil = {
      id: 3,
      nombre: "Google User",
      email: "google@test.com",
      tipoUsuario: "CLIENTE",
      rol: "USER",
      activo: true,
      funciones: [],
    };

    vi.mocked(login.loginWithGoogle).mockResolvedValue(googlePerfil);
    vi.mocked(session.getStoredToken).mockReturnValue("google-token");

    await act(async () => {
      screen.getByTestId("btn-login-google").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("Google User");
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("token").textContent).toBe("google-token");
  });

  it("should logout successfully", async () => {
    const mockPerfil = {
      id: 1,
      nombre: "Stored User",
      email: "stored@test.com",
      tipoUsuario: "EMPLEADO",
      rol: "ADMIN",
      activo: true,
      funciones: [],
    };

    vi.mocked(session.getStoredToken).mockReturnValue("valid-token");
    vi.mocked(session.getStoredPerfil).mockReturnValue(mockPerfil);
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");

    await act(async () => {
      screen.getByTestId("btn-logout").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    });

    expect(screen.getByTestId("username").textContent).toBe("no-user");
    expect(screen.getByTestId("token").textContent).toBe("no-token");
    expect(login.logout).toHaveBeenCalled();
  });
});
