import { getStoredToken, getFreshToken } from "@/lib/auth/session";
import { apiFetch } from "@/lib/api/http";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

export interface DocumentoResponse {
  id: string;
  nombreOriginal: string;
  tipoDocumento: "PDF_LEGAL" | "COMPROBANTE" | "FOTO_OBRA" | "VIDEO_OBRA";
  tipoMime: string;
  idReferencia: string;
  entidadReferencia: string;
  createdAt?: string;
  urlAcceso?: string;
}

export interface SignedUrlResponse {
  url: string;
  expiracion: string;
}

export async function uploadDocument(
  idReferencia: string,
  file: File,
  tipoDocumento: "PDF_LEGAL" | "COMPROBANTE" | "FOTO_OBRA" | "VIDEO_OBRA"
): Promise<DocumentoResponse> {
  const token = await getFreshToken();
  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const requestBlob = new Blob(
    [JSON.stringify({ tipoDocumento })],
    { type: "application/json" }
  );
  formData.append("data", requestBlob);

  const res = await fetch(`${API_URL}/api/documentos/${idReferencia}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const json = JSON.parse(errorText);
      message = json.error ?? json.message ?? errorText;
    } catch {
      // not JSON
    }
    throw new Error(message || "Error al subir el documento");
  }

  return res.json();
}

export async function fetchDocumentosByReferencia(
  idReferencia: string,
  tipoDocumento?: string
): Promise<DocumentoResponse[]> {
  const query = tipoDocumento ? `?tipoDocumento=${encodeURIComponent(tipoDocumento)}` : "";
  return apiFetch<DocumentoResponse[]>(`/api/documentos/${idReferencia}${query}`);
}

export const fetchDocumentosByUsuarioActivo = fetchDocumentosByReferencia;

export async function fetchSignedUrl(documentoId: string): Promise<SignedUrlResponse> {
  return apiFetch<SignedUrlResponse>(`/api/documentos/${documentoId}/signed-url`);
}

export async function deleteDocumento(documentoId: string): Promise<void> {
  return apiFetch<void>(`/api/documentos/${documentoId}`, {
    method: "DELETE",
  });
}
