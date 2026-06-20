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

export interface ActivoData {
  nro: string;
  tipo: "DEPARTAMENTO" | "COCHERA" | "DEPOSITO";
  areaM2: number;
  areaTechada: number;
  precio: number;
  estadoComercial: string;
  descripcion: string;
}

export interface PisoData {
  nroPiso: number;
  activos: ActivoData[];
}

export interface TorreData {
  nombre: string;
  pisos: PisoData[];
}
