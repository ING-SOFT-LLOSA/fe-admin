export interface ProjectFormData {
  nombre: string;
  descripcion: string;
  precertificacionEdgeLeed: boolean;
  linkRecorridoVirtual: string;
  departamento: string;
  distrito: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface InventoryConfig {
  numTorres: number;
  pisosPorTorre: number;
  depasPorPiso: number;
  cocherasPorPiso: number;
  depositosPorPiso: number;
}
