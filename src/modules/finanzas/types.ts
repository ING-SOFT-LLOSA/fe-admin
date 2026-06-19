import type { DocumentoResponse } from "@/lib/api/documents";

export type PaymentStatus = "PENDIENTE" | "PAGADO" | "VENCIDO";
export type FinanceType = "Crédito Directo" | "Crédito Hipotecario";
export type CronogramaEstado = "ACTIVO" | "LIQUIDADO" | "REESTRUCTURADO";
export type GlobalStatus = "AL_DIA" | "EN_RIESGO" | "EN_MORA" | "LIQUIDADO";

export interface CronogramaPagoResponse {
  uuidCronograma: string;
  uuidUsuarioActivo: string;
  totalPactado: number;
  cuotaInicial: number;
  numeroCuotas: number;
  estado: CronogramaEstado;
  createdAt: string;
  updatedAt: string;
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

export interface CartaAprobacionResponse {
  uuidCarta: string;
  uuidUsuarioActivo: string;
  banco: string;
  montoAprobado: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaDesembolsoProyectada: string;
  comentarios: string;
  createdAt: string;
}

export interface FinancingDetailsDTO {
  cronograma: CronogramaPagoResponse | null;
  pagos: PagoResponse[];
  resumen: CronogramaResumenResponse | null;
  cartaAprobacion: CartaAprobacionResponse | null;
}
export interface ContratoDetalleResponse {
  expediente: import("@/lib/api/expedientes").UsuarioActivoResponseDTO;
  cronograma: CronogramaPagoResponse | null;
  cartaAprobacion: CartaAprobacionResponse | null;
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
