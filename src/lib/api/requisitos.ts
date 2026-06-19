import { apiFetch } from "@/lib/api/http";
import { getStoredToken, getFreshToken } from "@/lib/auth/session";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

export interface DocumentoItem {
  id: string;
  title: string;
  description: string;
  status: string; // 'pendiente' | 'completada' etc.
  emissionDate: string | null;
  hasDownload: boolean;
  downloadUrl: string | null;
  hasPreview: boolean;
  notaCorporativa: string | null;
  icon: string;
}

export interface StageDocumentResponse {
  title: string;
  totalCount: number;
  documents: DocumentoItem[];
}

export interface RequisitoCreatePayload {
  etapaProcesoCompraId: string;
  titulo:               string;
  descripcion?:         string;
  notaCorporativa?:     string;
  fechaEmision?:        string;
  icono?:               string;
}

export interface RequisitoResponseDTO {
  id: string;
  etapaProcesoCompraId: string;
  titulo: string;
  descripcion: string | null;
  notaCorporativa: string | null;
  estado: string;
  fechaEmision: string | null;
  icono: string | null;
}

export interface RequisitoUpdatePayload {
  titulo: string;
  descripcion?: string;
  notaCorporativa?: string;
  estado?: string;
  fechaEmision?: string;
  icono?: string;
}

/**
 * Fetch stage documents (requirements list) for a specific process stage.
 * GET /api/stage/{etapaProceso}/documents?uuidUsuarioActivo=xxx
 */
export function fetchStageDocuments(
  etapaProceso: "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO" | "OTRO",
  uuidUsuarioActivo: string
): Promise<StageDocumentResponse> {
  return apiFetch<StageDocumentResponse>(
    `/api/stage/${etapaProceso}/documents?uuidUsuarioActivo=${uuidUsuarioActivo}`
  );
}

/**
 * Upload a file to satisfy a specific documental requirement.
 * POST /api/requisitos-documentales/{requisitoId}/upload
 */
export async function uploadRequisitoArchivo(requisitoId: string, file: File): Promise<void> {
  const token = await getFreshToken();
  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/requisitos-documentales/${requisitoId}/upload`, {
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
    throw new Error(message || "Error al subir el archivo del requisito");
  }
}

/**
 * Delete a file from a documental requirement, returning it to 'PENDIENTE'.
 * DELETE /api/requisitos-documentales/{requisitoId}/upload
 */
export function deleteRequisitoArchivo(requisitoId: string): Promise<void> {
  return apiFetch<void>(`/api/requisitos-documentales/${requisitoId}/upload`, {
    method: "DELETE",
  });
}

/**
 * Create a new custom requirement.
 * POST /api/requisitos-documentales
 */
export function createRequisito(payload: RequisitoCreatePayload): Promise<RequisitoResponseDTO> {
  return apiFetch<RequisitoResponseDTO>("/api/requisitos-documentales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Update dynamic properties of a requirement (like title, description, or notes).
 * PUT /api/requisitos-documentales/{id}
 */
export function updateRequisito(requisitoId: string, payload: RequisitoUpdatePayload): Promise<void> {
  return apiFetch<void>(`/api/requisitos-documentales/${requisitoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a requirement completely.
 * DELETE /api/requisitos-documentales/{id}
 */
export function deleteRequisito(requisitoId: string): Promise<void> {
  return apiFetch<void>(`/api/requisitos-documentales/${requisitoId}`, {
    method: "DELETE",
  });
}
