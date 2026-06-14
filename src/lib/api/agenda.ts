import { apiFetch } from "@/lib/api/http";

export interface CitaResponse {
  id: string;
  tipoEvento: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fechaInicio: string; // ISO string
  fechaFin: string; // ISO string
  estadoCita: "PROGRAMADA" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "REPROGRAMACION_PENDIENTE";
  confirmacionCliente: boolean | null;
  permiteReprogramacion: boolean;
  clienteUsaGoogle: boolean;
  estadoSincronizacion: string;
  googleEventId: string;
  clienteId: number;
  clienteNombre: string;
  clienteEmail: string;
  gestorId: number;
  gestorNombre: string;
  activoId: string;
  activoNro: string;
  disponibilidades?: DisponibilidadResponse[];
}

export interface CrearCitaPayload {
  clienteId: number;
  activoId: string;
  tipoEvento: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fechaInicio: string; // ISO LocalDateTime format: 'yyyy-MM-ddTHH:mm:ss'
  fechaFin: string; // ISO LocalDateTime format: 'yyyy-MM-ddTHH:mm:ss'
  permiteReprogramacion: boolean;
  clienteUsaGoogle: boolean;
  
  // Positional fallbacks for Jackson record deserialization when compiled without -parameters
  arg0?: number;
  arg1?: string;
  arg2?: string;
  arg3?: string;
  arg4?: string;
  arg5?: string;
  arg6?: string;
  arg7?: string;
  arg8?: boolean;
  arg9?: boolean;
}

export function fetchCitasCalendario(inicio: string, fin: string): Promise<CitaResponse[]> {
  return apiFetch<CitaResponse[]>(`/api/agenda/empresa/citas/calendario?inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`);
}

export function crearCita(payload: CrearCitaPayload): Promise<CitaResponse> {
  return apiFetch<CitaResponse>("/api/agenda/empresa/citas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function cancelarCita(id: string, motivo: string): Promise<CitaResponse> {
  return apiFetch<CitaResponse>(`/api/agenda/empresa/citas/${id}?motivo=${encodeURIComponent(motivo)}`, {
    method: "DELETE",
  });
}

export function fetchCitasPorActivo(activoId: string): Promise<CitaResponse[]> {
  return apiFetch<CitaResponse[]>(`/api/agenda/empresa/citas/activo/${activoId}`);
}

// ─── PUT /api/agenda/empresa/citas/{id} ──────────────────────────────────────
export interface ActualizarCitaPayload {
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estadoCita?: "PROGRAMADA" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "REPROGRAMACION_PENDIENTE";
  permiteReprogramacion?: boolean;
  motivoCancelacion?: string;
}

export function actualizarCita(id: string, payload: ActualizarCitaPayload): Promise<CitaResponse> {
  return apiFetch<CitaResponse>(`/api/agenda/empresa/citas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── PATCH /api/agenda/empresa/citas/{id}/seleccionar-bloque ─────────────────
export function seleccionarBloqueDisponibilidad(id: string, bloqueId: number): Promise<CitaResponse> {
  return apiFetch<CitaResponse>(`/api/agenda/empresa/citas/${id}/seleccionar-bloque`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bloqueId }),
  });
}

// ─── GET /api/agenda/empresa/citas ───────────────────────────────────────────
export function fetchTodasLasCitas(): Promise<CitaResponse[]> {
  return apiFetch<CitaResponse[]>("/api/agenda/empresa/citas");
}

// ─── POST /api/agenda/empresa/sincronizar ─────────────────────────────────────
export interface SincronizarManualResponse {
  mensaje: string;
  citasProcesadas: number;
}

export function forzarSincronizacionManual(): Promise<SincronizarManualResponse> {
  return apiFetch<SincronizarManualResponse>("/api/agenda/empresa/sincronizar", {
    method: "POST",
  });
}

// ─── GET /api/agenda/cliente/citas ────────────────────────────────────────────
export function fetchCitasCliente(): Promise<CitaResponse[]> {
  return apiFetch<CitaResponse[]>("/api/agenda/cliente/citas");
}

// ─── GET /api/agenda/cliente/citas/proximas ───────────────────────────────────
export function fetchProximasCitasCliente(): Promise<CitaResponse[]> {
  return apiFetch<CitaResponse[]>("/api/agenda/cliente/citas/proximas");
}

// ─── PATCH /api/agenda/cliente/citas/{id}/respuesta ──────────────────────────
export interface ResponderCitaPayload {
  confirmado: boolean;
  nota?: string;
}

export function responderCitaCliente(id: string, payload: ResponderCitaPayload): Promise<CitaResponse> {
  return apiFetch<CitaResponse>(`/api/agenda/cliente/citas/${id}/respuesta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── POST /api/agenda/cliente/citas/{id}/disponibilidad ──────────────────────
export interface BloqueHorario {
  inicio: string; // ISO format
  fin: string; // ISO format
}

export interface DisponibilidadResponse {
  id: number;
  bloqueInicio: string;
  bloqueFin: string;
  seleccionado: boolean;
}

export function proponerDisponibilidadCliente(id: string, bloques: BloqueHorario[]): Promise<DisponibilidadResponse[]> {
  return apiFetch<DisponibilidadResponse[]>(`/api/agenda/cliente/citas/${id}/disponibilidad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bloques }),
  });
}
