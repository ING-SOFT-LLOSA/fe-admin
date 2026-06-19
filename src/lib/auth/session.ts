import type { PerfilConPermisos } from "@/types/auth";

const TOKEN_KEY = "llosa_id_token";
const PERFIL_KEY = "llosa_perfil";

export function saveSession(token: string, _perfil: PerfilConPermisos): void {
  void _perfil;
  if (typeof window === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY); // Legacy cleanup
  localStorage.removeItem(PERFIL_KEY); // Legacy cleanup
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )' + TOKEN_KEY + '=([^;]+)'));
  return match ? match[2] : null;
}

export async function getFreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const auth = getFirebaseAuth();

    // If Firebase has no current user yet (e.g. tab reload while Firebase
    // is still initialising) we must NOT fall back to a possibly-expired
    // localStorage token.  Return null so the caller can handle it.
    if (!auth.currentUser) {
      return null;
    }

    // getIdToken(true) → always hits Firebase to verify / rotate the JWT.
    // Firebase renews it automatically when it is within 5 min of expiry.
    const freshToken = await auth.currentUser.getIdToken(true);

    if (freshToken) {
      const stored = getStoredToken();
      if (freshToken !== stored) {
        // We only care about the token here since we don't persist the profile anymore
        saveSession(freshToken, null as unknown as PerfilConPermisos); // We can pass null because we removed PERFIL storage
      }
    }

    return freshToken ?? null;
  } catch (err) {
    console.warn("No se pudo refrescar el token de Firebase:", err);
    return null;
  }
}


