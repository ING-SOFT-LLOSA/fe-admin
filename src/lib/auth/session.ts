import type { PerfilConPermisos } from "@/types/auth";

const TOKEN_KEY = "llosa_id_token";
const PERFIL_KEY = "llosa_perfil";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function saveSession(token: string, _perfil: PerfilConPermisos): void {
  if (globalThis.window === undefined) return;
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSession(): void {
  if (globalThis.window === undefined) return;
  try {
    localStorage?.removeItem(TOKEN_KEY);
    localStorage?.removeItem(PERFIL_KEY);
  } catch {
    // localStorage may not be available (e.g., jsdom without full Web API)
  }
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredToken(): string | null {
  if (globalThis.window === undefined) return null;
  const reg = new RegExp('(?:^| )' + TOKEN_KEY + '=([^;]+)');
  const match = reg.exec(document.cookie);
  return match ? match[1] : null;
}

export async function getFreshToken(): Promise<string | null> {
  if (globalThis.window === undefined) return null;

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


