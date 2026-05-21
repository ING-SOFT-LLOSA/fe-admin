import { FirebaseError } from "firebase/app";

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
  "auth/popup-closed-by-user": "Inicio con Google cancelado.",
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
