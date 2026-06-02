import { apiFetch } from "@/lib/api/http";

export interface Proyecto {
  id: string; // UUID
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFinEstimada: string;
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
  pageable: any;
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
  nro: string;
  tipo: string;
  areaM2: number;
  estadoComercial: string;
  precio: number;
  descripcion: string;
}

export function fetchProyectos(): Promise<Proyecto[]> {
  return apiFetch<Proyecto[]>("/api/proyectos");
}

export function fetchActivosPorProyecto(uuidProyecto: string, estado?: string): Promise<Page<ActivoResponseDTO>> {
  const url = estado 
    ? `/api/proyecto/${uuidProyecto}?estado=${estado}&size=100` 
    : `/api/proyecto/${uuidProyecto}?size=100`;
  return apiFetch<Page<ActivoResponseDTO>>(url);
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
  estadoComercial: string;
  precio: number;
  descripcion: string;
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

