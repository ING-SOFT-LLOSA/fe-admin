import { apiFetch } from "@/lib/api/http";

export interface DashboardProyectoDTO {
  id: string; // UUID
  nombreProyecto: string;
  avanceGlobal: number;
}

export interface EtapaCreateDTO {
  nombre: string;
  descripcion: string;
  orden: number;
}

export interface HitoResponseDTO {
  id: number;
  titulo: string;
  orden: number;
  tipo: string;
  estado: string;
  fechaCompletado: string | null;
}

export interface EtapaResponseDTO {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  estado: string;
  hitos: HitoResponseDTO[];
}

export interface HitoUnidadResponseDTO {
  id: string; // uuid_hito_unidad
  hitoNombre: string;
  hitoDescripcion: string;
  estado: string;
  fechaCompletado: string | null;
  observaciones: string | null;
}

export interface AvanceUnidadResponseDTO {
  id: string;
  hitoTitulo: string;
  hitoOrden: number;
  hitoTipo: string;
  estado: string;
  fechaCompletado: string | null;
  porcentaje: number;
}

export function getAvanceGeneral(uuid: string): Promise<DashboardProyectoDTO> {
  return apiFetch<DashboardProyectoDTO>(`/api/proyectos/${uuid}/avance-general`);
}

export function crearEtapaProyecto(uuid: string, data: EtapaCreateDTO): Promise<any> {
  return apiFetch<any>(`/api/proyectos/${uuid}/etapas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getEtapasByProyecto(uuid: string): Promise<EtapaResponseDTO[]> {
  return apiFetch<EtapaResponseDTO[]>(`/api/proyectos/${uuid}/etapas`);
}

export function getHitosActivo(uuid: string): Promise<HitoUnidadResponseDTO[]> {
  return apiFetch<HitoUnidadResponseDTO[]>(`/api/activos/${uuid}/hitos`);
}

export function getAvancesActivo(uuid: string): Promise<AvanceUnidadResponseDTO[]> {
  return apiFetch<AvanceUnidadResponseDTO[]>(`/api/activos/${uuid}/avances`);
}
