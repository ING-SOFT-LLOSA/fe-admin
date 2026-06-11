import { apiFetch } from "@/lib/api/http";
import { EtapaProceso } from "@/types/etapas";

export interface CrearContratoPayload {
  idsUsuarios: number[];
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal?: string;
  fechaAdquisicion: string;
}

export interface AsignarActivoPayload {
  uuidUsuarioActivo: string;
  idsActivo: string[];
}

export async function asignarActivo(payload: {
  idsUsuarios: number[];
  idActivo: string;
  tipoFinanciamiento: string;
  faseComercial: string;
  estadoTramiteLegal: string;
  fechaAdquisicion: string;
}): Promise<void> {
  // Paso 1: crear el contrato sin unidades
  const contrato = await apiFetch<UsuarioActivoResponseDTO>("/api/expedientes/crear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idsUsuarios: payload.idsUsuarios,
      tipoFinanciamiento: payload.tipoFinanciamiento,
      faseComercial: payload.faseComercial,
      estadoTramiteLegal: payload.estadoTramiteLegal,
      fechaAdquisicion: payload.fechaAdquisicion,
    }),
  });

  // Paso 2: vincular la unidad al contrato
  await apiFetch<void>("/api/expedientes/asignar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuidUsuarioActivo: contrato.uuidUsuarioActivo,
      idsActivo: [payload.idActivo],
    }),
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
  activos?: import("@/lib/api/proyectos").ActivoResponseDTO[];
}

export function fetchContratoActivo(uuidActivo: string): Promise<import("@/modules/finanzas/types").ContratoDetalleResponse> {
  return apiFetch<import("@/modules/finanzas/types").ContratoDetalleResponse>(`/api/expedientes/${uuidActivo}/contrato`);
}

// ─── Hitos Comerciales (Commercial milestones) ────────────────────────────────

export interface HitoComercialResponseDTO {
  uuidHitoComercial: string;
  uuidUsuarioActivo: string;
  etapaProceso: EtapaProceso;
  nombreHito: string;
  descripcion: string;
  orden: number;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO";
  fechaCompletado: string | null;
  createdAt: string;
}

export interface EtapaStepperResponseDTO {
  etapa: EtapaProceso;
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
  etapaProceso: string;
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

/**
 * El backend no tiene endpoint PATCH para editar hitos comerciales.
 * Se usa delete + create como workaround.
 */
export async function updateCommercialHito(uuidHito: string, payload: {
  uuidUsuarioActivo: string;
  nombreHito: string;
  descripcion: string;
  orden: number;
  etapaProceso: string;
}): Promise<HitoComercialResponseDTO> {
  await apiFetch<void>(`/api/comercial/hitos/${uuidHito}`, { method: "DELETE" });
  return apiFetch<HitoComercialResponseDTO>("/api/comercial/hitos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuidUsuarioActivo: payload.uuidUsuarioActivo,
      etapaProceso: payload.etapaProceso,
      nombreHito: payload.nombreHito,
      descripcion: payload.descripcion,
      orden: payload.orden,
    }),
  });
}

