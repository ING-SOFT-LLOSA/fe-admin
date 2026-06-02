export type PaymentMode = "credito_directo" | "credito_hipotecario";

export interface AsignacionClienteUnidad {
  clientId: number;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  separationDate: string;
  paymentMode: PaymentMode;
}
