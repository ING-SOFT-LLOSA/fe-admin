import { getStoredToken } from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getStoredToken();

  if (typeof window !== "undefined") {
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        const freshToken = await auth.currentUser.getIdToken(false);
        if (freshToken) {
          token = freshToken;
          const { saveSession, getStoredPerfil } = await import("@/lib/auth/session");
          const perfil = getStoredPerfil();
          if (perfil) {
            saveSession(freshToken, perfil);
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo refrescar el token de Firebase:", err);
    }
  }

  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
  }

  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  console.log(`🚀 ${init?.method || "GET"} ${path}`, body || "");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let message = detail;
    try {
      const json = JSON.parse(detail) as { error?: string; message?: string };
      message = json.error ?? json.message ?? detail;
    } catch {
      /* no JSON */
    }

    if (res.status === 403) {
      throw new ApiError(
        message ||
          "No tienes permisos para ejecutar esta acción. Solicita autorización o revisa los permisos del rol activo.",
        res.status,
        path,
      );
    }

    throw new ApiError(message || `Error ${res.status} en ${path}`, res.status, path);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    console.log(`📥 ${res.status} ${path}`);
    return undefined as T;
  }

  try {
    const json = JSON.parse(text) as T;
    console.log(`📥 ${res.status} ${path}`, json);
    return json;
  } catch {
    console.log(`📥 ${res.status} ${path}`, text);
    return text as unknown as T;
  }
}
