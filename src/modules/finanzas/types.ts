export type PaymentStatus = "PENDIENTE" | "PAGADO" | "VENCIDO";
export type FinanceType = "Crédito Directo" | "Crédito Hipotecario";
export type CronogramaEstado = "ACTIVO" | "LIQUIDADO" | "REESTRUCTURADO";
export type GlobalStatus = "AL_DIA" | "EN_RIESGO" | "EN_MORA" | "LIQUIDADO";
export type ConceptoPago = "SEPARACION" | "INICIAL" | "CUOTA" | "COMPLETO";

export interface CronogramaPagoResponse {
  uuidCronograma: string;
  uuidUsuarioActivo: string;
  totalPactado: number;
  numeroCuotas: number;
  pagoSeparacion: number;
  pagoInicial: number;
  estado: CronogramaEstado;
  createdAt: string;
  updatedAt: string;
}

export function normalizeCronograma(raw: Record<string, unknown>): CronogramaPagoResponse {
  return {
    uuidCronograma: raw.uuidCronograma as string,
    uuidUsuarioActivo: raw.uuidUsuarioActivo as string,
    totalPactado: (raw.totalPactado as number) ?? 0,
    numeroCuotas: (raw.numeroCuotas as number) ?? 0,
    pagoSeparacion: (raw.pagoSeparacion as number) ?? 0,
    pagoInicial: (raw.pagoInicial as number) ?? (raw.cuotaInicial as number) ?? 0,
    estado: (raw.estado as CronogramaEstado) ?? "ACTIVO",
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  };
}

export interface PagoResponse {
  uuidPago: string;
  uuidCronograma: string;
  nroCuota: number;
  montoProgramado: number;
  fechaVencimiento: string;
  estado: PaymentStatus;
  montoPagado: number;
  fechaPago: string | null;
  uuidComprobante: string | null;
  actualizadoPor: number | null;
  concepto: ConceptoPago;
  comentario: string | null;
  uuidRequisitoDocumental: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CronogramaResumenResponse {
  totalPactado: number;
  totalPagado: number;
  totalPendiente: number;
  estadoGlobal: GlobalStatus;
  cuotasPagadas: number;
  cuotasPendientes: number;
  cuotasVencidas: number;
  proximoVencimiento: string | null;
}

export interface FinancingDetailsDTO {
  cronograma: CronogramaPagoResponse | null;
  pagos: PagoResponse[];
  resumen: CronogramaResumenResponse | null;
}

export interface ContratoDetalleResponse {
  expediente: import("@/lib/api/expedientes").UsuarioActivoResponseDTO;
  cronograma: CronogramaPagoResponse | null;
  resumen: CronogramaResumenResponse | null;
}

// ─── Crédito Hipotecario Unificado ────────────────────────────────────────────

export interface CreditoHipotecarioItem {
  uuidHitoComercial: string | null;
  nombre: string;
  fecha: string | null;
  estado: "PENDIENTE" | "COMPLETADO" | "EN_PROGRESO";
  monto: number;
  documentId: string | null;
  downloadUrl: string | null;
}

export interface CreditoHipotecarioResumen {
  items: CreditoHipotecarioItem[];
  montoTotal: number;
  progreso: number; // 0–100
}
