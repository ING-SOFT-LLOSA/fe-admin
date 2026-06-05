import type { FileDescriptor } from "@/modules/legal/types";

export type PaymentStatus = "pagado" | "pendiente" | "por_vencer" | "en_mora" | "parcial";

export interface EntradaCronogramaPago {
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

export interface AprobacionBancaria {
  amountApproved: number;
  issuedAt: string;
  expiresAt: string;
  plannedDisbursementDate: string;
  notes: string;
}
