import { apiFetch } from "@/lib/api/http";

export interface CitaResponse {
  id: string;
  tipoEvento: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fechaInicio: string; // ISO string
  fechaFin: string; // ISO string
  estadoCita: "PROGRAMADA" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
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
