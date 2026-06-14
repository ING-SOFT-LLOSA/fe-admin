import type { PerfilConPermisos } from "@/types/auth";
// Removed mock imports


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
    let message = "";

    try {
      const json = JSON.parse(detail) as { error?: string; message?: string };
      message = json.message || json.error || detail;
    } catch {
      message = detail;
    }

    if (res.status === 503) {
      throw new Error(
        message ||
          "El backend no tiene configurado Firebase. Pide firebase-service-account.json a tu equipo y reinicia Spring Boot.",
      );
    }

    if (res.status === 403) {
      const isGeneric = !message || message.toLowerCase() === "forbidden" || message.toLowerCase() === "access denied";
      throw new Error(
        isGeneric
          ? "Tu cuenta de usuario está inactiva o deshabilitada. Si crees que es un error, por favor contacta al administrador del sistema."
          : message
      );
    }

    throw new Error(
      message || `No se pudo cargar el perfil (${res.status}). ¿Está el backend en ${API_URL}?`,
    );
  }

  return res.json() as Promise<PerfilConPermisos>;
}
