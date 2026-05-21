import type {
  ConstructionStageKey,
  PaymentMode,
  ProcessModuleKey,
  ProjectDocumentType,
  UnitDocumentType,
} from "@/lib/backoffice/types";

export const PROCESS_MODULE_LABELS: Record<ProcessModuleKey, string> = {
  separacion: "Separacion",
  contrato: "Contrato",
  pagos: "Pagos y Financiamiento",
  avance: "Avance del Proyecto",
  entrega: "Entrega",
  saneamiento: "Saneamiento",
};

export const PROCESS_MODULE_ORDER: ProcessModuleKey[] = [
  "separacion",
  "contrato",
  "pagos",
  "avance",
  "entrega",
  "saneamiento",
];

export const SEPARACION_STEPS = [
  "Proforma",
  "Pago de separacion",
  "Ficha del cliente",
  "Separacion completada",
];

export const CONTRATO_STEPS_DIRECTO = [
  "Revision del contrato",
  "Aprobacion del contrato",
  "Pago cuota inicial",
  "Firma del contrato",
];

export const CONTRATO_STEPS_HIPOTECARIO = [
  "Revision del contrato",
  "Carta aprobacion banco",
  "Aprobacion del contrato",
  "Pago cuota inicial",
  "Firma del contrato",
];

export const PAGOS_STEPS_DIRECTO = [
  "Cuota inicial",
  "Cuota 1",
  "Cuota 2",
  "Cuota 3",
  "Inmueble cancelado",
];

export const PAGOS_STEPS_HIPOTECARIO = [
  "Cuota inicial",
  "Inicio desembolso",
  "Minuta en notaria",
  "Firma escritura publica",
  "Desembolso completado",
  "Inmueble cancelado",
];

export const ENTREGA_STEPS = [
  "Inmueble terminado",
  "Inmueble cancelado",
  "Comunicacion de fecha",
  "Confirmacion de fecha",
  "Entrega del inmueble",
];

export const SANEAMIENTO_STEPS = [
  "Entrega del inmueble",
  "Conformidad de obra",
  "Declaratoria de fabrica",
  "Independizacion en municipalidad",
  "Transferencia municipal",
  "Independizacion en SUNARP",
  "Transferencia registral",
];

export function getPaymentSteps(mode: PaymentMode) {
  return mode === "credito_hipotecario" ? PAGOS_STEPS_HIPOTECARIO : PAGOS_STEPS_DIRECTO;
}

export function getContractSteps(mode: PaymentMode) {
  return mode === "credito_hipotecario"
    ? CONTRATO_STEPS_HIPOTECARIO
    : CONTRATO_STEPS_DIRECTO;
}

export const CONSTRUCTION_STAGE_LABELS: Record<ConstructionStageKey, string> = {
  demolicion: "Demolicion",
  inicio_obra: "Inicio de obra",
  excavacion: "Excavacion",
  cimentacion: "Cimentacion",
  casco: "Casco",
  acabados_secos: "Acabados secos",
  acabados_humedos: "Acabados humedos",
};

export const CONSTRUCTION_STAGE_DESCRIPTIONS: Record<ConstructionStageKey, string> = {
  demolicion: "Retiro de estructuras existentes",
  inicio_obra: "Trabajos preliminares, faenas y cerco",
  excavacion: "Remocion de tierra, cimientos y sotanos",
  cimentacion: "Base estructural del edificio",
  casco: "Columnas, vigas y losas",
  acabados_secos: "Tabiques, marcos y puertas",
  acabados_humedos: "Enchapes, pintura y pisos",
};

export const CONSTRUCTION_STAGE_ORDER: ConstructionStageKey[] = [
  "demolicion",
  "inicio_obra",
  "excavacion",
  "cimentacion",
  "casco",
  "acabados_secos",
  "acabados_humedos",
];

export const PROJECT_DOCUMENT_DEFINITIONS: Array<{
  type: ProjectDocumentType;
  label: string;
  kind: "pdf" | "url";
}> = [
  { type: "anteproyecto_aprobado", label: "Anteproyecto aprobado", kind: "pdf" },
  { type: "licencia_demolicion", label: "Licencia de demolicion", kind: "pdf" },
  { type: "licencia_construccion", label: "Licencia de construccion", kind: "pdf" },
  { type: "precertificacion", label: "Precertificacion EDGE/LEED", kind: "pdf" },
  { type: "plano_distribucion", label: "Plano de distribucion", kind: "pdf" },
  { type: "cuadro_acabados", label: "Cuadro de acabados", kind: "pdf" },
  { type: "manual_implementacion", label: "Manual de implementacion", kind: "pdf" },
  { type: "recorrido_virtual", label: "Recorrido virtual", kind: "url" },
  { type: "reporte_mensual", label: "Reportes mensuales de obra", kind: "pdf" },
];

export const UNIT_DOCUMENT_DEFINITIONS: Record<
  ProcessModuleKey,
  Array<{ type: UnitDocumentType; label: string }>
> = {
  separacion: [
    { type: "proforma", label: "Proforma" },
    { type: "comprobante_separacion", label: "Comprobante de separacion" },
    { type: "ficha_cliente", label: "Ficha del cliente" },
  ],
  contrato: [
    { type: "contrato_cv", label: "Contrato CV" },
    { type: "datos_contrato", label: "Datos del contrato" },
    { type: "carta_aprobacion_banco", label: "Carta aprobacion banco" },
    { type: "escritura_publica", label: "Escritura publica" },
    { type: "adenda", label: "Adenda" },
  ],
  pagos: [
    { type: "cronograma_pagos", label: "Cronograma de pagos" },
    { type: "boleta_cuota", label: "Boletas por cuota" },
    { type: "estado_cuenta", label: "Estado de cuenta" },
  ],
  avance: [
    { type: "reporte_mensual", label: "Reportes mensuales" },
    { type: "plano_distribucion", label: "Plano de distribucion" },
    { type: "cuadro_acabados", label: "Cuadro de acabados" },
  ],
  entrega: [
    { type: "planos_as_built", label: "Planos As Built" },
    { type: "acta_entrega", label: "Acta de entrega" },
    { type: "manual_propietario", label: "Manual del propietario" },
    { type: "manual_convivencia", label: "Manual de convivencia" },
    { type: "manual_calidad_cloud", label: "Manual Calidad Cloud" },
    { type: "manual_saneamiento", label: "Manual de saneamiento" },
    { type: "carta_garantia", label: "Cartas de garantia" },
    { type: "ficha_tecnica", label: "Fichas tecnicas" },
    { type: "lista_proveedores", label: "Lista de proveedores" },
    { type: "cuponera", label: "Cuponera" },
    { type: "checklist_implementacion", label: "Checklist de implementacion" },
  ],
  saneamiento: [
    { type: "conformidad_obra", label: "Conformidad de obra" },
    { type: "declaratoria_fabrica", label: "Declaratoria de fabrica" },
    { type: "reglamento_interno", label: "Reglamento interno" },
    { type: "partida_registral", label: "Partida registral" },
  ],
};
