import type { PerfilConPermisos } from "@/types/auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

export async function fetchPerfil(token: string): Promise<PerfilConPermisos> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let message = detail;

    try {
      const json = JSON.parse(detail) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* body no es JSON */
    }

    if (res.status === 503) {
      throw new Error(
        message ||
          "El backend no tiene configurado Firebase. Pide firebase-service-account.json a tu equipo y reinicia Spring Boot.",
      );
    }

    if (res.status === 403) {
      throw new Error(message || "Sesión inválida. Vuelve a iniciar sesión.");
    }

    throw new Error(
      message || `No se pudo cargar el perfil (${res.status}). ¿Está el backend en ${API_URL}?`,
    );
  }

  return res.json() as Promise<PerfilConPermisos>;
}
