import { clearSession, getFreshToken } from "@/lib/auth/session";

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
  const token = await getFreshToken();

  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
  }




  const isMultipart = init?.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (!isMultipart) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...defaultHeaders,
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

    if (res.status === 401) {
      // Token expired or invalid — purge local session and signal the
      // AuthContext to wipe React state so AuthGuard redirects to /login.
      clearSession();
      if (globalThis.window !== undefined) {
        globalThis.dispatchEvent(new Event("llosa:unauthorized"));
      }
      throw new ApiError(
        "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
        res.status,
        path,
      );
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

    return undefined as T;
  }

  try {
    const json = JSON.parse(text) as T;

    return json;
  } catch {

    return text as unknown as T;
  }
}
