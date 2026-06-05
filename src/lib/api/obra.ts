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
  const payload = {
    titulo: data.nombre,
    orden: data.orden,
    tipo: "OBRA"
  };
  return apiFetch<any>(`/api/proyectos/${uuid}/hitos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getEtapasByProyecto(uuid: string): Promise<EtapaResponseDTO[]> {
  return apiFetch<HitoResponseDTO[]>(`/api/proyectos/${uuid}/hitos`).then(hitos => 
    hitos.map(h => ({
      id: h.id,
      nombre: h.titulo,
      descripcion: "",
      orden: h.orden,
      estado: h.estado,
      hitos: []
    }))
  );
}

export function getHitosActivo(uuid: string): Promise<HitoUnidadResponseDTO[]> {
  return apiFetch<HitoUnidadResponseDTO[]>(`/api/activos/${uuid}/hitos`);
}

export function getAvancesActivo(uuid: string): Promise<AvanceUnidadResponseDTO[]> {
  return apiFetch<AvanceUnidadResponseDTO[]>(`/api/activos/${uuid}/avances`);
}

export function updateAvanceUnidad(id: string, estado: string): Promise<AvanceUnidadResponseDTO> {
  return apiFetch<AvanceUnidadResponseDTO>(`/api/avances-unidad/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
}
