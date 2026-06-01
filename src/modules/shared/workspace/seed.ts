import { getMockProjects } from "@/modules/proyectos/data/mock-projects";
import {
  CONSTRUCTION_STAGE_ORDER,
  CONSTRUCTION_STAGE_LABELS,
  CONTRATO_STEPS_HIPOTECARIO,
  ENTREGA_STEPS,
  PAGOS_STEPS_DIRECTO,
  PAGOS_STEPS_HIPOTECARIO,
  PROJECT_DOCUMENT_DEFINITIONS,
  SANEAMIENTO_STEPS,
  SEPARACION_STEPS,
} from "@/modules/shared/workspace/config";
import type {
  BackofficeProject,
  BackofficeTower,
  BackofficeUnit,
  ConstructionProgress,
  ConstructionStageKey,
  DocumentRecord,
  FileDescriptor,
  PaymentEntry,
  PaymentMode,
  PurchaseProcessState,
  StepProgress,
  UnitClientAssignment,
  UnitStatus,
  UnitTypology,
  BackofficeWorkspace,
} from "@/modules/shared/workspace/types";

type MockAssignment = {
  fullName: string;
  email: string;
  phone: string;
  dni: string;
  paymentMode: PaymentMode;
  clientId: number;
  separationDate: string;
};

const ASSIGNMENT_MAP: Record<string, MockAssignment> = {
  "altos-del-valle:A-101": {
    fullName: "Maria Garcia",
    email: "maria.garcia@cliente.com",
    phone: "+51 998 102 445",
    dni: "47851234",
    paymentMode: "credito_hipotecario",
    clientId: 1,
    separationDate: "2026-01-18",
  },
  "altos-del-valle:B-101": {
    fullName: "Carlos Mendoza",
    email: "carlos.mendoza@cliente.com",
    phone: "+51 955 821 110",
    dni: "45896321",
    paymentMode: "credito_directo",
    clientId: 2,
    separationDate: "2026-02-05",
  },
  "bosques-de-cayetano:C-201": {
    fullName: "Ana Soto",
    email: "ana.soto@cliente.com",
    phone: "+51 944 332 118",
    dni: "73451220",
    paymentMode: "credito_hipotecario",
    clientId: 3,
    separationDate: "2026-02-21",
  },
};

function makeFile(name: string, size = "1.2 MB", uploadedAt = "2026-05-18"): FileDescriptor {
  return {
    fileName: name,
    fileSizeLabel: size,
    uploadedAt,
  };
}

function makeDocumentId(prefix: string, suffix: string) {
  return `${prefix}-${suffix}`.toLowerCase().replace(/\s+/g, "-");
}

function makeStep(label: string, completed = false, date = ""): StepProgress {
  return {
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    label,
    completed,
    date,
    note: "",
  };
}

function buildProcessState(mode: PaymentMode, projectPercent: number): PurchaseProcessState {
  const paymentSteps = mode === "credito_hipotecario" ? PAGOS_STEPS_HIPOTECARIO : PAGOS_STEPS_DIRECTO;
  const contractSteps =
    mode === "credito_hipotecario"
      ? CONTRATO_STEPS_HIPOTECARIO
      : CONTRATO_STEPS_HIPOTECARIO.filter((step) => step !== "Carta aprobacion banco");

  return {
    currentModule: projectPercent >= 100 ? 5 : 3,
    stages: {
      separacion: {
        module: "separacion",
        steps: SEPARACION_STEPS.map((step, index) => makeStep(step, index < 4, "2026-01-20")),
        internalNote: "Separacion validada por comercial.",
      },
      contrato: {
        module: "contrato",
        steps: contractSteps.map((step, index) =>
          makeStep(step, mode === "credito_directo" ? index < 2 : index < 3, index < 3 ? "2026-02-12" : ""),
        ),
        internalNote: "",
      },
      pagos: {
        module: "pagos",
        steps: paymentSteps.map((step, index) => makeStep(step, index < 1, index < 1 ? "2026-03-05" : "")),
        internalNote: "",
      },
      avance: {
        module: "avance",
        steps: [makeStep(`Avance global ${projectPercent}%`, projectPercent >= 100, "")],
        internalNote: "Hereda el avance global de obra.",
      },
      entrega: {
        module: "entrega",
        steps: ENTREGA_STEPS.map((step) => makeStep(step)),
        internalNote: "",
      },
      saneamiento: {
        module: "saneamiento",
        steps: SANEAMIENTO_STEPS.map((step) => makeStep(step)),
        internalNote: "",
      },
    },
  };
}

function inferTypology(unitName: string, area: number): UnitTypology {
  if (unitName.toLowerCase().includes("estacionamiento")) return "estacionamiento";
  if (unitName.toLowerCase().includes("oficina")) return "oficina";
  if (area <= 70) return "1D";
  if (area <= 85) return "2D";
  return "3D";
}

function inferUnitStatus(client: UnitClientAssignment | null, projectPercent: number): UnitStatus {
  if (!client) return "disponible";
  if (projectPercent >= 100) return "entregado";
  if (client.paymentMode === "credito_hipotecario") return "en_contrato";
  return "separado";
}

function buildProjectConstruction(projectName: string): ConstructionProgress {
  const percentages: Record<ConstructionStageKey, number> = {
    demolicion: 100,
    inicio_obra: 100,
    excavacion: 92,
    cimentacion: 80,
    casco: 66,
    acabados_secos: 30,
    acabados_humedos: 24,
  };

  return {
    manualOverrideEnabled: false,
    manualOverridePercent: 0,
    licenses: {
      anteproyecto: {
        status: "aprobado",
        approvedAt: "2025-11-10",
        document: makeFile(`${projectName}-anteproyecto.pdf`),
      },
      licenciaObra: {
        status: "aprobado",
        approvedAt: "2025-12-18",
        document: makeFile(`${projectName}-licencia-obra.pdf`),
      },
    },
    stages: Object.fromEntries(
      CONSTRUCTION_STAGE_ORDER.map((stageKey) => [
        stageKey,
        {
          key: stageKey,
          status:
            percentages[stageKey] >= 100
              ? "completada"
              : percentages[stageKey] > 0
                ? "en_progreso"
                : "no_iniciada",
          percent: percentages[stageKey],
          startDate: "2026-01-15",
          estimatedEnd: "2026-09-30",
          media: {
            photos: [
              makeFile(`${CONSTRUCTION_STAGE_LABELS[stageKey]}-01.jpg`, "480 KB", "2026-05-02"),
              makeFile(`${CONSTRUCTION_STAGE_LABELS[stageKey]}-02.jpg`, "525 KB", "2026-05-09"),
            ],
            reports: [makeFile(`${stageKey}-reporte-mensual.pdf`, "2.1 MB", "2026-05-15")],
          },
        },
      ]),
    ) as ConstructionProgress["stages"],
  };
}

function getGlobalPercent(construction: ConstructionProgress) {
  const values = CONSTRUCTION_STAGE_ORDER.map((key) => construction.stages[key].percent);
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function buildProjectDocuments(projectId: string): DocumentRecord[] {
  return PROJECT_DOCUMENT_DEFINITIONS.slice(0, 5).map((definition, index) => ({
    id: makeDocumentId(projectId, definition.type),
    scope: "project",
    module: "avance",
    type: definition.type,
    title: definition.label,
    kind: definition.kind,
    externalUrl:
      definition.kind === "url" ? "https://example.com/recorrido-virtual" : undefined,
    version: 1,
    visibleToClient: definition.type !== "licencia_demolicion",
    notes: index === 0 ? "Documento validado por gerencia tecnica." : "",
    date: "2026-05-18",
    file:
      definition.kind === "pdf"
        ? makeFile(`${projectId}-${definition.type}.pdf`, "1.8 MB", "2026-05-18")
        : null,
  }));
}

function buildPaymentSchedule(mode: PaymentMode): PaymentEntry[] {
  if (mode === "credito_hipotecario") {
    return [
      {
        id: "hip-0",
        kind: "hito",
        concept: "Cuota inicial",
        dueDate: "2026-03-05",
        amount: 48000,
        status: "pagado",
        paidAmount: 48000,
        paymentDate: "2026-03-04",
        paymentType: "Transferencia bancaria",
        voucher: makeFile("voucher-cuota-inicial.pdf", "350 KB", "2026-03-04"),
      },
      {
        id: "hip-1",
        kind: "hito",
        concept: "Inicio desembolso",
        dueDate: "2026-06-14",
        amount: 120000,
        status: "por_vencer",
        paidAmount: 0,
        paymentDate: "",
        paymentType: "",
      },
      {
        id: "hip-2",
        kind: "hito",
        concept: "Firma escritura publica",
        dueDate: "2026-07-20",
        amount: 90000,
        status: "pendiente",
        paidAmount: 0,
        paymentDate: "",
        paymentType: "",
      },
    ];
  }

  return [
    {
      id: "dir-0",
      kind: "cuota",
      concept: "Separacion",
      dueDate: "2026-02-05",
      amount: 10000,
      status: "pagado",
      paidAmount: 10000,
      paymentDate: "2026-02-05",
      paymentType: "Transferencia",
      voucher: makeFile("voucher-separacion.pdf", "220 KB", "2026-02-05"),
    },
    {
      id: "dir-1",
      kind: "cuota",
      concept: "Cuota inicial",
      dueDate: "2026-03-15",
      amount: 45000,
      status: "pagado",
      paidAmount: 45000,
      paymentDate: "2026-03-15",
      paymentType: "Transferencia",
      voucher: makeFile("voucher-cuota-inicial.pdf", "260 KB", "2026-03-15"),
    },
    {
      id: "dir-2",
      kind: "cuota",
      concept: "Cuota 1",
      dueDate: "2026-06-15",
      amount: 25000,
      status: "por_vencer",
      paidAmount: 0,
      paymentDate: "",
      paymentType: "",
    },
    {
      id: "dir-3",
      kind: "cuota",
      concept: "Cuota 2",
      dueDate: "2026-08-15",
      amount: 25000,
      status: "pendiente",
      paidAmount: 0,
      paymentDate: "",
      paymentType: "",
    },
  ];
}

function buildUnitDocuments(projectId: string, unitId: string, mode: PaymentMode): DocumentRecord[] {
  const docs: DocumentRecord[] = [
    {
      id: `${unitId}-proforma`,
      scope: "unit",
      module: "separacion",
      type: "proforma",
      title: "Proforma",
      kind: "pdf",
      version: 1,
      visibleToClient: true,
      notes: "",
      date: "2026-01-17",
      file: makeFile(`${projectId}-${unitId}-proforma.pdf`, "450 KB", "2026-01-17"),
    },
    {
      id: `${unitId}-contrato`,
      scope: "unit",
      module: "contrato",
      type: "contrato_cv",
      title: "Contrato CV",
      kind: "pdf",
      version: 2,
      visibleToClient: true,
      notes: "Version firmada por ambas partes.",
      date: "2026-02-22",
      file: makeFile(`${projectId}-${unitId}-contrato-firmado.pdf`, "1.4 MB", "2026-02-22"),
    },
    {
      id: `${unitId}-cronograma`,
      scope: "unit",
      module: "pagos",
      type: "cronograma_pagos",
      title: "Cronograma de pagos",
      kind: "pdf",
      version: 1,
      visibleToClient: true,
      notes: "",
      date: "2026-03-05",
      file: makeFile(`${projectId}-${unitId}-cronograma.pdf`, "820 KB", "2026-03-05"),
    },
  ];

  if (mode === "credito_hipotecario") {
    docs.push({
      id: `${unitId}-carta-banco`,
      scope: "unit",
      module: "contrato",
      type: "carta_aprobacion_banco",
      title: "Carta aprobacion banco",
      kind: "pdf",
      version: 1,
      visibleToClient: false,
      notes: "Pendiente de compartir al cliente luego de validacion legal.",
      date: "2026-02-18",
      file: makeFile(`${projectId}-${unitId}-carta-banco.pdf`, "650 KB", "2026-02-18"),
    });
  }

  return docs;
}

function buildUnit(
  projectId: string,
  towerId: string,
  towerName: string,
  unitName: string,
  index: number,
  baseArea: number,
  projectPercent: number,
): BackofficeUnit {
  const assignment = ASSIGNMENT_MAP[`${projectId}:${unitName}`];
  const client: UnitClientAssignment | null = assignment
    ? {
        clientId: assignment.clientId,
        fullName: assignment.fullName,
        dni: assignment.dni,
        email: assignment.email,
        phone: assignment.phone,
        separationDate: assignment.separationDate,
        paymentMode: assignment.paymentMode,
      }
    : null;
  const paymentMode = client?.paymentMode ?? "credito_directo";
  const id = `${projectId}-${towerId}-${unitName}`.toLowerCase();
  const typology = inferTypology(unitName, baseArea);
  const builtArea = Math.round(baseArea * 0.86);
  const freeArea = Math.max(0, baseArea - builtArea);

  return {
    id,
    towerId,
    projectId,
    number: unitName.replace("Dpto ", ""),
    floor: Number(unitName.match(/(\d{1,2})/)?.[1]?.slice(0, 2) ?? index + 1),
    area: baseArea,
    builtArea,
    freeArea,
    typology,
    distribution: typology === "3D" ? "Sala, comedor, cocina, 3 dormitorios" : "Sala, comedor, cocina integrada",
    salePrice: Math.round(baseArea * 3600),
    status: inferUnitStatus(client, projectPercent),
    client,
    process: buildProcessState(paymentMode, projectPercent),
    documents: buildUnitDocuments(projectId, id, paymentMode),
    contractSummary: {
      areaTechada: builtArea,
      areaLibre: freeArea,
      areaTotal: baseArea,
      totalSalePrice: Math.round(baseArea * 3600),
      deliveryDate: "2026-12-15",
      disbursementDate: paymentMode === "credito_hipotecario" ? "2026-07-20" : "",
      notes: "",
    },
    bankApproval: {
      amountApproved: paymentMode === "credito_hipotecario" ? Math.round(baseArea * 2600) : 0,
      issuedAt: paymentMode === "credito_hipotecario" ? "2026-02-15" : "",
      expiresAt: paymentMode === "credito_hipotecario" ? "2026-08-15" : "",
      plannedDisbursementDate: paymentMode === "credito_hipotecario" ? "2026-07-20" : "",
      notes: "",
    },
    paymentSchedule: buildPaymentSchedule(paymentMode),
  };
}

function buildProject(projectId: string): BackofficeProject | null {
  const project = getMockProjects().find((entry) => entry.slug === projectId);
  if (!project) return null;

  const constructionProgress = buildProjectConstruction(project.name);
  const globalPercent = getGlobalPercent(constructionProgress);

  const towers: BackofficeTower[] = project.towers.map((tower) => ({
    id: `${projectId}-tower-${tower.id}`,
    name: tower.name,
    projectId,
    floors: tower.floors,
    units: tower.units.map((unit, index) =>
      buildUnit(
        projectId,
        `${projectId}-tower-${tower.id}`,
        tower.name,
        unit.name,
        index,
        unit.meters,
        globalPercent,
      ),
    ),
  }));

  return {
    id: projectId,
    name: project.name,
    district: project.district,
    address: project.direction,
    startDate: project.date_init.toISOString().split("T")[0] ?? "",
    towers,
    constructionProgress,
    documents: buildProjectDocuments(projectId),
  };
}

export function createSeedWorkspace(): BackofficeWorkspace {
  return {
    projects: getMockProjects()
      .map((project) => buildProject(project.slug))
      .filter((project): project is BackofficeProject => project !== null),
  };
}

export function getSeedProjectIds() {
  return getMockProjects().map((project) => project.slug);
}

export function getSeedUnitIds(projectId: string) {
  const project = buildProject(projectId);
  if (!project) return [];
  return project.towers.flatMap((tower) => tower.units.map((unit) => unit.id));
}
