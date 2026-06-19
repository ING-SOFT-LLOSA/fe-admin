// ── Tipos base ────────────────────────────────────────────────────────────────

export type EstadoHito = "pendiente" | "en_proceso" | "completado" | "observado";

export type StageId = "SEPARACION" | "CONTRATO" | "PAGO" | "ENTREGA" | "SANEAMIENTO" | "OTRO";

export type ProcesoEtapa = {
  id:           string;
  uuidHito?:    string;
  label:        string;
  etapaProceso: StageId;
  orden:        number;
  state?:       string; // optional state
  estado:       EstadoHito;
  icon:         string;
  fechaInicio?: string;
  fechaFin?:    string;
  comentarios?: string;
};

export type Tab = "resumen" | "proceso" | "documentos";

// ── Tabs de navegación ────────────────────────────────────────────────────────

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "resumen",    label: "Resumen",       icon: "dashboard"    },
  { id: "proceso",    label: "Proceso Legal", icon: "account_tree" },
  { id: "documentos", label: "Documentos",    icon: "folder_open"  },
];

// ── Badges de estado ──────────────────────────────────────────────────────────

export const ESTADO_BADGE: Record<EstadoHito, { label: string; cls: string }> = {
  completado: {
    label: "Completado",
    cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  en_proceso: {
    label: "En curso",
    cls: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/50",
  },
  pendiente: {
    label: "Pendiente",
    cls: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40",
  },
  observado: {
    label: "Observado",
    cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
};

// ── Mapeo backend ↔ frontend ──────────────────────────────────────────────────

export const BACKEND_A_ESTADO: Record<string, EstadoHito> = {
  COMPLETADO:  "completado",
  EN_PROGRESO: "en_proceso",
  PENDIENTE:   "pendiente",
};

export const ESTADO_A_BACKEND: Record<EstadoHito, string> = {
  completado: "COMPLETADO",
  en_proceso: "EN_PROGRESO",
  pendiente:  "PENDIENTE",
  observado:  "PENDIENTE",
};

// ── Orden canónico de etapas ──────────────────────────────────────────────────

export const STAGE_ORDER: StageId[] = [
  "SEPARACION",
  "CONTRATO",
  "PAGO",
  "ENTREGA",
  "SANEAMIENTO",
];

// Etapas que tienen sección de documentos
export const DOCUMENT_STAGES: StageId[] = [
  "SEPARACION",
  "CONTRATO",
  "PAGO",
  "ENTREGA",
  "SANEAMIENTO",
  "OTRO",
];

// ── Metadata de UI por etapa ──────────────────────────────────────────────────

export const STAGE_META: Record<StageId, { label: string; icon: string }> = {
  SEPARACION:  { label: "Separación",  icon: "description" },
  CONTRATO:    { label: "Contrato",    icon: "edit_document" },
  PAGO:        { label: "Pagos",       icon: "payments" },
  ENTREGA:     { label: "Entrega",     icon: "key" },
  SANEAMIENTO: { label: "Saneamiento", icon: "account_balance" },
  OTRO:        { label: "Otro",        icon: "folder" },
};

// ── Hitos por defecto que se crean en el seed inicial ────────────────────────
// El campo `orden` define la posición dentro de cada etapa.
// El backend los crea con estado PENDIENTE por defecto.

export type DefaultHito = {
  etapaProceso: StageId;
  nombreHito:   string;
  descripcion:  string;
  orden:        number;
  icon:         string;
};

export const DEFAULT_HITOS: DefaultHito[] = [
  // ── SEPARACION (4 hitos) ──────────────────────────────────────────────────
  {
    etapaProceso: "SEPARACION",
    nombreHito:   "Proforma",
    descripcion:  "Envío y aprobación de la proforma comercial.",
    orden:        1,
    icon:         "description",
  },
  {
    etapaProceso: "SEPARACION",
    nombreHito:   "Pago de separación",
    descripcion:  "Registro del pago de separación del inmueble.",
    orden:        2,
    icon:         "payments",
  },
  {
    etapaProceso: "SEPARACION",
    nombreHito:   "Ficha del cliente",
    descripcion:  "Datos del cliente completados y verificados.",
    orden:        3,
    icon:         "person",
  },
  {
    etapaProceso: "SEPARACION",
    nombreHito:   "Separación",
    descripcion:  "Separación formal del inmueble confirmada.",
    orden:        4,
    icon:         "handshake",
  },

  // ── CONTRATO (5 hitos) ────────────────────────────────────────────────────
  {
    etapaProceso: "CONTRATO",
    nombreHito:   "Separación",
    descripcion:  "Confirmación de separación para iniciar el contrato.",
    orden:        1,
    icon:         "handshake",
  },
  {
    etapaProceso: "CONTRATO",
    nombreHito:   "Revisión del contrato",
    descripcion:  "Revisión legal del borrador del contrato.",
    orden:        2,
    icon:         "manage_search",
  },
  {
    etapaProceso: "CONTRATO",
    nombreHito:   "Aprobación del contrato",
    descripcion:  "Aprobación del contrato por ambas partes.",
    orden:        3,
    icon:         "task_alt",
  },
  {
    etapaProceso: "CONTRATO",
    nombreHito:   "Cuota Inicial",
    descripcion:  "Registro del pago de la cuota inicial.",
    orden:        4,
    icon:         "payments",
  },
  {
    etapaProceso: "CONTRATO",
    nombreHito:   "Firma del Contrato",
    descripcion:  "Firma del contrato de compraventa.",
    orden:        5,
    icon:         "draw",
  },

  // ── ENTREGA (5 hitos) ─────────────────────────────────────────────────────
  {
    etapaProceso: "ENTREGA",
    nombreHito:   "Inmueble terminado",
    descripcion:  "Confirmación de obra terminada y lista para inspección.",
    orden:        1,
    icon:         "home_work",
  },
  {
    etapaProceso: "ENTREGA",
    nombreHito:   "Inmueble cancelado",
    descripcion:  "Saldo del inmueble cancelado en su totalidad.",
    orden:        2,
    icon:         "receipt_long",
  },
  {
    etapaProceso: "ENTREGA",
    nombreHito:   "Comunicación de fecha de entrega",
    descripcion:  "Notificación formal de la fecha de entrega al cliente.",
    orden:        3,
    icon:         "mail",
  },
  {
    etapaProceso: "ENTREGA",
    nombreHito:   "Confirmación de fecha de entrega",
    descripcion:  "Confirmación por parte del cliente de la fecha de entrega.",
    orden:        4,
    icon:         "event_available",
  },
  {
    etapaProceso: "ENTREGA",
    nombreHito:   "Entrega del inmueble",
    descripcion:  "Entrega física del inmueble y llaves al cliente.",
    orden:        5,
    icon:         "key",
  },

  // ── SANEAMIENTO (7 hitos) ─────────────────────────────────────────────────
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Entrega del inmueble",
    descripcion:  "Entrega física del inmueble al cliente tras el saneamiento.",
    orden:        1,
    icon:         "key",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Conformidad de obra",
    descripcion:  "Resolución municipal que certifica la construcción conforme a los planos y licencias aprobadas.",
    orden:        2,
    icon:         "verified",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Declaratoria de fábrica",
    descripcion:  "Inscripción en SUNARP de la edificación construida sobre el terreno con sus características técnicas.",
    orden:        3,
    icon:         "engineering",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Independización municipal",
    descripcion:  "Trámite de independización de la unidad ante la municipalidad.",
    orden:        4,
    icon:         "account_balance",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Transferencia municipal",
    descripcion:  "Transferencia de la propiedad registrada ante la municipalidad.",
    orden:        5,
    icon:         "swap_horiz",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Independización SUNARP",
    descripcion:  "Inscripción de la unidad como propiedad independiente en Registros Públicos.",
    orden:        6,
    icon:         "apartment",
  },
  {
    etapaProceso: "SANEAMIENTO",
    nombreHito:   "Transferencia registral",
    descripcion:  "Inscripción de la transferencia de propiedad en SUNARP a nombre del cliente.",
    orden:        7,
    icon:         "domain_verification",
  },
];

// ── Requisitos documentales predefinidos por etapa ───────────────────────────
// Se crean automáticamente en el seed de documentos si no existen.

export type RequisitoPredef = {
  titulo:      string;
  descripcion: string;
  icono:       string;
};

export const PREDEFINED_REQUISITOS: Record<StageId, RequisitoPredef[]> = {
  SEPARACION: [
    { titulo: "Proforma firmada",              descripcion: "Documento de proforma firmado por el cliente.",     icono: "description"  },
    { titulo: "Comprobante de separación",     descripcion: "Recibo o boleta que acredita que el cliente pagó el monto de separación de la unidad.", icono: "receipt_long" },
    { titulo: "DNI del cliente",               descripcion: "Copia del documento de identidad del cliente.",     icono: "badge"        },
    { titulo: "Ficha de datos",                descripcion: "Ficha con datos personales completos del cliente.", icono: "person"       },
  ],
  CONTRATO: [
    { titulo: "Borrador del contrato",         descripcion: "Borrador revisado por el área legal.",              icono: "manage_search" },
    { titulo: "Contrato firmado",              descripcion: "Contrato de compraventa firmado por ambas partes.", icono: "draw"          },
    { titulo: "Pago Inicial",                  descripcion: "Comprobante del pago de la cuota inicial para formalizar la compra.", icono: "payments" },
    { titulo: "DNI cónyuge (si aplica)",       descripcion: "Documento de identidad del cónyuge.",               icono: "badge"         },
    { titulo: "Estado de cuenta",              descripcion: "Estado de cuenta bancario del cliente.",            icono: "account_balance" },
  ],
  PAGO: [],
  ENTREGA: [
    { titulo: "Acta de entrega",          descripcion: "Acta firmada de entrega del inmueble.",             icono: "key"           },
    { titulo: "Check list de inmueble",   descripcion: "Lista de verificación del estado del inmueble.",    icono: "checklist"     },
    { titulo: "Voucher saldo cancelado",  descripcion: "Comprobante del saldo total cancelado.",            icono: "receipt_long"  },
    { titulo: "Conformidad de entrega",   descripcion: "Documento de conformidad firmado por el cliente.",  icono: "task_alt"      },
    { titulo: "Manual del propietario",   descripcion: "Manual de uso y mantenimiento del inmueble.",       icono: "menu_book"     },
  ],
  SANEAMIENTO: [
    { titulo: "Partida registral",        descripcion: "Copia literal de la partida en SUNARP.",            icono: "domain_verification" },
    { titulo: "Escritura pública",        descripcion: "Copia de la escritura pública notarial.",           icono: "gavel"               },
    { titulo: "HR y PU municipales",      descripcion: "Hoja de resumen y predios urbanos municipales.",    icono: "receipt"             },
    { titulo: "Declaratoria de fábrica",  descripcion: "Inscripción de declaratoria de fábrica.",           icono: "engineering"         },
    { titulo: "Independización",          descripcion: "Resolución de independización de la unidad.",       icono: "apartment"           },
    { titulo: "Constancia de no adeudo",  descripcion: "Constancia de no adeudo de servicios.",             icono: "check_circle"        },
    { titulo: "Minuta de compraventa",    descripcion: "Copia de la minuta de compraventa firmada.",        icono: "description"         },
  ],
  OTRO: [],
};

// ── Opciones del select de estado (compartidas por todos los hitos) ───────────

export const OPCIONES_ESTADO: { value: string; label: string }[] = [
  { value: "PENDIENTE",   label: "Pendiente"  },
  { value: "EN_PROGRESO", label: "En proceso" },
  { value: "COMPLETADO",  label: "Completado" },
];