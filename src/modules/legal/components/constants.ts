// ─── Types ────────────────────────────────────────────────────────────────────

export type Tab = "resumen" | "proceso" | "documentos";

export type HitoEstado = "pendiente" | "en_proceso" | "observado" | "completado";

export type HitoItem = {
  uuidHito: string;
  nombre: string;
  descripcion: string;
  orden: number;
  estado: string;
  fechaCompletado: string | null;
  createdAt: string | null;
};

export type ProcesoEtapa = {
  id: string;
  label: string;
  icon: string;
  estado: HitoEstado;
  hitos: HitoItem[];
  porcentajeAvance: number;
};

export type StageId = "SEPARACION" | "CONTRATO" | "ENTREGA" | "SANEAMIENTO";

// ─── Tab definitions ──────────────────────────────────────────────────────────

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "resumen",     label: "Resumen",       icon: "dashboard"    },
  { id: "proceso",     label: "Proceso Legal", icon: "account_tree" },
  { id: "documentos",  label: "Documentos",    icon: "folder_open"  },
];

// ─── Status badge styles ──────────────────────────────────────────────────────

export const ESTADO_BADGE: Record<HitoEstado, { label: string; cls: string }> = {
  pendiente:  { label: "Pendiente",  cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"              },
  en_proceso: { label: "En proceso", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"             },
  observado:  { label: "Observado",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
  completado: { label: "Completado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

// ─── Default hitos to seed when backend returns empty stages ──────────────────

export const DEFAULT_HITOS: {
  etapaProceso: string;
  nombreHito: string;
  orden: number;
  descripcion: string;
}[] = [
  { etapaProceso: "SEPARACION", nombreHito: "Separación",      orden: 1, descripcion: "Comprobante de separación y ficha de cliente completada." },
  { etapaProceso: "CONTRATO",   nombreHito: "Contrato",         orden: 2, descripcion: "Minuta firmada y contrato visado."                        },
  { etapaProceso: "PAGO",       nombreHito: "Escritura Pública",orden: 3, descripcion: "Firma de escritura notarial y financiamiento."            },
  { etapaProceso: "ENTREGA",    nombreHito: "Entrega",          orden: 4, descripcion: "Entrega física de llaves y conformidad."                  },
  { etapaProceso: "SANEAMIENTO",nombreHito: "Saneamiento",      orden: 5, descripcion: "Inscripción en registros públicos (SUNARP)."              },
];

// ─── Stage metadata for UI display ───────────────────────────────────────────

export const STAGE_META: Record<string, { label: string; icon: string }> = {
  SEPARACION: { label: "Separación",      icon: "handshake"      },
  CONTRATO:   { label: "Contrato",        icon: "description"    },
  PAGO:       { label: "Escritura Pública", icon: "verified"     },
  ENTREGA:    { label: "Entrega",          icon: "key"           },
  SANEAMIENTO:{ label: "Saneamiento",      icon: "domain_verified"},
};

// Ordered list used for sequential completion enforcement
export const STAGE_ORDER: string[] = [
  "SEPARACION",
  "CONTRATO",
  "PAGO",
  "ENTREGA",
  "SANEAMIENTO",
];

// Stages shown in the Documentos tab (PAGO is a process step, not a doc stage)
export const DOCUMENT_STAGES: StageId[] = ["SEPARACION", "CONTRATO", "ENTREGA", "SANEAMIENTO"];

// ─── Predefined document requirements per stage ───────────────────────────────

export const PREDEFINED_REQUISITOS: Record<StageId, { titulo: string; descripcion: string; icono: string }[]> = {
  SEPARACION: [
    { titulo: "Proforma",                 descripcion: "Documento que detalla las condiciones preliminares de la compra: precio, forma de pago y características de la unidad.", icono: "receipt_long"  },
    { titulo: "Comprobante de separación",descripcion: "Recibo o boleta que acredita que el cliente pagó el monto de separación de la unidad.",                                  icono: "payments"      },
    { titulo: "Ficha del cliente",        descripcion: "Registro con los datos personales del comprador: nombre completo, DNI, teléfono, correo y datos del bien adquirido.",    icono: "person_check"  },
    { titulo: "Recibo de Inicial",        descripcion: "Documento que acredita el pago de la cuota inicial acordada para la compra del inmueble.",                               icono: "receipt"       },
  ],
  CONTRATO: [
    { titulo: "Contrato de compraventa (CV)",   descripcion: "Documento legal que formaliza la compra de la unidad inmobiliaria entre el cliente y Llosa Edificaciones.",                                                                   icono: "gavel"           },
    { titulo: "Carta de aprobación del banco",  descripcion: "Documento emitido por el banco que confirma que aprobó el crédito hipotecario del cliente, con el monto y condiciones. Solo aplica a crédito hipotecario.",                   icono: "account_balance" },
    { titulo: "Adenda (Opcional)",              descripcion: "Documento que modifica o amplía el contrato original ya firmado. Puede cambiar montos, fechas u otras condiciones pactadas. Su inclusión es opcional.",                       icono: "note_add"        },
    { titulo: "Cronograma de Pagos",            descripcion: "Documento que establece el plan de pagos detallado, incluyendo fechas de vencimiento, montos y conceptos de cada cuota asociada al contrato.",                               icono: "payments"        },
  ],
  ENTREGA: [
    { titulo: "Planos \"As Built\"",  descripcion: "Planos finales del departamento tal como quedó construido, con arquitectura, estructuras, sanitarias, eléctricas, mecánicas y de gas.", icono: "architecture" },
    { titulo: "Acta de entrega",      descripcion: "Documento firmado por el cliente y Llosa que certifica la entrega de la unidad en la fecha pactada y en condiciones acordadas.",       icono: "done_all"     },
    { titulo: "Manual del propietario",descripcion: "Guía completa sobre el funcionamiento, mantenimiento y uso correcto de la unidad y sus instalaciones.",                               icono: "book"         },
    { titulo: "Manual de convivencia", descripcion: "Reglamento interno del edificio con normas de uso de áreas comunes, horarios, restricciones y obligaciones de los residentes.",      icono: "groups"       },
  ],
  SANEAMIENTO: [
    { titulo: "Conformidad de obra",                      descripcion: "Resolución municipal que certifica que la construcción del edificio fue realizada conforme a los planos y licencias aprobadas.",          icono: "verified"     },
    { titulo: "Declaratoria de fábrica",                  descripcion: "Documento legal que inscribe en SUNARP la edificación construida sobre el terreno, con sus características técnicas.",                    icono: "gavel"        },
    { titulo: "Reglamento interno",                       descripcion: "Documento que establece la división de áreas comunes y privadas del edificio, y las normas de convivencia entre propietarios.",          icono: "description"  },
    { titulo: "Partida registral del inmueble independizado", descripcion: "Documento oficial emitido por SUNARP que acredita que la unidad está inscrita como propiedad independiente a nombre del cliente.", icono: "fingerprint"  },
  ],
};
