export type UnitStatus =
  | "disponible"
  | "separado"
  | "en_contrato"
  | "cancelado"
  | "entregado";

export type UnitTypology =
  | "1D"
  | "2D"
  | "3D"
  | "estacionamiento"
  | "deposito"
  | "oficina";

export interface UnidadInventario {
  id: string;
  towerId: string;
  projectId: string;
  number: string;
  floor: number;
  area: number;
  builtArea: number;
  freeArea: number;
  typology: UnitTypology;
  distribution: string;
  salePrice: number;
  status: UnitStatus;
}

export type {
  ActivoRequestDTO,
  ActivoResponseDTO,
} from "@/lib/api/proyectos";
