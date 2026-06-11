export enum EtapaProceso {
  SEPARACION = "SEPARACION",
  CONTRATO = "CONTRATO",
  PAGO = "PAGO",
  ENTREGA = "ENTREGA",
  SANEAMIENTO = "SANEAMIENTO"
}

export interface EtapaExpedienteRequest {
  uuidUsuarioActivo: string;
  nombreEtapa: string;
  descripcion?: string;
  orden: number;
  etapaProceso: EtapaProceso;
}

export interface EtapaExpedienteResponse {
  uuid: string;
  uuidUsuarioActivo: string;
  nombreEtapa: string;
  descripcion?: string;
  orden: number;
  etapaProceso: EtapaProceso;
  estado: "ACTIVO" | "INACTIVO" | "COMPLETADO";
  createdAt: string;
  updatedAt: string;
}

export interface EtapaExpedienteEstadoRequest {
  estado: "ACTIVO" | "INACTIVO" | "COMPLETADO";
}