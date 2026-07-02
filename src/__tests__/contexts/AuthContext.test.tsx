import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as api from "@/lib/auth/api";
import * as login from "@/lib/auth/login";
import * as session from "@/lib/auth/session";

// NOTE: vi.mock is hoisted, so we use a module-level variable + a factory
// that always updates it when AuthProvider registers a new listener.
let capturedAuthCb: ((user: unknown) => void) | null = null;

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    capturedAuthCb = cb;
    return () => { capturedAuthCb = null; };
  },
}));

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({}),
}));

vi.mock("@/lib/auth/api", () => ({ fetchPerfil: vi.fn() }));

vi.mock("@/lib/auth/login", () => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(),
  getStoredToken: vi.fn(),
  saveSession: vi.fn(),
}));

function makeFirebaseUser(token = "fresh-firebase-token") {
  return { getIdToken: vi.fn().mockResolvedValue(token) };
}

function TestConsumer() {
  const { perfil, token, isLoading, isAuthenticated, loginEmail, loginGoogle, logout } =
    useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "idle"}</div>
      <div data-testid="auth">{isAuthenticated ? "authenticated" : "unauthenticated"}</div>
      <div data-testid="username">{perfil ? perfil.nombre : "no-user"}</div>
      <div data-testid="token">{token ?? "no-token"}</div>
      <button data-testid="btn-login-email" onClick={() => loginEmail("t@t.com", "p")}>Login Email</button>
      <button data-testid="btn-login-google" onClick={() => loginGoogle()}>Login Google</button>
      <button data-testid="btn-logout" onClick={() => logout()}>Logout</button>
    </div>
  );
}

async function renderAndFire(firebaseUser: unknown) {
  await act(async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
  });
  // capturedAuthCb is now set (AuthProvider just registered it)
  await act(async () => {
    await capturedAuthCb!(firebaseUser);
  });
}

describe("AuthContext", () => {
  beforeEach(() => {
    capturedAuthCb = null;
    vi.clearAllMocks();
    vi.mocked(session.getStoredToken).mockReturnValue("mocked-stored-token-123");
  });

  it("restores session when Firebase provides a valid user", async () => {
    const mockPerfil = {
      id: 1, nombre: "Stored User", email: "stored@test.com",
      tipoUsuario: "EMPLEADO", rol: "ADMIN", activo: true, funciones: [],
    };
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);

    await renderAndFire(makeFirebaseUser());

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("idle"),
    );

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("username").textContent).toBe("Stored User");
    expect(screen.getByTestId("token").textContent).toBe("fresh-firebase-token");
    expect(session.saveSession).toHaveBeenCalledWith("fresh-firebase-token", mockPerfil);
  });

  it("is unauthenticated when Firebase provides null", async () => {
    await renderAndFire(null);

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("idle"),
    );

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(session.clearSession).toHaveBeenCalled();
  });

  it("clears session when fetchPerfil fails", async () => {
    vi.mocked(api.fetchPerfil).mockRejectedValue(new Error("Token expired"));

    await renderAndFire(makeFirebaseUser());

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("idle"),
    );

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(session.clearSession).toHaveBeenCalled();
  });

  it("logs in with email successfully", async () => {
    await renderAndFire(null);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("idle"),
    );

    const loggedInPerfil = {
      id: 2, nombre: "Email User", email: "email@test.com",
      tipoUsuario: "CLIENTE", rol: "USER", activo: true, funciones: [],
    };
    vi.mocked(login.loginWithEmail).mockResolvedValue(loggedInPerfil);
    vi.mocked(session.getStoredToken).mockReturnValue("new-token");

    await act(async () => { screen.getByTestId("btn-login-email").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("username").textContent).toBe("Email User"),
    );

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("token").textContent).toBe("new-token");
  });

  it("logs in with Google successfully", async () => {
    await renderAndFire(null);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("idle"),
    );

    const googlePerfil = {
      id: 3, nombre: "Google User", email: "google@test.com",
      tipoUsuario: "CLIENTE", rol: "USER", activo: true, funciones: [],
    };
    vi.mocked(login.loginWithGoogle).mockResolvedValue(googlePerfil);
    vi.mocked(session.getStoredToken).mockReturnValue("google-token");

    await act(async () => { screen.getByTestId("btn-login-google").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("username").textContent).toBe("Google User"),
    );

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    expect(screen.getByTestId("token").textContent).toBe("google-token");
  });

  it("logs out successfully", async () => {
    const mockPerfil = {
      id: 1, nombre: "Stored User", email: "stored@test.com",
      tipoUsuario: "EMPLEADO", rol: "ADMIN", activo: true, funciones: [],
    };
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);
    await renderAndFire(makeFirebaseUser());
    await waitFor(() =>
      expect(screen.getByTestId("auth").textContent).toBe("authenticated"),
    );

    await act(async () => { screen.getByTestId("btn-logout").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("auth").textContent).toBe("unauthenticated"),
    );

    expect(login.logout).toHaveBeenCalled();
  });

  it("logs out on llosa:unauthorized event", async () => {
    const mockPerfil = {
      id: 1, nombre: "Active User", email: "active@test.com",
      tipoUsuario: "EMPLEADO", rol: "ADMIN", activo: true, funciones: [],
    };
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);
    await renderAndFire(makeFirebaseUser());
    await waitFor(() =>
      expect(screen.getByTestId("auth").textContent).toBe("authenticated"),
    );

    await act(async () => {
      window.dispatchEvent(new Event("llosa:unauthorized"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("auth").textContent).toBe("unauthenticated")
    );
  });

  it("logs out after 1 hour of inactivity", async () => {
    const mockPerfil = {
      id: 1, nombre: "Active User", email: "active@test.com",
      tipoUsuario: "EMPLEADO", rol: "ADMIN", activo: true, funciones: [],
    };
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);

    vi.useFakeTimers();
    const systemTime = 1000000000000;
    vi.setSystemTime(systemTime);

    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    await act(async () => {
      await capturedAuthCb!(makeFirebaseUser());
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");

    await act(async () => {
      vi.advanceTimersByTime(3600000 + 60000);
    });

    expect(login.logout).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("keeps user logged in if there is activity", async () => {
    const mockPerfil = {
      id: 1, nombre: "Active User", email: "active@test.com",
      tipoUsuario: "EMPLEADO", rol: "ADMIN", activo: true, funciones: [],
    };
    vi.mocked(api.fetchPerfil).mockResolvedValue(mockPerfil);

    vi.useFakeTimers();
    const systemTime = 1000000000000;
    vi.setSystemTime(systemTime);

    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    await act(async () => {
      await capturedAuthCb!(makeFirebaseUser());
    });

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");

    await act(async () => {
      vi.advanceTimersByTime(45 * 60 * 1000);
    });

    await act(async () => {
      window.dispatchEvent(new Event("mousemove"));
    });

    await act(async () => {
      vi.advanceTimersByTime(45 * 60 * 1000);
    });

    expect(login.logout).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(65 * 60 * 1000);
    });

    expect(login.logout).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
