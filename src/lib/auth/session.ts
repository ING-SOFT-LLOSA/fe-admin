import type { PerfilConPermisos } from "@/types/auth";

const TOKEN_KEY = "llosa_id_token";
const PERFIL_KEY = "llosa_perfil";

export function saveSession(token: string, perfil: PerfilConPermisos): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PERFIL_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function getFreshToken(): Promise<string | null> {
  let token = getStoredToken();
  if (typeof window !== "undefined") {
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        const freshToken = await auth.currentUser.getIdToken(false);
        if (freshToken) {
          if (freshToken !== token) {
            token = freshToken;
            const perfil = getStoredPerfil();
            if (perfil) {
              saveSession(freshToken, perfil);
            }
          } else {
            token = freshToken;
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo refrescar el token de Firebase:", err);
    }
  }
  return token;
}

export function getStoredPerfil(): PerfilConPermisos | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PERFIL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PerfilConPermisos;
  } catch {
    return null;
  }
}
