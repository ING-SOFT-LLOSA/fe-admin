export type UnitStatus =
  | "disponible"
  | "separado"
  | "en_contrato"
  | "cancelado"
  | "entregado";

export type PaymentMode = "credito_directo" | "credito_hipotecario";

export type UnitTypology =
  | "1D"
  | "2D"
  | "3D"
  | "estacionamiento"
  | "deposito"
  | "oficina";

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

export type ProcessModuleKey =
  | "separacion"
  | "contrato"
  | "pagos"
  | "avance"
  | "entrega"
  | "saneamiento";

export type ConstructionStageKey =
  | "demolicion"
  | "inicio_obra"
  | "excavacion"
  | "cimentacion"
  | "casco"
  | "acabados_secos"
  | "acabados_humedos";

export type ConstructionStageStatus = "no_iniciada" | "en_progreso" | "completada";

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

export type PaymentStatus = "pagado" | "pendiente" | "por_vencer" | "en_mora" | "parcial";

export type PortfolioIndicator = "al_dia" | "en_riesgo" | "en_mora" | "liquidado";

export interface FileDescriptor {
  fileName: string;
  fileSizeLabel: string;
  uploadedAt: string;
}

export interface LicenseState {
  status: "pendiente" | "aprobado";
  approvedAt: string;
  document?: FileDescriptor | null;
}

export interface StageMediaBundle {
  photos: FileDescriptor[];
  reports: FileDescriptor[];
}

export interface ConstructionStageProgress {
  key: ConstructionStageKey;
  status: ConstructionStageStatus;
  percent: number;
  startDate: string;
  estimatedEnd: string;
  media: StageMediaBundle;
}

export interface ConstructionProgress {
  manualOverrideEnabled: boolean;
  manualOverridePercent: number;
  licenses: {
    anteproyecto: LicenseState;
    licenciaObra: LicenseState;
  };
  stages: Record<ConstructionStageKey, ConstructionStageProgress>;
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

export interface PurchaseProcessState {
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

export interface BankApprovalData {
  amountApproved: number;
  issuedAt: string;
  expiresAt: string;
  plannedDisbursementDate: string;
  notes: string;
}

export interface PaymentEntry {
  id: string;
  kind: "cuota" | "hito";
  concept: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidAmount: number;
  paymentDate: string;
  paymentType: string;
  voucher?: FileDescriptor | null;
}

export interface UnitClientAssignment {
  clientId: number;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  separationDate: string;
  paymentMode: PaymentMode;
}

export interface BackofficeUnit {
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
  client?: UnitClientAssignment | null;
  process: PurchaseProcessState;
  documents: DocumentRecord[];
  contractSummary: ContractSummary;
  bankApproval: BankApprovalData;
  paymentSchedule: PaymentEntry[];
}

export interface BackofficeTower {
  id: string;
  name: string;
  projectId: string;
  floors: number;
  units: BackofficeUnit[];
}

export interface BackofficeProject {
  id: string;
  name: string;
  district: string;
  address: string;
  startDate: string;
  towers: BackofficeTower[];
  constructionProgress: ConstructionProgress;
  documents: DocumentRecord[];
}

export interface BackofficeWorkspace {
  projects: BackofficeProject[];
}
