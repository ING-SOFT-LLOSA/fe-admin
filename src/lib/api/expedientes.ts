import { apiFetch } from "@/lib/api/http";
 
// ─── Sub-DTOs ─────────────────────────────────────────────────────────────────
 
export interface ClienteSimpleDTO {
  id:                 number;
  nombre:             string;
  apellidos:          string | null;
  documentoIdentidad: string | null;
  email:              string;
  telefono:           string | null;
}
 
// ActivoResponseDTO se importa desde proyectos — no se redefine aquí
import type { ActivoResponseDTO } from "@/lib/api/proyectos";
 
// ─── UsuarioActivoResponseDTO ─────────────────────────────────────────────────
// Espejo exacto del record Java UsuarioActivoResponseDTO.
// Tanto /api/expedientes/{idUsuario} como /api/expedientes/{uuidActivo}/contrato
// devuelven este mismo shape.
 
export interface UsuarioActivoResponseDTO {
  uuidUsuarioActivo:   string;           // UUID serializado como string
  tipoFinanciamiento:  string;
  fechaAdquisicion:    string | null;    // LocalDateTime → ISO string
  createdAt:           string | null;
  updatedAt:           string | null;
  vigente:             boolean | null;
  clientes:            ClienteSimpleDTO[];
  activos:             ActivoResponseDTO[];  // Lista de activos vinculados
  activo?:             ActivoResponseDTO;
  faseComercial?:      string;
  estadoTramiteLegal?: string;
}
 
// ─── Hitos Comerciales ────────────────────────────────────────────────────────
 
export type EtapaProceso =
  | "SEPARACION"
  | "CONTRATO"
  | "PAGO"
  | "ENTREGA"
  | "SANEAMIENTO";
export interface HitoComercialResponseDTO {
  uuidHitoComercial:   string;
  uuidEtapaExpediente: string;
  uuidUsuarioActivo?:  string;
  etapaProceso:        EtapaProceso;
  nombreHito:          string;
  descripcion:         string;
  orden:               number;
  estado:              "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO";
  fechaCompletado:     string | null;
  createdAt:           string;
}
 
export interface EtapaStepperResponseDTO {
  etapa:             EtapaProceso;
  hitos:             HitoComercialResponseDTO[];
  porcentajeAvance:  number;
}
 
export interface StepperResponseDTO {
  uuidUsuarioActivo: string;
  etapas:            EtapaStepperResponseDTO[];
}
 
// ─── Payloads ─────────────────────────────────────────────────────────────────

/** Paso 1: Crear contrato/expediente (sin activos aún) */
export interface CrearContratoPayload {
  idsUsuarios:        number[];   // IDs numéricos de los compradores
  tipoFinanciamiento: string;
  faseComercial:      string;
  estadoTramiteLegal?: string;
  fechaAdquisicion?:  string;     // ISO datetime sin millis
  
  // Positional fallbacks for Jackson record deserialization when compiled without -parameters
  arg0?:              number[];
  arg1?:              string;
  arg2?:              string;
  arg3?:              string;
  arg4?:              string;
}

/** Paso 2: Vincular activos a un contrato existente */
export interface AsignarActivoPayload {
  uuidUsuarioActivo:  string;     // UUID del contrato creado en paso 1
  idsActivo:          string[];   // UUIDs de los activos a vincular
  
  // Positional fallbacks for Jackson record deserialization when compiled without -parameters
  arg0?:              string;
  arg1?:              string[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * POST /api/expedientes/crear
 * Paso 1: Crea un contrato (UsuarioActivo) con los clientes indicados.
 * Retorna el contrato creado con su uuidUsuarioActivo.
 */
export function crearContrato(payload: CrearContratoPayload): Promise<UsuarioActivoResponseDTO> {
  return apiFetch<UsuarioActivoResponseDTO>("/api/expedientes/crear", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
}

/**
 * POST /api/expedientes/asignar
 * Paso 2: Vincula una lista de activos a un contrato existente.
 */
export function asignarActivo(payload: AsignarActivoPayload): Promise<UsuarioActivoResponseDTO> {
  return apiFetch<UsuarioActivoResponseDTO>("/api/expedientes/asignar", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
}
 
/**
 * GET /api/expedientes/mis-activos
 * Devuelve los activos asignados al usuario autenticado.
 */
export function fetchMisActivos(): Promise<ActivoResponseDTO[]> {
  return apiFetch<ActivoResponseDTO[]>("/api/expedientes/mis-activos");
}
 
/**
 * DELETE /api/expedientes/delete/{uuid}
 * Desvincula una asignación de activo.
 */
export function unlinkAssignment(uuid: string): Promise<void> {
  return apiFetch<void>(`/api/expedientes/delete/${uuid}`, { method: "DELETE" });
}

/**
 * GET /api/expedientes
 * Lista todos los expedientes (UsuarioActivo) de la empresa.
 */
export function fetchTodosLosContratos(): Promise<UsuarioActivoResponseDTO[]> {
  return apiFetch<any>("/api/expedientes?unpaginated=true").then((res) => {
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      ...item,
      activo: item.activo ?? item.activos?.[0],
    }));
  });
}
 
/**
 * GET /api/expedientes/{idUsuario}
 * Lista todos los expedientes (UsuarioActivo) de un cliente por su ID numérico.
 */
export function fetchExpedientesPorUsuario(
  idUsuario: number
): Promise<UsuarioActivoResponseDTO[]> {
  return apiFetch<UsuarioActivoResponseDTO[]>(`/api/expedientes/${idUsuario}`).then((list) =>
    list.map((item) => ({
      ...item,
      activo: item.activo ?? item.activos?.[0],
    }))
  );
}
 
/**
 * GET /api/expedientes/{uuidActivo}/contrato
 * Devuelve el expediente asociado a un UUID de activo/inmueble.
 * Requiere autoridad CONTRATO_VER.
 */
export function fetchContratoActivo(
  uuidActivo: string
): Promise<UsuarioActivoResponseDTO> {
  return apiFetch<UsuarioActivoResponseDTO>(
    `/api/expedientes/${uuidActivo}/contrato`
  ).then((item) => ({
    ...item,
    activo: item.activo ?? item.activos?.[0],
  }));
}
 
/**
 * GET /api/comercial/stepper/{uuidUsuarioActivo}
 * Devuelve el stepper completo de hitos comerciales de un expediente.
 * Requiere autoridad CONTRATO_VER.
 */
export function fetchCommercialStepper(
  uuidUsuarioActivo: string
): Promise<StepperResponseDTO> {
  return apiFetch<StepperResponseDTO>(
    `/api/comercial/stepper/${uuidUsuarioActivo}`
  );
}
 
/**
 * POST /api/comercial/hitos
 * Crea un nuevo hito comercial en un expediente.
 * Requiere autoridad CONTRATO_EDITAR.
 */
export interface HitoComercialCreatePayload {
  uuidEstapaExpediente?: string; // Matches the backend's uuidEstapaExpediente typo
  uuidUsuarioActivo?: string;
  etapaProceso?: "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO";
  nombreHito:           string;
  descripcion:          string;
  orden:                number;
}

export function createCommercialHito(
  payload: HitoComercialCreatePayload
): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>("/api/comercial/hitos", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
}
 
/**
 * PATCH /api/comercial/hitos/{uuid}/estado?estado=COMPLETADO
 * Actualiza el estado de un hito comercial.
 * Requiere autoridad CONTRATO_EDITAR.
 */
export function updateCommercialHitoEstado(
  uuidHito:    string,
  estado:      string
): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>(
    `/api/comercial/hitos/${uuidHito}/estado?estado=${estado}`,
    { method: "PATCH" }
  );
}

export function deleteCommercialHito(uuidHito: string): Promise<void> {
  return apiFetch<void>(`/api/comercial/hitos/${uuidHito}`, {
    method: "DELETE",
  });
}

export function updateCommercialHito(
  uuidHito: string,
  payload: {
    nombreHito: string;
    descripcion: string;
    orden?: number;
  }
): Promise<HitoComercialResponseDTO> {
  return apiFetch<HitoComercialResponseDTO>(`/api/comercial/hitos/${uuidHito}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface EtapaExpedienteResponseDTO {
  uuidEtapaExpediente: string;
  uuidUsuarioActivo:   string;
  etapaProceso:        EtapaProceso;
  estado:              string;
  totalHitos?:         number;
  totalRequisitos?:    number;
  hitosCompletados?:   number;
}

export function fetchEtapasExpediente(
  uuidUsuarioActivo: string
): Promise<EtapaExpedienteResponseDTO[]> {
  return apiFetch<EtapaExpedienteResponseDTO[]>(
    `/etapa-expediente/expediente/${uuidUsuarioActivo}`
  );
}

// ─── Activos por usuario ──────────────────────────────────────────────────────

export interface ActivoUsuarioDTO {
  id:               string;   // UUID del activo
  pisoId:           number;
  nroPiso:          number;
  torreNombre:      string;
  proyectoNombre:   string;
  nro:              string;
  tipo:             string;   // DEPARTAMENTO | ESTACIONAMIENTO | DEPOSITO
  areaM2:           number;
  estadoComercial:  string;
  precio:           number;
  descripcion:      string;
}

/**
 * GET /api/expedientes/usuario/{idUsuario}/activos
 * Devuelve todos los activos vinculados a un usuario a través de sus contratos.
 */
export function fetchActivosPorUsuario(
  idUsuario: number
): Promise<ActivoUsuarioDTO[]> {
  return apiFetch<ActivoUsuarioDTO[]>(
    `/api/expedientes/usuario/${idUsuario}/activos`
  );
}

