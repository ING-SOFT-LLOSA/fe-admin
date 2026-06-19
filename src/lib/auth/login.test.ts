/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirebaseError } from "firebase/app";

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProvider {},
}));

vi.mock("@/lib/auth/api", () => ({ fetchPerfil: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: vi.fn().mockReturnValue({}),
}));

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { fetchPerfil } from "@/lib/auth/api";
import { saveSession, clearSession } from "@/lib/auth/session";
import { loginWithEmail, loginWithGoogle, logout, resetPassword } from "./login";
import { toAuthErrorMessage } from "./errors";

const mockSignIn = vi.mocked(signInWithEmailAndPassword);
const mockSignInWithPopup = vi.mocked(signInWithPopup);
const mockSignOut = vi.mocked(signOut);
const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
const mockFetchPerfil = vi.mocked(fetchPerfil);
const mockSaveSession = vi.mocked(saveSession);
const mockClearSession = vi.mocked(clearSession);

const mockPerfil = {
  id: 1,
  nombre: "Admin",
  email: "admin@empresa.com",
  tipoUsuario: "EMPLEADO",
  rol: "ADMIN",
  activo: true,
  funciones: [],
};

const mockUser = {
  getIdToken: vi.fn().mockResolvedValue("id-token-firebase"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser.getIdToken.mockResolvedValue("id-token-firebase");
  mockFetchPerfil.mockResolvedValue(mockPerfil);
});

describe("loginWithEmail", () => {
  it("retorna el perfil cuando Firebase y el backend aceptan las credenciales", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    const result = await loginWithEmail("admin@empresa.com", "SecurePass123");
    expect(result).toEqual(mockPerfil);
  });

  it("llama a fetchPerfil con el token de Firebase", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    await loginWithEmail("admin@empresa.com", "SecurePass123");
    expect(mockFetchPerfil).toHaveBeenCalledWith("id-token-firebase");
  });

  it("solicita un ID token de Firebase para enviarlo al backend", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    await loginWithEmail("admin@empresa.com", "SecurePass123");
    expect(mockUser.getIdToken).toHaveBeenCalledOnce();
  });

  it("llama a saveSession con el token y el perfil", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    await loginWithEmail("admin@empresa.com", "SecurePass123");
    expect(mockSaveSession).toHaveBeenCalledWith("id-token-firebase", mockPerfil);
  });

  it("propaga el error si Firebase rechaza las credenciales", async () => {
    mockSignIn.mockRejectedValue(new Error("Firebase: auth/wrong-password"));
    await expect(loginWithEmail("user@test.com", "wrongPass")).rejects.toThrow(
      "Firebase: auth/wrong-password"
    );
    expect(mockFetchPerfil).not.toHaveBeenCalled();
    expect(mockSaveSession).not.toHaveBeenCalled();
  });

  it("propaga el error si fetchPerfil lanza un error (dominio no autorizado)", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    mockFetchPerfil.mockRejectedValue(new Error("Cuenta inactiva o deshabilitada"));
    await expect(loginWithEmail("hacker@gmail.com", "password")).rejects.toThrow(
      "Cuenta inactiva o deshabilitada"
    );
    expect(mockSaveSession).not.toHaveBeenCalled();
  });

  it("el backend protege el sistema: fetchPerfil lanza 403 si el dominio no está autorizado", async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as any);
    mockFetchPerfil.mockRejectedValue(new Error("Sesión inválida. Vuelve a iniciar sesión."));
    await expect(loginWithEmail("intruso@gmail.com", "ValidPassword123!"))
      .rejects.toThrow("Sesión inválida. Vuelve a iniciar sesión.");
  });
});

describe("loginWithGoogle", () => {
  it("retorna el perfil cuando Google y el backend aceptan la autenticación", async () => {
    mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);
    const result = await loginWithGoogle();
    expect(result).toEqual(mockPerfil);
    expect(mockFetchPerfil).toHaveBeenCalledWith("id-token-firebase");
  });

  it("llama a saveSession tras un login exitoso con Google", async () => {
    mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);
    await loginWithGoogle();
    expect(mockSaveSession).toHaveBeenCalledWith("id-token-firebase", mockPerfil);
  });

  it("propaga el error si el popup es cerrado por el usuario", async () => {
    mockSignInWithPopup.mockRejectedValue(new Error("Popup closed"));
    await expect(loginWithGoogle()).rejects.toThrow("Popup closed");
  });

  it("propaga el error si fetchPerfil falla", async () => {
    mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);
    mockFetchPerfil.mockRejectedValue(new Error("Dominio no autorizado"));
    await expect(loginWithGoogle()).rejects.toThrow("Dominio no autorizado");
  });
});

describe("logout", () => {
  it("llama a clearSession antes de cerrar la sesión de Firebase", async () => {
    mockSignOut.mockResolvedValue(undefined);
    await logout();
    expect(mockClearSession).toHaveBeenCalledOnce();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("no lanza error si signOut de Firebase falla (sin sesión activa)", async () => {
    mockSignOut.mockRejectedValue(new Error("No user signed in"));
    await expect(logout()).resolves.toBeUndefined();
    expect(mockClearSession).toHaveBeenCalledOnce();
  });
});

describe("resetPassword", () => {
  it("llama a sendPasswordResetEmail con el email", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    await resetPassword("user@empresa.com");
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "user@empresa.com"
    );
  });

  it("propaga el error si Firebase no encuentra el email", async () => {
    mockSendPasswordResetEmail.mockRejectedValue(new Error("auth/user-not-found"));
    await expect(resetPassword("noexiste@test.com")).rejects.toThrow(
      "auth/user-not-found"
    );
  });
});

describe("toAuthErrorMessage", () => {
  it("auth/invalid-credential → 'Correo o contraseña inválido.'", () => {
    const err = new FirebaseError("auth/invalid-credential", "Firebase: invalid-credential");
    expect(toAuthErrorMessage(err)).toBe("Correo o contraseña inválido.");
  });

  it("auth/wrong-password → 'Correo o contraseña inválido.'", () => {
    const err = new FirebaseError("auth/wrong-password", "Firebase: wrong-password");
    expect(toAuthErrorMessage(err)).toBe("Correo o contraseña inválido.");
  });

  it("auth/user-not-found → 'Correo o contraseña inválido.'", () => {
    const err = new FirebaseError("auth/user-not-found", "Firebase: user-not-found");
    expect(toAuthErrorMessage(err)).toBe("Correo o contraseña inválido.");
  });

  it("auth/too-many-requests → 'Demasiados intentos. Espera un momento.'", () => {
    const err = new FirebaseError("auth/too-many-requests", "Firebase: too-many-requests");
    expect(toAuthErrorMessage(err)).toBe("Demasiados intentos. Espera un momento.");
  });

  it("error genérico de Error devuelve su message original", () => {
    const err = new Error("Sesión inválida. Vuelve a iniciar sesión.");
    expect(toAuthErrorMessage(err)).toBe("Sesión inválida. Vuelve a iniciar sesión.");
  });

  it("error desconocido devuelve mensaje genérico de fallback", () => {
    expect(toAuthErrorMessage({ code: "raro" })).toBe("No se pudo iniciar sesión.");
  });
});
