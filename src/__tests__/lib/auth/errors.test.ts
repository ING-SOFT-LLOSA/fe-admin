import { describe, it, expect } from "vitest";
import { FirebaseError } from "firebase/app";
import { toAuthErrorMessage } from '@/lib/auth/errors';

describe("toAuthErrorMessage", () => {
  it("should return correct message for known FirebaseError codes", () => {
    const error1 = new FirebaseError("auth/invalid-credential", "Invalid credentials");
    expect(toAuthErrorMessage(error1)).toBe("Correo o contraseña inválido.");

    const error2 = new FirebaseError("auth/user-not-found", "User not found");
    expect(toAuthErrorMessage(error2)).toBe("Correo o contraseña inválido.");

    const error3 = new FirebaseError("auth/popup-closed-by-user", "Popup closed");
    expect(toAuthErrorMessage(error3)).toBe("Inicio con Google cancelado.");

    const error4 = new FirebaseError("auth/user-disabled", "User disabled");
    expect(toAuthErrorMessage(error4)).toBe("Tu cuenta de usuario está inactiva o deshabilitada. Si crees que es un error, por favor contacta al administrador del sistema.");
  });

  it("should return the fallback error message for unknown FirebaseError codes", () => {
    const error = new FirebaseError("auth/unknown-code", "Some error occurred");
    expect(toAuthErrorMessage(error)).toBe("Some error occurred");
  });

  it("should return the error message for standard Error instances", () => {
    const error = new Error("Generic network failure");
    expect(toAuthErrorMessage(error)).toBe("Generic network failure");
  });

  it("should return a default message for unknown error types", () => {
    expect(toAuthErrorMessage("random string")).toBe("No se pudo iniciar sesión.");
    expect(toAuthErrorMessage(null)).toBe("No se pudo iniciar sesión.");
    expect(toAuthErrorMessage(undefined)).toBe("No se pudo iniciar sesión.");
    expect(toAuthErrorMessage({})).toBe("No se pudo iniciar sesión.");
  });
});
