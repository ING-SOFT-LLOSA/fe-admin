export interface Proyecto {
  id: string; // UUID
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  descripcion?: string;
  precertificacionEdgeLeed?: boolean;
  linkRecorridoVirtual?: string;
  departamento?: string;
  distrito?: string;
  fechaFin?: string;
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
