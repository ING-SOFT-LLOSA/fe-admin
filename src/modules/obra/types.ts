import type { FileDescriptor } from "@/modules/legal/types";

export type ConstructionStageKey =
  | "demolicion"
  | "inicio_obra"
  | "excavacion"
  | "cimentacion"
  | "casco"
  | "acabados_secos"
  | "acabados_humedos";

export type ConstructionStageStatus = "no_iniciada" | "en_progreso" | "completada";

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

export interface AvanceObraUnidad {
  manualOverrideEnabled: boolean;
  manualOverridePercent: number;
  licenses: {
    anteproyecto: LicenseState;
    licenciaObra: LicenseState;
  };
  stages: Record<ConstructionStageKey, ConstructionStageProgress>;
}
