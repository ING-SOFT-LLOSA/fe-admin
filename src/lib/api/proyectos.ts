import { apiFetch } from "@/lib/api/http";

export interface Proyecto {
  id: string; // UUID
  nombre: string;
  descripcion?: string;
  precertificacionEdgeLeed?: boolean;
  linkRecorridoVirtual?: string;
  departamento?: string;
  distrito?: string;
  direccion: string;
  fechaInicio: string;
  /** Fecha fin del proyecto (campo real que devuelve el backend) */
  fechaFin: string;
  /** @deprecated Alias de fechaFin — mantenido por compatibilidad con componentes existentes */
  fechaFinEstimada?: string;
  createdAt?: string;
}

export interface ProyectoCreateDTO {
  nombre: string;
  descripcion: string;
  precertificacionEdgeLeed: boolean;
  linkRecorridoVirtual: string;
  departamento: string;
  distrito: string;
  direccion: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
}

export interface Page<T> {
  content: T[];
  pageable: unknown;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ActivoResponseDTO {
  id: string; // UUID
  pisoId: number;
  nroPiso?: number;
  torreNombre?: string;
  proyectoNombre?: string;
  nro: string;
  tipo: string;
  areaM2: number;
  areaTechada: number;
  estadoComercial: string;
  precio: number;
  descripcion: string;
  tieneRecorridoVirtual: boolean;
  linkRecorridoVirtual?: string;
}

export interface TorreResponseDTO {
  id: number;
  nombre: string;
  nroPisos: number;
  nroSotanos: number;
  areaComunM2: number;
  proyectoId: string;
}

export interface PisoResponseDTO {
  id: number;
  nroPiso: number;
}

/**
 * GET /api/proyectos
 * El backend retorna un Page<ProyectoResponseDTO>. Desempaquetamos .content
 * y añadimos el alias fechaFinEstimada para compatibilidad con componentes existentes.
 */
export function fetchProyectos(): Promise<Proyecto[]> {
  return apiFetch<{ content?: Proyecto[] } | Proyecto[]>("/api/proyectos?size=200").then((res) => {
    const list: Proyecto[] = Array.isArray(res) ? res : (res as { content?: Proyecto[] }).content ?? [];
    return list.map((p) => ({
      ...p,
      // alias para componentes que aún leen fechaFinEstimada
      fechaFinEstimada: p.fechaFinEstimada ?? p.fechaFin,
    }));
  });
}

export function fetchTorresPorProyecto(uuidProyecto: string): Promise<TorreResponseDTO[]> {
  return apiFetch<TorreResponseDTO[]>(`/api/torres/${uuidProyecto}`);
}

export function fetchPisosPorTorre(idTorre: number): Promise<PisoResponseDTO[]> {
  return apiFetch<PisoResponseDTO[]>(`/api/pisos/${idTorre}`);
}

export function fetchActivosPorProyecto(uuidProyecto: string, estado?: string): Promise<Page<ActivoResponseDTO>> {
  const url = estado
    ? `/api/activos/proyecto/${uuidProyecto}?estado=${estado}&size=100`
    : `/api/activos/proyecto/${uuidProyecto}?size=100`;
  return apiFetch<Page<ActivoResponseDTO>>(url);
}

export async function fetchAllActivosPorProyecto(uuidProyecto: string): Promise<ActivoResponseDTO[]> {
  const PAGE_SIZE = 500;
  const all: ActivoResponseDTO[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await apiFetch<Page<ActivoResponseDTO>>(
      `/api/activos/proyecto/${uuidProyecto}?size=${PAGE_SIZE}&page=${page}`
    );
    
    const content = response.content ?? [];
    all.push(...content);
    
    const realSize = response.size ?? PAGE_SIZE;
    const isLast = response.last ?? (content.length < realSize);
    const totalPages = response.totalPages ?? 1;

    if (isLast || page >= totalPages - 1 || content.length === 0) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return all;
}
export function updateProyecto(uuid: string, data: ProyectoCreateDTO): Promise<Proyecto> {
  return apiFetch<Proyecto>(`/api/proyectos/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProyecto(uuid: string): Promise<void> {
  return apiFetch<void>(`/api/proyectos/${uuid}`, {
    method: "DELETE",
  });
}

export interface ActivoRequestDTO {
  nro: string;
  tipo: string;
  areaM2: number;
  areaTechada: number;
  estadoComercial: string;
  precio: number;
  descripcion: string;
  tieneRecorridoVirtual: boolean;
}

export function createActivo(idPiso: number, data: ActivoRequestDTO): Promise<ActivoResponseDTO> {
  return apiFetch<ActivoResponseDTO>(`/api/activos/${idPiso}/pisos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateActivo(uuid: string, data: ActivoRequestDTO): Promise<ActivoResponseDTO> {
  return apiFetch<ActivoResponseDTO>(`/api/activos/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteActivo(uuid: string): Promise<void> {
  return apiFetch<void>(`/api/activos/${uuid}`, {
    method: "DELETE",
  });
}

