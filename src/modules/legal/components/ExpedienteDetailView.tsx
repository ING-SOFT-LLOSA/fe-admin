"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import {
  fetchCommercialStepper,
  updateCommercialHitoEstado,
  fetchEtapasExpediente,
  type StepperResponseDTO,
  type UsuarioActivoResponseDTO,
  type EtapaExpedienteResponseDTO,
} from "@/lib/api/expedientes";

import {
  fetchStageDocuments,
  uploadRequisitoArchivo,
  deleteRequisitoArchivo,
  updateRequisito,
  type DocumentoItem,
} from "@/lib/api/requisitos";

import {
  STAGE_ORDER,
  DOCUMENT_STAGES,
  STAGE_META,
  OPCIONES_ESTADO,
  ESTADO_BADGE,
  BACKEND_A_ESTADO,
  type EstadoHito,
  type StageId,
} from "./constants";

import { InfoChip, ResumenKpi, LoadingSpinner, Spinner, ErrorBanner } from "./ui";

import { useExpediente } from "./hooks";

type Props = {
  uuidUsuarioActivo: string;
};

export default function ExpedienteDetailView({ uuidUsuarioActivo }: Props) {
  // Tabs Navigation State
  const [activeTab, setActiveTab] = useState<"resumen" | "proceso" | "documentos">("resumen");

  // Load contract details and stages summary on mount
  const { expediente, stages, loading: pageLoading, error: pageError } = useExpediente(uuidUsuarioActivo);

  // Stepper Lazy Loading State
  const [stepper, setStepper] = useState<StepperResponseDTO | null>(null);
  const [isStepperLoading, setIsStepperLoading] = useState(false);
  const [stepperLoaded, setStepperLoaded] = useState(false);
  const [toggleError, setToggleError] = useState("");

  // Accordion Expand/Collapse State
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    SEPARACION: true,
  });

  // Documents Lazy Loading State
  const [documents, setDocuments] = useState<Record<string, DocumentoItem[]>>({});
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>("ALL");

  // Load Stepper data on mount to ensure summary cards display correct counts immediately
  useEffect(() => {
    if (!stepperLoaded && uuidUsuarioActivo) {
      async function loadStepper() {
        setIsStepperLoading(true);
        try {
          const data = await fetchCommercialStepper(uuidUsuarioActivo);
          setStepper(data);
          setExpandedStages(
            data.etapas?.reduce((acc, stage) => {
              // Expand stages that are EN_PROGRESO, or default to SEPARACION
              acc[stage.etapa] = stage.hitos?.some(h => h.estado === "EN_PROGRESO") || stage.etapa === "SEPARACION";
              return acc;
            }, {} as Record<string, boolean>) || { SEPARACION: true }
          );
          setStepperLoaded(true);
        } catch (err) {
          console.error("Error loading stepper lazy:", err);
        } finally {
          setIsStepperLoading(false);
        }
      }
      void loadStepper();
    }
  }, [activeTab, stepperLoaded, uuidUsuarioActivo]);

  // Reusable callback to load/reload stage documents
  const loadDocs = useCallback(async () => {
    if (!uuidUsuarioActivo) return;
    setIsDocsLoading(true);
    try {
      const activeStages = DOCUMENT_STAGES.filter((stage) =>
        stages.some((s) => s.etapaProceso === stage)
      );

      const results = await Promise.all(
        activeStages.map(async (stage) => {
          try {
            const res = await fetchStageDocuments(stage as any, uuidUsuarioActivo);
            return { stage, docs: res.documents ?? [] };
          } catch (err) {
            console.error(`Error loading documents for ${stage}:`, err);
            return { stage, docs: [] };
          }
        })
      );
      const docsMap: Record<string, DocumentoItem[]> = {};
      results.forEach((r) => {
        docsMap[r.stage] = r.docs;
      });
      setDocuments(docsMap);
      setDocsLoaded(true);
    } catch (err) {
      console.error("Error loading documents parallel:", err);
    } finally {
      setIsDocsLoading(false);
    }
  }, [uuidUsuarioActivo, stages]);

  // Load Documents data lazy when "documentos" tab is selected
  useEffect(() => {
    if (activeTab === "documentos" && !docsLoaded) {
      void loadDocs();
    }
  }, [activeTab, docsLoaded, loadDocs]);

  // Handle circular checkbox click with Optimistic Updates
  const handleToggleHito = async (uuidHitoComercial: string, currentEstado: string, stageId: string) => {
    if (!stepper) return;

    let nuevoEstado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" = "PENDIENTE";
    if (currentEstado === "PENDIENTE") {
      nuevoEstado = "EN_PROGRESO";
    } else if (currentEstado === "EN_PROGRESO") {
      nuevoEstado = "COMPLETADO";
    } else {
      nuevoEstado = "PENDIENTE";
    }

    const previousStepper = JSON.parse(JSON.stringify(stepper)) as StepperResponseDTO;

    // Optimistic Update
    const updatedEtapas = stepper.etapas.map((et) => {
      if (et.etapa === stageId) {
        const updatedHitos = et.hitos.map((h) => {
          if (h.uuidHitoComercial === uuidHitoComercial) {
            return {
              ...h,
              estado: nuevoEstado as "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO",
              fechaCompletado: nuevoEstado === "COMPLETADO" ? new Date().toISOString() : null,
            };
          }
          return h;
        });

        // Recompute percentage of completion
        const completedCount = updatedHitos.filter((h) => h.estado === "COMPLETADO").length;
        const pct = Math.round((completedCount / updatedHitos.length) * 100 * 100) / 100;

        return {
          ...et,
          hitos: updatedHitos,
          porcentajeAvance: pct,
        };
      }
      return et;
    });

    setStepper({
      ...stepper,
      etapas: updatedEtapas,
    });

    try {
      await updateCommercialHitoEstado(uuidHitoComercial, nuevoEstado);
      // Sync fresh data from the server
      const freshData = await fetchCommercialStepper(uuidUsuarioActivo);
      setStepper(freshData);
    } catch (err) {
      console.error("Hito toggle failed:", err);
      // Revert optimistic update on failure
      setStepper(previousStepper);
      setToggleError("No se pudo actualizar el hito. Intente nuevamente.");
      setTimeout(() => setToggleError(""), 4000);
    }
  };

  // Toggle stage accordion collapse
  const toggleAccordion = (stageId: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Date Formatting Helper
  const formatFecha = (isoString: string | null | undefined): string => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Label Formatter for Financing
  const formatFinancing = (type: string | null | undefined): string => {
    if (!type) return "—";
    if (type === "CREDITO_DIRECTO") return "Crédito Directo";
    if (type === "CREDITO_HIPOTECARIO") return "Crédito Hipotecario";
    return type;
  };

  // Early returns for Loading and Error states
  if (pageLoading) {
    return <LoadingSpinner label="Cargando expediente..." />;
  }

  if (pageError || !expediente) {
    return (
      <div className="p-4">
        <ErrorBanner message={pageError || "Expediente no encontrado."} />
        <Link
          href="/legal"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-build-accent hover:underline"
        >
          ← Volver a Gestión Legal
        </Link>
      </div>
    );
  }

  const idShort = expediente.uuidUsuarioActivo.slice(0, 8).toUpperCase();

  return (
    <section className="space-y-6">
      {/* 1. Breadcrumb */}
      <div>
        <Link
          href="/legal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-build-accent dark:text-white/60 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Gestión Legal
        </Link>
      </div>

      {/* 2. Header del expediente */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-build-main dark:text-white">
              EXP-{idShort}
            </h1>
            
            {/* Badge de estado */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                expediente.vigente !== false
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40"
              }`}
            >
              {expediente.vigente !== false ? "Vigente" : "Desvinculado"}
            </span>

            {/* Badge de financiamiento */}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              {formatFinancing(expediente.tipoFinanciamiento)}
            </span>
          </div>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-white/50">
            Creado el {formatFecha(expediente.fechaAdquisicion)} · Proceso jurídico de compraventa
          </p>
        </div>
      </div>

      {/* 3. Banda de contexto */}
      <ExpedienteContextBand clientes={expediente.clientes} activos={expediente.activos} />

      {/* 4. Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10 scrollbar-none">
        <button
          onClick={() => setActiveTab("resumen")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "resumen"
              ? "border-build-accent text-build-accent"
              : "border-transparent text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          Resumen
        </button>
        <button
          onClick={() => setActiveTab("proceso")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "proceso"
              ? "border-build-accent text-build-accent"
              : "border-transparent text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          Proceso legal
        </button>
        <button
          onClick={() => setActiveTab("documentos")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "documentos"
              ? "border-build-accent text-build-accent"
              : "border-transparent text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">folder_open</span>
          Documentos
        </button>
      </div>

      {toggleError && <ErrorBanner message={toggleError} />}

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === "resumen" && (
          <EtapasResumen stages={stages} stepper={stepper} />
        )}

        {activeTab === "proceso" && (
          <ProcesoLegalAccordion
            stepper={stepper}
            isLoading={isStepperLoading}
            expandedStages={expandedStages}
            onToggleAccordion={toggleAccordion}
            onToggleHito={handleToggleHito}
          />
        )}

        {activeTab === "documentos" && (
          <DocumentosTab
            documents={documents}
            isLoading={isDocsLoading}
            selectedFilter={selectedDocFilter}
            onFilterChange={setSelectedDocFilter}
            formatFecha={formatFecha}
            onRefresh={loadDocs}
          />
        )}
      </div>
    </section>
  );
}

// ─── Subcomponent: ExpedienteContextBand ────────────────────────────────────
function ExpedienteContextBand({
  clientes,
  activos,
}: {
  clientes: UsuarioActivoResponseDTO["clientes"];
  activos: UsuarioActivoResponseDTO["activos"];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
      {/* Columna izquierda — Titulares */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">
          Titulares
        </h3>
        <div className="flex flex-wrap gap-2">
          {clientes && clientes.length > 0 ? (
            clientes.map((c) => {
              const fullName = [c.nombre, c.apellidos].filter(Boolean).join(" ");
              const initials = fullName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white/80 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-build-accent text-white flex items-center justify-center text-[9px] font-bold">
                    {initials}
                  </div>
                  {fullName}
                </Link>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No hay titulares vinculados.</p>
          )}
        </div>
      </div>

      {/* Columna derecha — Unidades vinculadas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">
          Unidades Vinculadas
        </h3>
        <div className="flex flex-wrap gap-2">
          {activos && activos.length > 0 ? (
            activos.map((a) => {
              let icon = "apartment";
              let typeLabel = "Dpto";

              if (a.tipo === "ESTACIONAMIENTO") {
                icon = "directions_car";
                typeLabel = "Cochera";
              } else if (a.tipo === "DEPOSITO") {
                icon = "inventory_2";
                typeLabel = "Depósito";
              }

              return (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white/80"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-white/40">{icon}</span>
                  {a.torreNombre} · {typeLabel} {a.nro}
                </span>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No hay unidades vinculadas.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponent: EtapasResumen (Tab 1) ────────────────────────────────────
function EtapasResumen({
  stages,
  stepper,
}: {
  stages: EtapaExpedienteResponseDTO[];
  stepper: StepperResponseDTO | null;
}) {
  // Determine Stage stats (estimated or precise from stepper if loaded)
  let totalHitos = 0;
  let completedHitos = 0;
  if (stepper) {
    totalHitos = stepper.etapas?.reduce((acc, e) => acc + (e.hitos?.length ?? 0), 0) ?? 0;
    completedHitos = stepper.etapas?.flatMap((e) => e.hitos ?? []).filter((h) => h.estado === "COMPLETADO").length ?? 0;
  } else {
    totalHitos = stages.reduce((acc, st) => acc + (st.totalHitos ?? 0), 0);
    // Estimations based on summary states
    completedHitos = stages.reduce((acc, st) => {
      if (st.estado === "COMPLETADO") return acc + (st.totalHitos ?? 0);
      if (st.estado === "EN_PROGRESO") return acc + Math.floor((st.totalHitos ?? 0) / 2);
      return acc;
    }, 0);
  }

  // Predefined stages display list (SEPARACION, CONTRATO, PAGO, ENTREGA, SANEAMIENTO)
  const orderedStagesList = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"];

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Completed Card */}
        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-xs font-bold uppercase tracking-wider">Hitos completados</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{completedHitos}</p>
        </div>

        {/* Total Card */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 mb-1">
            <span className="material-symbols-outlined text-[20px]">list</span>
            <span className="text-xs font-bold uppercase tracking-wider">Hitos totales</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalHitos}</p>
        </div>
      </div>

      {/* Progress Stage List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wider">
          Avance de Etapas del Expediente
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedStagesList.map((stageId) => {
            const summaryStage = stages.find((s) => s.etapaProceso === stageId);
            const stepperStage = stepper?.etapas?.find((e) => e.etapa === stageId);
            const meta = STAGE_META[stageId as StageId] || { label: stageId, icon: "circle" };

            let completions = 0;
            let totalStageHitos = summaryStage?.totalHitos ?? 0;
            let pct = 0;

            if (stepperStage) {
              totalStageHitos = stepperStage.hitos?.length ?? 0;
              completions = stepperStage.hitos?.filter((h) => h.estado === "COMPLETADO").length ?? 0;
              pct = stepperStage.porcentajeAvance ?? 0;
            } else if (summaryStage) {
              if (summaryStage.estado === "COMPLETADO") {
                completions = summaryStage.totalHitos ?? 0;
                pct = 100;
              } else if (summaryStage.estado === "EN_PROGRESO") {
                completions = Math.floor((summaryStage.totalHitos ?? 0) / 2);
                pct = 50;
              }
            }

            // Stage State logic
            let badgeText = "Pendiente";
            let badgeClass = "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40";
            if (pct === 100) {
              badgeText = "Completado";
              badgeClass = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
            } else if (pct > 0) {
              badgeText = "En progreso";
              badgeClass = "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400";
            }

            return (
              <div
                key={stageId}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-build-accent">{meta.icon}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{meta.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-white/20"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 dark:text-white/35 font-semibold">
                  <span>{pct}% avance</span>
                  <span>
                    {completions}/{totalStageHitos} hitos
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponent: ProcesoLegalAccordion (Tab 2) ────────────────────────────
function ProcesoLegalAccordion({
  stepper,
  isLoading,
  expandedStages,
  onToggleAccordion,
  onToggleHito,
}: {
  stepper: StepperResponseDTO | null;
  isLoading: boolean;
  expandedStages: Record<string, boolean>;
  onToggleAccordion: (stageId: string) => void;
  onToggleHito: (uuidHito: string, currentEstado: string, stageId: string) => Promise<void>;
}) {
  if (isLoading && !stepper) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-build-accent mr-3 mb-2" />
        <span className="text-sm text-slate-400 dark:text-white/45">Cargando hitos del proceso...</span>
      </div>
    );
  }

  if (!stepper) {
    return <ErrorBanner message="No se pudo cargar el proceso legal." />;
  }

  const sortedEtapas = stepper.etapas
    ? [...stepper.etapas].sort(
        (a, b) => STAGE_ORDER.indexOf(a.etapa as StageId) - STAGE_ORDER.indexOf(b.etapa as StageId)
      )
    : [];

  return (
    <div className="space-y-4">
      {sortedEtapas.map((etapa) => {
        const stageId = etapa.etapa;
        const meta = STAGE_META[stageId as StageId] || { label: stageId, icon: "circle" };
        const isExpanded = !!expandedStages[stageId];

        const totalHitos = etapa.hitos?.length ?? 0;
        const completedHitos = etapa.hitos?.filter((h) => h.estado === "COMPLETADO").length ?? 0;
        const pct = etapa.porcentajeAvance ?? 0;

        return (
          <div
            key={stageId}
            className="border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Header / Accordion trigger */}
            <div
              onClick={() => onToggleAccordion(stageId)}
              className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] select-none transition"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-white/45">
                  {meta.icon}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                    {meta.label}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5 font-medium">
                    {completedHitos} de {totalHitos} completados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Small horizontal progress bar */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-[80px] h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-slate-200"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-white/60 w-10 text-right">
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Chevron */}
                <span
                  className={`material-symbols-outlined text-slate-400 dark:text-white/45 transform transition-transform duration-300 ${
                    isExpanded ? "rotate-185" : "rotate-0"
                  }`}
                  style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  expand_more
                </span>
              </div>
            </div>

            {/* Accordion body list of hitos */}
            {isExpanded && (
              <div className="px-6 pb-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                {etapa.hitos && etapa.hitos.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {etapa.hitos
                      .sort((a, b) => a.orden - b.orden)
                      .map((hito) => {
                        const isCompleted = hito.estado === "COMPLETADO";
                        const isProgress = hito.estado === "EN_PROGRESO";
                        
                        // Checkbox styling based on state
                        let checkboxClass = "border-slate-300 dark:border-white/20 text-transparent";
                        if (isCompleted) {
                          checkboxClass = "bg-emerald-500 border-emerald-500 text-white";
                        } else if (isProgress) {
                          checkboxClass = "bg-amber-500 border-amber-500 text-white";
                        }

                        // State Badge
                        const mappedEstado = BACKEND_A_ESTADO[hito.estado] || hito.estado.toLowerCase();
                        const badgeInfo = ESTADO_BADGE[mappedEstado as EstadoHito] || { label: hito.estado, cls: "" };

                        return (
                          <div
                            key={hito.uuidHitoComercial}
                            className="flex items-start justify-between gap-4 py-2"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Circular Checkbox */}
                              <button
                                onClick={() => onToggleHito(hito.uuidHitoComercial, hito.estado, stageId)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition hover:scale-105 active:scale-95 ${checkboxClass}`}
                              >
                                {isCompleted ? (
                                  <span className="material-symbols-outlined text-[13px] font-extrabold">check</span>
                                ) : isProgress ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                ) : null}
                              </button>

                              {/* Hito detail */}
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-semibold transition ${
                                    isCompleted
                                      ? "line-through text-slate-400 dark:text-white/20"
                                      : "text-slate-700 dark:text-white/80"
                                  }`}
                                >
                                  {hito.nombreHito}
                                </p>
                                {hito.descripcion && (
                                  <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5 leading-snug">
                                    {hito.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Badge */}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${badgeInfo.cls}`}>
                              {badgeInfo.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center mt-4">
                    No hay hitos configurados para esta etapa.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Subcomponent: DocumentosTab (Tab 3) ────────────────────────────────────
function DocumentosTab({
  documents,
  isLoading,
  selectedFilter,
  onFilterChange,
  formatFecha,
  onRefresh,
}: {
  documents: Record<string, DocumentoItem[]>;
  isLoading: boolean;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  formatFecha: (isoString: string | null | undefined) => string;
  onRefresh: () => Promise<void>;
}) {
  const filterOptions = [
    { id: "ALL", label: "Todos" },
    { id: "SEPARACION", label: "Separación" },
    { id: "CONTRATO", label: "Contrato" },
    { id: "PAGO", label: "Pago" },
    { id: "ENTREGA", label: "Entrega" },
    { id: "SANEAMIENTO", label: "Saneamiento" },
    { id: "OTRO", label: "Otro" },
  ];

  // Edit Modal States
  const [editingDoc, setEditingDoc] = useState<DocumentoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNota, setEditNota] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editingDocLoading, setEditingDocLoading] = useState(false);

  // Upload & Delete States
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Flatten and filter documents list
  const allDocs = Object.keys(documents).flatMap((stageKey) => {
    return documents[stageKey].map((d) => ({
      ...d,
      stageKey,
    }));
  });

  const filteredDocs = allDocs.filter((d) => {
    if (selectedFilter === "ALL") return true;
    return d.stageKey === selectedFilter;
  });

  function getEtapaReadableLabel(stageKey: string): string {
    switch (stageKey) {
      case "SEPARACION": return "Separación";
      case "CONTRATO": return "Contrato";
      case "PAGO": return "Pago";
      case "ENTREGA": return "Entrega";
      case "SANEAMIENTO": return "Saneamiento";
      case "OTRO": return "Otro";
      default: return stageKey;
    }
  }

  // Edit Handlers
  const handleEditClick = (doc: DocumentoItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || "");
    setEditDesc(doc.description || "");
    setEditNota(doc.notaCorporativa || "");
    if (doc.emissionDate) {
      if (doc.emissionDate.includes("-")) {
        setEditFecha(doc.emissionDate.substring(0, 10));
      } else {
        setEditFecha("");
      }
    } else {
      setEditFecha("");
    }
    setEditIcon(doc.icon || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setEditingDocLoading(true);
    setActionError(null);
    try {
      await updateRequisito(editingDoc.id, {
        titulo: editTitle,
        descripcion: editDesc,
        notaCorporativa: editNota,
        fechaEmision: editFecha || undefined,
        icono: editIcon || undefined,
      });
      setEditingDoc(null);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al actualizar la información.");
    } finally {
      setEditingDocLoading(false);
    }
  };

  // Upload Handler
  const handleUploadClick = (docId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingDocId(docId);
      setActionError(null);
      try {
        await uploadRequisitoArchivo(docId, file);
        await onRefresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error al subir el archivo.");
      } finally {
        setUploadingDocId(null);
      }
    };
    input.click();
  };

  // Delete Handler
  const handleDeleteClick = async (docId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar el archivo de este requisito?")) return;
    setDeletingDocId(docId);
    setActionError(null);
    try {
      await deleteRequisitoArchivo(docId);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al eliminar el archivo.");
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} />}

      {/* Horizontal filter chips */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
        {filterOptions.map((opt) => {
          const isActive = selectedFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                isActive
                  ? "bg-build-accent border-build-accent text-white"
                  : "bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/25"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      {isLoading && allDocs.length === 0 ? (
        // Skeleton loader
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-48" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-32" />
                </div>
              </div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10">
          <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-white/15 mb-2">
            description
          </span>
          <p className="text-sm font-semibold text-slate-400 dark:text-white/30">
            No hay documentos en esta etapa.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredDocs.map((doc) => {
            const hasUrl = doc.hasDownload && !!doc.downloadUrl;
            const isCompleted = doc.status?.toLowerCase() === "completada" || hasUrl;
            
            return (
              <div
                key={doc.id}
                className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Dynamic Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] font-semibold">
                        {doc.icon || "description"}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-white/80">
                          {doc.title}
                        </h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCompleted
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/45"
                        }`}>
                          {isCompleted ? "Completado" : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-white/35">
                        {getEtapaReadableLabel(doc.stageKey)} · Emisión: {formatFecha(doc.emissionDate)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Column (Download, Upload, Edit, Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Download Button */}
                    {hasUrl && (
                      <button
                        onClick={() => window.open(doc.downloadUrl!, "_blank")}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-build-accent dark:text-white/60 dark:hover:text-white transition"
                        title="Descargar / Ver Archivo"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    )}

                    {/* Upload / Re-upload Button */}
                    <button
                      onClick={() => handleUploadClick(doc.id)}
                      disabled={uploadingDocId === doc.id}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-build-accent dark:text-white/60 dark:hover:text-white transition disabled:opacity-55"
                      title={hasUrl ? "Reemplazar Archivo" : "Subir Archivo"}
                    >
                      {uploadingDocId === doc.id ? (
                        <Spinner className="w-4 h-4 text-build-accent" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      )}
                    </button>

                    {/* Edit Metadata Button */}
                    <button
                      onClick={() => handleEditClick(doc)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-build-accent dark:text-white/60 dark:hover:text-white transition"
                      title="Editar Información"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Delete File Button */}
                    {hasUrl && (
                      <button
                        onClick={() => handleDeleteClick(doc.id)}
                        disabled={deletingDocId === doc.id}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition disabled:opacity-55"
                        title="Eliminar Archivo"
                      >
                        {deletingDocId === doc.id ? (
                          <Spinner className="w-4 h-4 text-red-500" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Description info */}
                {doc.description && (
                  <p className="text-xs text-slate-500 dark:text-white/50 pl-13 leading-relaxed">
                    {doc.description}
                  </p>
                )}

                {/* Corporate Note (Styled Container) */}
                {doc.notaCorporativa ? (
                  <div className="pl-13">
                    {!isCompleted ? (
                      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3.5 text-xs text-amber-800 dark:text-amber-400 border-l-4 border-amber-500 leading-relaxed shadow-sm flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-[18px] shrink-0 mt-0.5 select-none">
                          warning
                        </span>
                        <div className="space-y-1">
                          <span className="font-extrabold text-amber-900 dark:text-amber-300 block text-[10px] uppercase tracking-wider">
                            Nota del Abogado (Observación):
                          </span>
                          <p className="font-medium">{doc.notaCorporativa}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3 text-xs text-slate-500 dark:text-white/50 leading-relaxed italic">
                        <span className="font-bold not-italic text-slate-600 dark:text-white/60 block text-[10px] uppercase tracking-wider mb-1">
                          Nota Corporativa:
                        </span>
                        {doc.notaCorporativa}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pl-13">
                    <p className="text-[10px] text-slate-400 dark:text-white/30 italic">Sin notas corporativas.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog Modal Overlay */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-build-accent">edit_document</span>
                Editar Requisito Documental
              </h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Título *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-4 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white transition"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Descripción</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-4 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white transition resize-none"
                />
              </div>

              {/* Corporate Note Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Nota Corporativa</label>
                <textarea
                  value={editNota}
                  onChange={(e) => setEditNota(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-4 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Emission Date Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-4 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white transition"
                  />
                </div>

                {/* Icon Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Icono (Material)</label>
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder="e.g. description"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-4 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  disabled={editingDocLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/80 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editingDocLoading}
                  className="px-4 py-2 rounded-xl bg-build-accent hover:bg-build-accent/95 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editingDocLoading && <Spinner className="w-3.5 h-3.5 text-white" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
