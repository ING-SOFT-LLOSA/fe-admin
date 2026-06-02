export type ProcessModuleKey =
  | "separacion"
  | "contrato"
  | "pagos"
  | "avance"
  | "entrega"
  | "saneamiento";

export type ProjectDocumentType =
  | "anteproyecto_aprobado"
  | "licencia_demolicion"
  | "licencia_construccion"
  | "precertificacion"
  | "plano_distribucion"
  | "cuadro_acabados"
  | "manual_implementacion"
  | "recorrido_virtual"
  | "reporte_mensual";

export type UnitDocumentType =
  | "proforma"
  | "comprobante_separacion"
  | "ficha_cliente"
  | "contrato_cv"
  | "datos_contrato"
  | "carta_aprobacion_banco"
  | "escritura_publica"
  | "adenda"
  | "cronograma_pagos"
  | "boleta_cuota"
  | "estado_cuenta"
  | "reporte_mensual"
  | "plano_distribucion"
  | "cuadro_acabados"
  | "planos_as_built"
  | "acta_entrega"
  | "manual_propietario"
  | "manual_convivencia"
  | "manual_calidad_cloud"
  | "manual_saneamiento"
  | "carta_garantia"
  | "ficha_tecnica"
  | "lista_proveedores"
  | "cuponera"
  | "checklist_implementacion"
  | "conformidad_obra"
  | "declaratoria_fabrica"
  | "reglamento_interno"
  | "partida_registral";

export interface FileDescriptor {
  fileName: string;
  fileSizeLabel: string;
  uploadedAt: string;
}

export interface DocumentRecord {
  id: string;
  scope: "project" | "unit";
  module: ProcessModuleKey | "obra";
  type: ProjectDocumentType | UnitDocumentType;
  title: string;
  kind: "pdf" | "url";
  externalUrl?: string;
  version: number;
  visibleToClient: boolean;
  notes: string;
  date: string;
  file?: FileDescriptor | null;
}

export interface StepProgress {
  id: string;
  label: string;
  completed: boolean;
  date: string;
  note: string;
}

export interface ProcessStageState {
  module: ProcessModuleKey;
  steps: StepProgress[];
  internalNote: string;
}

export interface ExpedienteLegalUnidad {
  currentModule: 1 | 2 | 3 | 4 | 5 | 6;
  stages: Record<ProcessModuleKey, ProcessStageState>;
}

export interface ContractSummary {
  areaTechada: number;
  areaLibre: number;
  areaTotal: number;
  totalSalePrice: number;
  deliveryDate: string;
  disbursementDate: string;
  notes: string;
}
