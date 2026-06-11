import { apiFetch } from "@/lib/api/http";
import { 
  EtapaExpedienteRequest, 
  EtapaExpedienteResponse, 
  EtapaExpedienteEstadoRequest 
} from "@/types/etapas";

/**
 * EtapaExpedienteController - CRUD endpoints para etapas de expediente
 * Ruta base: /etapa-expediente
 */

/**
 * 1. GET /etapa-expediente/expediente/{uuidUsuarioActivo}
 * Listar etapas de expediente por usuario activo
 */
export function fetchEtapasExpediente(uuidUsuarioActivo: string): Promise<EtapaExpedienteResponse[]> {
  return apiFetch<EtapaExpedienteResponse[]>(`/etapa-expediente/expediente/${uuidUsuarioActivo}`);
}

/**
 * 2. GET /etapa-expediente/{uuid}
 * Obtener etapa de expediente por ID
 */
export function fetchEtapaExpedienteById(uuid: string): Promise<EtapaExpedienteResponse> {
  return apiFetch<EtapaExpedienteResponse>(`/etapa-expediente/${uuid}`);
}

/**
 * 3. POST /etapa-expediente/expediente/{uuidUsuarioActivo}
 * Crear nueva etapa de expediente
 */
export function createEtapaExpediente(
  uuidUsuarioActivo: string,
  payload: EtapaExpedienteRequest
): Promise<EtapaExpedienteResponse> {
  return apiFetch<EtapaExpedienteResponse>(`/etapa-expediente/expediente/${uuidUsuarioActivo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 4. PUT /etapa-expediente/{uuid}
 * Actualizar etapa de expediente existente
 */
export function updateEtapaExpediente(
  uuid: string,
  payload: EtapaExpedienteRequest
): Promise<EtapaExpedienteResponse> {
  return apiFetch<EtapaExpedienteResponse>(`/etapa-expediente/${uuid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 5. PATCH /etapa-expediente/{uuid}/estado
 * Actualizar estado de etapa de expediente
 */
export function updateEtapaExpedienteEstado(
  uuid: string,
  payload: EtapaExpedienteEstadoRequest
): Promise<EtapaExpedienteResponse> {
  return apiFetch<EtapaExpedienteResponse>(`/etapa-expediente/${uuid}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 6. DELETE /etapa-expediente/{uuid}
 * Eliminar etapa de expediente
 */
export function deleteEtapaExpediente(uuid: string): Promise<void> {
  return apiFetch<void>(`/etapa-expediente/${uuid}`, {
    method: "DELETE",
  });
}