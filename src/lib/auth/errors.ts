import { FirebaseError } from "firebase/app";

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña inválido.",
  "auth/user-not-found": "Correo o contraseña inválido.",
  "auth/wrong-password": "Correo o contraseña inválido.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
  "auth/popup-closed-by-user": "Inicio con Google cancelado.",
  "auth/user-disabled": "Tu cuenta de usuario está inactiva o deshabilitada. Si crees que es un error, por favor contacta al administrador del sistema.",
};

export function toAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return FIREBASE_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo iniciar sesión.";
}
