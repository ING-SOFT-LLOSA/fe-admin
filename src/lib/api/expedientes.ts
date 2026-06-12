import { apiFetch } from "@/lib/api/http";

export interface AsignarActivoPayload {
  idsUsuarios: number[];
  idActivo: string;
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal: string;
  fechaAdquisicion: string;
}

export function asignarActivo(payload: AsignarActivoPayload): Promise<void> {
  return apiFetch<void>("/api/expedientes/asignar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchMisActivos(): Promise<import("@/lib/api/proyectos").ActivoResponseDTO[]> {
  return apiFetch<import("@/lib/api/proyectos").ActivoResponseDTO[]>("/api/expedientes/mis-activos");
}

export interface UsuarioActivoResponseDTO {
  uuidUsuarioActivo: string;
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal: string;
  fechaAdquisicion: string;
  activo?: import("@/lib/api/proyectos").ActivoResponseDTO;
}

export function fetchContratoActivo(uuidActivo: string): Promise<import("@/modules/finanzas/types").ContratoDetalleResponse> {
  return apiFetch<import("@/modules/finanzas/types").ContratoDetalleResponse>(`/api/expedientes/${uuidActivo}/contrato`);
}

// ─── Hitos Comerciales (Commercial milestones) ────────────────────────────────

export interface HitoComercialResponseDTO {
  uuidHitoComercial: string;
  uuidUsuarioActivo: string;
  etapaProceso: "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO";
  nombreHito: string;
  descripcion: string;
  orden: number;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO";
  fechaCompletado: string | null;
  createdAt: string;
}

export interface EtapaStepperResponseDTO {
  etapa: "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO";
  hitos: HitoComercialResponseDTO[];
  porcentajeAvance: number;
}

export interface StepperResponseDTO {
  uuidUsuarioActivo: string;
  etapas: EtapaStepperResponseDTO[];
}

export function fetchCommercialStepper(uuidUsuarioActivo: string): Promise<StepperResponseDTO> {
  return apiFetch<StepperResponseDTO>(`/api/comercial/stepper/${uuidUsuarioActivo}`);
}

export function createCommercialHito(payload: {
  uuidUsuarioActivo: string;
  etapaProceso: "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO";
  nombreHito: string;
  descripcion: string;
  orden: number;
}): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>("/api/comercial/hitos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateCommercialHitoEstado(uuidHito: string, estado: string): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>(`/api/comercial/hitos/${uuidHito}/estado?estado=${estado}`, {
    method: "PATCH",
  });
}

export function deleteCommercialHito(uuidHito: string): Promise<void> {
  return apiFetch<void>(`/api/comercial/hitos/${uuidHito}`, {
    method: "DELETE",
  });
}

export function updateCommercialHito(uuidHito: string, payload: {
  nombreHito: string;
  descripcion: string;
  orden?: number;
}): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>(`/api/comercial/hitos/${uuidHito}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

