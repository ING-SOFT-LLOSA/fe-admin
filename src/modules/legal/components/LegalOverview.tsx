"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  fetchProyectos,
  fetchTorresPorProyecto,
  type Proyecto,
  type TorreResponseDTO,
} from "@/lib/api/proyectos";
import {
  fetchTodosLosContratos,
  fetchEtapasExpediente,
  fetchCommercialStepper,
  type UsuarioActivoResponseDTO,
  type EtapaExpedienteResponseDTO,
} from "@/lib/api/expedientes";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ETAPA_ORDER = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"] as const;
type EtapaClave = (typeof ETAPA_ORDER)[number];

const ETAPA_LABEL: Record<EtapaClave, string> = {
  SEPARACION: "Separación",
  CONTRATO:   "Contrato",
  PAGO:       "Pagos",
  ENTREGA:    "Entrega",
  SANEAMIENTO:"Saneamiento",
};

// Days without forward movement before we flag it as stalled.
const STALLED_DAYS = 14;

// ─────────────────────────────────────────────
// Small pure helpers
// ─────────────────────────────────────────────

function formatEtapaLabel(ep: string): string {
  return ETAPA_LABEL[ep as EtapaClave] ?? ep;
}

/** Returns the label of the first in-progress or next-pending stage. */
function getEtapaActualLabel(stages: EtapaExpedienteResponseDTO[] | undefined): string {
  if (!stages || stages.length === 0) return "Por iniciar";
  const sorted = [...stages].sort(
    (a, b) => ETAPA_ORDER.indexOf(a.etapaProceso as EtapaClave) - ETAPA_ORDER.indexOf(b.etapaProceso as EtapaClave),
  );
  const inProgress = sorted.find((s) => s.estado === "EN_PROGRESO");
  if (inProgress) return formatEtapaLabel(inProgress.etapaProceso);
  const pending = sorted.find((s) => s.estado === "PENDIENTE");
  if (pending) return formatEtapaLabel(pending.etapaProceso);
  return "Saneamiento";
}

/** Days since a given ISO date string. Returns null if the date is invalid. */
function daysSince(isoDate: string | undefined | null): number | null {
  if (!isoDate) return null;
  const ms = Date.now() - new Date(isoDate).getTime();
  if (isNaN(ms)) return null;
  return Math.floor(ms / 86_400_000);
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/**
 * Five-dot mini-stepper for the Etapa column.
 *
 * Props:
 *   stages  – corrected stages array for the contract
 *   current – label of the active/next stage
 */
function MiniStepper({
  stages,
  current,
}: {
  stages: EtapaExpedienteResponseDTO[] | undefined;
  current: string;
}) {
  if (!stages || stages.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-white/30">Por iniciar</span>;
  }

  // Map each canonical etapa to its computed estado
  const stateByEtapa = Object.fromEntries(
    stages.map((s) => [s.etapaProceso, s.estado]),
  );

  // Hito counts for the active stage
  const activeStage = stages.find((s) => s.estado === "EN_PROGRESO") ?? stages.find((s) => s.estado === "PENDIENTE");
  const completedHitos = activeStage?.hitosCompletados ?? 0;
  const totalHitos     = activeStage?.totalHitos ?? 0;

  return (
    <div className="flex flex-col gap-1">
      {/* Stage label pill */}
      <span className="inline-flex w-fit items-center rounded px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/70">
        {current}
      </span>

      {/* Dots row */}
      <div className="flex items-center gap-1">
        {ETAPA_ORDER.map((ep) => {
          const estado = stateByEtapa[ep];
          let dot = "bg-slate-200 dark:bg-white/10"; // PENDIENTE / unknown
          if (estado === "COMPLETADO")  dot = "bg-emerald-500";
          if (estado === "EN_PROGRESO") dot = "bg-amber-400";
          return (
            <span
              key={ep}
              title={ETAPA_LABEL[ep]}
              className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`}
            />
          );
        })}
        {totalHitos > 0 && (
          <span className="ml-1 text-[10px] text-slate-400 dark:text-white/30">
            {completedHitos}/{totalHitos}
          </span>
        )}
      </div>
    </div>
  );
}

/** Red "N días sin avance" chip shown when a contract looks stalled. */
function StalledChip({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
      <span className="material-symbols-outlined text-[11px]">warning</span>
      {days}d sin avance
    </span>
  );
}

/** Four summary metric cards rendered above the filter bar. */
function MetricCards({
  contracts,
  stages,
  isLoading,
}: {
  contracts: UsuarioActivoResponseDTO[];
  stages: Record<string, EtapaExpedienteResponseDTO[]>;
  isLoading: boolean;
}) {
  const stats = useMemo(() => {
    let total      = contracts.length;
    let enProceso  = 0;
    let firmaPend  = 0;
    let bloqueados = 0;

    for (const c of contracts) {
      const stgs = stages[c.uuidUsuarioActivo];
      if (!stgs) continue;

      const hasInProgress = stgs.some((s) => s.estado === "EN_PROGRESO");
      if (hasInProgress) enProceso++;

      const needsSignature = stgs.some(
        (s) =>
          (s.etapaProceso === "CONTRATO" || s.etapaProceso === "SANEAMIENTO") &&
          s.estado !== "COMPLETADO",
      );
      if (needsSignature) firmaPend++;

      const days = daysSince((c as any).ultimaActualizacion ?? null);
      if (days !== null && days > STALLED_DAYS) bloqueados++;
    }

    return { total, enProceso, firmaPend, bloqueados };
  }, [contracts, stages]);

  const cards = [
    { label: "Total expedientes", value: stats.total,     color: "text-build-main dark:text-white" },
    { label: "En proceso",        value: stats.enProceso, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Firma pendiente",   value: stats.firmaPend, color: "text-amber-600 dark:text-amber-400" },
    { label: "Bloqueados",        value: stats.bloqueados,color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-xl bg-slate-50 dark:bg-white/[0.04] px-4 py-3"
        >
          <p className="text-xs text-slate-500 dark:text-white/50 mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${color}`}>
            {isLoading ? (
              <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            ) : (
              value
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Skeleton row for loading state
// ─────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
      {[40, 120, 100, 80, 60].map((w, i) => (
        <td key={i} className="px-5 py-3">
          <span
            className="inline-block h-3.5 animate-pulse rounded bg-slate-100 dark:bg-white/10"
            style={{ width: w }}
          />
        </td>
      ))}
      <td className="px-5 py-3" />
    </tr>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function LegalOverview() {
  const router = useRouter();

  const [contracts, setContracts]           = useState<UsuarioActivoResponseDTO[]>([]);
  const [contractsStages, setContractsStages] = useState<Record<string, EtapaExpedienteResponseDTO[]>>({});
  const [isLoading, setIsLoading]           = useState(true);
  const [isStagesLoading, setIsStagesLoading] = useState(false);
  const [error, setError]                   = useState("");
  const [search, setSearch]                 = useState("");

  // Cascading filter states
  const [selectedProyecto, setSelectedProyecto] = useState("");
  const [selectedTorre, setSelectedTorre]       = useState("");
  const [selectedEstado, setSelectedEstado]     = useState("");
  const [selectedEtapa, setSelectedEtapa]       = useState("");
  const [ocultarDesistidos, setOcultarDesistidos] = useState(true);





const [proyectosList, setProyectosList]   = useState<Proyecto[]>([]);
const [proyectosOptions, setProyectosOptions] = useState<string[]>([]);
const [torresOptions, setTorresOptions]   = useState<string[]>([]);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;


// y en el fetch:
useEffect(() => {
  fetchProyectos().then((list) => {
    setProyectosList(list);
    setProyectosOptions(list.map((p) => p.nombre).sort());
  });
}, []);
  // Reset page to 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedProyecto, selectedTorre, selectedEstado, selectedEtapa, search, ocultarDesistidos]);

  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const list = await fetchTodosLosContratos();
        if (!mounted) return;
        setContracts(list);

        setIsStagesLoading(true);
        const stagesMap: Record<string, EtapaExpedienteResponseDTO[]> = {};

        await Promise.all(
          list.map(async (c) => {
            try {
              const [stages, stepper] = await Promise.all([
                fetchEtapasExpediente(c.uuidUsuarioActivo),
                fetchCommercialStepper(c.uuidUsuarioActivo),
              ]);

              const corrected = stages.map((stage) => {
                const stepperStage = stepper.etapas?.find((e) => e.etapa === stage.etapaProceso);
                if (!stepperStage) return stage;

                const total      = stepperStage.hitos?.length ?? 0;
                const completed  = stepperStage.hitos?.filter((h) => h.estado === "COMPLETADO").length ?? 0;
                const inProgress = stepperStage.hitos?.filter((h) => h.estado === "EN_PROGRESO").length ?? 0;

                let estado = "PENDIENTE";
                if (completed === total && total > 0)   estado = "COMPLETADO";
                else if (completed > 0 || inProgress > 0) estado = "EN_PROGRESO";

                return { ...stage, estado, totalHitos: total, hitosCompletados: completed };
              });

              stagesMap[c.uuidUsuarioActivo] = corrected;
            } catch {
              // Non-fatal: the row will just show "—" for stage
            }
          }),
        );

        if (mounted) setContractsStages(stagesMap);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudieron cargar los expedientes.");
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsStagesLoading(false);
        }
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  // Reset Torre when Proyecto changes
  useEffect(() => { setSelectedTorre(""); }, [selectedProyecto]);
useEffect(() => {
  fetchProyectos().then((list) => {
    setProyectosList(list);
    setProyectosOptions(list.map((p) => p.nombre).sort());
  });
}, []);

useEffect(() => {
  setSelectedTorre("");
  setTorresOptions([]);
  if (!selectedProyecto) return;
  const proyecto = proyectosList.find((p) => p.nombre === selectedProyecto);
  if (!proyecto) return;
  fetchTorresPorProyecto(proyecto.id).then((list) =>
    setTorresOptions(list.map((t) => t.nombre).sort())
  );
}, [selectedProyecto, proyectosList]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      contracts.filter((c) => {
        if (selectedProyecto) {
          if (!(c.activos ?? []).some((a) => a.proyectoNombre === selectedProyecto)) return false;
        }
        if (selectedTorre) {
          if (!(c.activos ?? []).some((a) => a.torreNombre === selectedTorre)) return false;
        }
        if (selectedEstado) {
          const label = c.vigente !== false ? "Vigente" : "Desvinculado";
          if (label !== selectedEstado) return false;
        }
        if (ocultarDesistidos && c.vigente === false) {
          return false;
        }
        if (selectedEtapa) {
          const stgs    = contractsStages[c.uuidUsuarioActivo];
          const label   = getEtapaActualLabel(stgs);
          const matches = label === selectedEtapa || (label.includes("Saneamiento") && selectedEtapa === "Saneamiento");
          if (!matches) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const byId       = c.uuidUsuarioActivo.toLowerCase().includes(q) || `exp-${c.uuidUsuarioActivo.slice(0, 8)}`.toLowerCase().includes(q);
          const byCliente  = c.clientes?.some((cl) =>
            [cl.nombre, cl.apellidos].filter(Boolean).join(" ").toLowerCase().includes(q) ||
            cl.email.toLowerCase().includes(q) ||
            (cl.documentoIdentidad ?? "").toLowerCase().includes(q),
          );
          const byActivo   = c.activos?.some((a) =>
            `${a.torreNombre} ${a.tipo} ${a.nro}`.toLowerCase().includes(q) ||
            (a.proyectoNombre ?? "").toLowerCase().includes(q),
          );
          if (!byId && !byCliente && !byActivo) return false;
        }
        return true;
      }),
    [contracts, contractsStages, selectedProyecto, selectedTorre, selectedEstado, selectedEtapa, search, ocultarDesistidos],
  );

  // ── Paginated list ──────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const hasActiveFilters = !!(selectedProyecto || selectedTorre || selectedEstado || selectedEtapa || search || !ocultarDesistidos);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-build-main dark:text-white md:text-3xl">
          Gestión Legal
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
          Expedientes de compraventa, hitos de etapas, firmas de contratos y documentos legales.
        </p>
      </div>

      {/* ── Metric cards ── */}
      <MetricCards
        contracts={contracts}
        stages={contractsStages}
        isLoading={isLoading}
      />

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Filter bar + search (same row) ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400 dark:text-white/30 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Cliente, unidad o exp…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-3 py-2 text-xs text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>

        {/* Proyecto */}
        <select
          value={selectedProyecto}
          onChange={(e) => setSelectedProyecto(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-build-accent transition"
        >
          <option value="">Proyecto</option>
          {proyectosOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Torre — disabled until proyecto is chosen */}
        <select
          value={selectedTorre}
          onChange={(e) => setSelectedTorre(e.target.value)}
          disabled={!selectedProyecto}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-build-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">Torre</option>
          {torresOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={selectedEstado}
          onChange={(e) => setSelectedEstado(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-build-accent transition"
        >
          <option value="">Estado</option>
          <option value="Vigente">Vigente</option>
          <option value="Desvinculado">Desvinculado</option>
        </select>

        {/* Etapa */}
        <select
          value={selectedEtapa}
          onChange={(e) => setSelectedEtapa(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-build-accent transition"
        >
          <option value="">Etapa</option>
          <option value="Separación">Separación</option>
          <option value="Contrato">Contrato</option>
          <option value="Pagos">Pagos</option>
          <option value="Entrega">Entrega</option>
          <option value="Saneamiento">Saneamiento</option>
        </select>

        {/* Inactive / Canceled contracts quick filter switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-white/70 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={ocultarDesistidos}
            onChange={(e) => setOcultarDesistidos(e.target.checked)}
            className="w-4 h-4 accent-build-accent rounded border-slate-300"
          />
          <span className="font-semibold text-slate-700 dark:text-white/80">Ocultar desistidos</span>
        </label>

        {/* Clear filters — only shows when something is active */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedProyecto("");
              setSelectedTorre("");
              setSelectedEstado("");
              setSelectedEtapa("");
              setOcultarDesistidos(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Limpiar
          </button>
        )}

        {/* Result count — right-aligned */}
        {!isLoading && (
          <span className="ml-auto text-xs text-slate-400 dark:text-white/30 tabular-nums">
            {filtered.length} expediente{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              {["Expediente", "Proyecto / Unidad", "Titulares", "Etapa actual", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400 dark:text-white/40">
                  {hasActiveFilters
                    ? "Sin resultados para los filtros seleccionados."
                    : "No hay expedientes registrados."}
                </td>
              </tr>
            ) : (
              paginatedList.map((contract) => {
                const idCorto    = contract.uuidUsuarioActivo.slice(0, 8).toUpperCase();
                const firstAct   = contract.activos?.[0];
                const unitText   = (contract.activos ?? [])
                  .map((a) => {
                    const tipo = a.tipo === "DEPARTAMENTO" ? "Dpto" : a.tipo === "ESTACIONAMIENTO" ? "Cochera" : "Depósito";
                    return `${tipo} ${a.nro}`;
                  })
                  .join(" + ") || "Sin unidades";
                const proyText   = firstAct ? `${firstAct.torreNombre} · ${unitText}` : "Sin asignar";
                const titulares  = (contract.clientes ?? [])
                  .map((cl) => [cl.nombre, cl.apellidos].filter(Boolean).join(" "))
                  .join(" · ") || "Sin titulares";

                const stages     = contractsStages[contract.uuidUsuarioActivo];
                const etapaLabel = isStagesLoading && !stages ? "—" : getEtapaActualLabel(stages);
                const isVigente  = contract.vigente !== false;

                // Stalled detection
                const dias = daysSince((contract as any).ultimaActualizacion ?? null);
                const isStalled = dias !== null && dias > STALLED_DAYS;

                return (
                  <tr
                    key={contract.uuidUsuarioActivo}
                    onClick={() => router.push(`/legal/${contract.uuidUsuarioActivo}`)}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-semibold text-build-main dark:text-white group-hover:text-build-accent transition-colors">
                        EXP-{idCorto}
                      </span>
                    </td>

                    {/* Proyecto / Unidad */}
                    <td className="px-4 py-3">
                      <p className="truncate text-[13px] font-medium text-slate-700 dark:text-white/80">{proyText}</p>
                      {firstAct?.proyectoNombre && (
                        <p className="truncate text-[11px] text-slate-400 dark:text-white/35 mt-0.5">
                          {firstAct.proyectoNombre}
                        </p>
                      )}
                    </td>

                    {/* Titulares */}
                    <td className="px-4 py-3">
                      <p className="truncate text-[13px] text-slate-600 dark:text-white/70">{titulares}</p>
                    </td>

                    {/* Etapa — mini stepper */}
                    <td className="px-4 py-3">
                      {isStagesLoading && !stages ? (
                        <span className="inline-block h-3 w-16 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <MiniStepper stages={stages} current={etapaLabel} />
                          {isStalled && <StalledChip days={dias!} />}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isVigente
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[11px]">
                          {isVigente ? "check_circle" : "cancel"}
                        </span>
                        {isVigente ? "Vigente" : "Desvinculado"}
                      </span>
                    </td>

                    {/* Arrow hint */}
                    <td className="px-4 py-3 text-right">
                      <span className="material-symbols-outlined text-[16px] text-build-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Mostrando <span className="font-semibold text-slate-700 dark:text-white/80">{startIndex + 1}</span> a{" "}
                  <span className="font-semibold text-slate-700 dark:text-white/80">{Math.min(endIndex, filtered.length)}</span> de{" "}
                  <span className="font-semibold text-slate-700 dark:text-white/80">{filtered.length}</span> expedientes
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center rounded-l-md border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-2 text-slate-400 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Anterior</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      aria-current={currentPage === idx ? "page" : undefined}
                      className={`relative inline-flex items-center px-3 py-2 text-xs font-semibold focus:z-20 transition-colors ${
                        currentPage === idx
                          ? "z-10 bg-build-accent text-white"
                          : "text-slate-900 dark:text-white/70 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center rounded-r-md border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-2 text-slate-400 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Siguiente</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}