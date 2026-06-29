"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import {
  fetchProyectos,
  fetchTorresPorProyecto,
  type Proyecto,
  type ActivoResponseDTO,
} from "@/lib/api/proyectos";
import {
  fetchTodosLosContratos,
  fetchEtapasExpediente,
  fetchCommercialStepper,
  asignarAsesorAContrato,
  desasignarAsesorDelContrato,
  type UsuarioActivoResponseDTO,
  type EtapaExpedienteResponseDTO,
  type ClienteSimpleDTO,
} from "@/lib/api/expedientes";
import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";

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
  SANEAMIENTO: "Saneamiento",
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
function getEtapaActualLabel(stages: readonly EtapaExpedienteResponseDTO[] | undefined): string {
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
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 86_400_000);
}

function getUnitText(activos: readonly ActivoResponseDTO[] | undefined): string {
  if (!activos) return "Sin unidades";
  return activos
    .map((a) => {
      let tipo = "Depósito";
      if (a.tipo === "DEPARTAMENTO") {
        tipo = "Dpto";
      } else if (a.tipo === "ESTACIONAMIENTO") {
        tipo = "Cochera";
      }
      return `${tipo} ${a.nro}`;
    })
    .join(" + ") || "Sin unidades";
}

function getTitularesText(clientes: readonly ClienteSimpleDTO[] | undefined): string {
  if (!clientes) return "Sin titulares";
  return clientes
    .map((cl) => [cl.nombre, cl.apellidos].filter(Boolean).join(" "))
    .join(" · ") || "Sin titulares";
}

async function fetchAndCorrectStages(uuidUsuarioActivo: string): Promise<EtapaExpedienteResponseDTO[]> {
  const [stages, stepper] = await Promise.all([
    fetchEtapasExpediente(uuidUsuarioActivo),
    fetchCommercialStepper(uuidUsuarioActivo),
  ]);

  return stages.map((stage) => {
    const stepperStage = stepper.etapas?.find((e) => e.etapa === stage.etapaProceso);
    if (!stepperStage) return stage;

    const total      = stepperStage.hitos?.length ?? 0;
    const completed  = stepperStage.hitos?.filter((h) => h.estado === "COMPLETADO").length ?? 0;
    const inProgress = stepperStage.hitos?.filter((h) => h.estado === "EN_PROGRESO").length ?? 0;

    let estado = "PENDIENTE";
    if (completed === total && total > 0) {
      estado = "COMPLETADO";
    } else if (completed > 0 || inProgress > 0) {
      estado = "EN_PROGRESO";
    }

    return { ...stage, estado, totalHitos: total, hitosCompletados: completed };
  });
}

function matchesProyectoTorre(c: Readonly<UsuarioActivoResponseDTO>, proyecto: string, torre: string): boolean {
  if (proyecto && !(c.activos ?? []).some((a) => a.proyectoNombre === proyecto)) {
    return false;
  }
  if (torre && !(c.activos ?? []).some((a) => a.torreNombre === torre)) {
    return false;
  }
  return true;
}

function matchesEtapa(stages: readonly EtapaExpedienteResponseDTO[] | undefined, selectedEtapa: string): boolean {
  if (!selectedEtapa) return true;
  const label = getEtapaActualLabel(stages);
  return label === selectedEtapa || (label.includes("Saneamiento") && selectedEtapa === "Saneamiento");
}

function matchesSearch(c: Readonly<UsuarioActivoResponseDTO>, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  
  const byId = c.uuidUsuarioActivo.toLowerCase().includes(q) || 
               `exp-${c.uuidUsuarioActivo.slice(0, 8)}`.toLowerCase().includes(q);
               
  const byCliente = c.clientes?.some((cl) =>
    [cl.nombre, cl.apellidos].filter(Boolean).join(" ").toLowerCase().includes(q) ||
    cl.email.toLowerCase().includes(q) ||
    (cl.documentoIdentidad ?? "").toLowerCase().includes(q)
  ) ?? false;
  
  const byActivo = c.activos?.some((a) =>
    `${a.torreNombre} ${a.tipo} ${a.nro}`.toLowerCase().includes(q) ||
    (a.proyectoNombre ?? "").toLowerCase().includes(q)
  ) ?? false;
  
  return byId || byCliente || byActivo;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/**
 * Five-dot mini-stepper for the Etapa column.
 */
function MiniStepper({
  stages,
  current,
}: Readonly<{
  stages: readonly EtapaExpedienteResponseDTO[] | undefined;
  current: string;
}>) {
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
function StalledChip({ days }: Readonly<{ days: number }>) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
      <span className="material-symbols-outlined text-[11px]">warning</span>
      {days}d sin avance
    </span>
  );
}

// ─────────────────────────────────────────────
// Skeleton row for loading state
// ─────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
      {[40, 120, 100, 80, 60].map((w) => (
        <td key={w} className="px-5 py-3">
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
// Standalone Contract Row Component
// ─────────────────────────────────────────────

function ContractRow({
  contract,
  stages,
  isStagesLoading,
  onRemoveAsesor,
  onAssignAsesor,
}: Readonly<{
  contract: UsuarioActivoResponseDTO;
  stages: readonly EtapaExpedienteResponseDTO[] | undefined;
  isStagesLoading: boolean;
  onRemoveAsesor: (contract: UsuarioActivoResponseDTO) => void;
  onAssignAsesor: (uuidUsuarioActivo: string) => void;
}>) {
  const router = useRouter();

  const idCorto = contract.uuidUsuarioActivo.slice(0, 8).toUpperCase();
  const firstAct = contract.activos?.[0];
  const unitText = getUnitText(contract.activos);
  const proyText = firstAct ? `${firstAct.torreNombre} · ${unitText}` : "Sin asignar";
  const titulares = getTitularesText(contract.clientes);

  const etapaLabel = isStagesLoading && !stages ? "—" : getEtapaActualLabel(stages);
  const isVigente = contract.vigente !== false;

  const rawUltimaActualizacion = (contract as { ultimaActualizacion?: string }).ultimaActualizacion;
  const dias = daysSince(rawUltimaActualizacion ?? null);
  const isStalled = dias !== null && dias > STALLED_DAYS;

  return (
    <tr
      tabIndex={0}
      onClick={() => router.push(`/legal/${contract.uuidUsuarioActivo}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/legal/${contract.uuidUsuarioActivo}`);
        }
      }}
      className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
    >
      {/* ID */}
      <td className="px-4 py-3">
        <span className="text-[13px] font-semibold text-build-main dark:text-white group-hover:text-arch-gold transition-colors">
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
        {stages || !isStagesLoading ? (
          <div className="flex flex-col gap-1.5">
            <MiniStepper stages={stages} current={etapaLabel} />
            {isStalled && <StalledChip days={dias} />}
          </div>
        ) : (
          <span className="inline-block h-3 w-16 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
        )}
      </td>

      {/* Asesor */}
      <td className="px-4 py-3">
        {contract.asesor ? (
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-arch-gold">badge</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] text-slate-700 dark:text-white/80">
                {[contract.asesor.nombre, contract.asesor.apellidos].filter(Boolean).join(" ")}
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveAsesor(contract); }}
                className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
              >
                Desvincular
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAssignAsesor(contract.uuidUsuarioActivo); }}
            className="flex items-center gap-1 text-[12px] text-arch-gold hover:text-build-main transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">person_add</span>
            <span>Asignar</span>
          </button>
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
        <span className="material-symbols-outlined text-[16px] text-arch-gold opacity-0 group-hover:opacity-100 transition-opacity">
          arrow_forward
        </span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function LegalOverview() {
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

  // Asesor assignment state
  const [asesores, setAsesores]           = useState<Usuario[]>([]);
  const [assignTarget, setAssignTarget]   = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const [proyectosList, setProyectosList]   = useState<Proyecto[]>([]);
  const [proyectosOptions, setProyectosOptions] = useState<string[]>([]);
  const [torresOptions, setTorresOptions]   = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // y en el fetch:
  useEffect(() => {
    let mounted = true;
    fetchProyectos().then((list) => {
      if (mounted) {
        setProyectosList(list);
        setProyectosOptions(list.map((p) => p.nombre).sort((a, b) => a.localeCompare(b)));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Reset page to 0 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
              const corrected = await fetchAndCorrectStages(c.uuidUsuarioActivo);
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
    load();
    return () => { mounted = false; };
  }, []);

  // Load asesores
  useEffect(() => {
    let mounted = true;
    fetchUsuarios()
      .then((users) => {
        if (mounted) {
          setAsesores(users.filter((u) => u.rol === "ASESOR"));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      contracts.filter((c) => {
        if (!matchesProyectoTorre(c, selectedProyecto, selectedTorre)) {
          return false;
        }
        if (selectedEstado) {
          const label = c.vigente === false ? "Desvinculado" : "Vigente";
          if (label !== selectedEstado) return false;
        }
        if (ocultarDesistidos && c.vigente === false) {
          return false;
        }
        const stgs = contractsStages[c.uuidUsuarioActivo];
        if (!matchesEtapa(stgs, selectedEtapa)) {
          return false;
        }
        if (!matchesSearch(c, search)) {
          return false;
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

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  // ── Asesor handlers ─────────────────────────────────────────────────────────

  const handleRemoveAsesor = async (contract: UsuarioActivoResponseDTO) => {
    if (!contract.asesor) return;
    try {
      await desasignarAsesorDelContrato(contract.uuidUsuarioActivo, contract.asesor.id);
      setContracts((prev) =>
        prev.map((c) =>
          c.uuidUsuarioActivo === contract.uuidUsuarioActivo ? { ...c, asesor: null } : c
        )
      );
    } catch {
      // Ignored
    }
  };

  async function handleAssignAsesor(idAsesor: number) {
    if (!assignTarget) return;
    setAssignLoading(true);
    try {
      const updated = await asignarAsesorAContrato(assignTarget, idAsesor);
      setContracts((prev) =>
        prev.map((c) =>
          c.uuidUsuarioActivo === assignTarget ? { ...c, asesor: updated.asesor } : c
        )
      );
      setAssignTarget(null);
    } finally {
      setAssignLoading(false);
    }
  }

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
            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-3 py-2 text-xs text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold transition"
          />
        </div>

        {/* Proyecto */}
        <select
          value={selectedProyecto}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedProyecto(val);
            setSelectedTorre("");
            setTorresOptions([]);
            if (val) {
              const proyecto = proyectosList.find((p) => p.nombre === val);
              if (proyecto) {
                fetchTorresPorProyecto(proyecto.id).then((list) => {
                  const sortedTorres = list.map((t) => t.nombre).sort((a, b) => a.localeCompare(b));
                  setTorresOptions(sortedTorres);
                });
              }
            }
          }}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-arch-gold transition"
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
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-arch-gold transition disabled:opacity-40 disabled:cursor-not-allowed"
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
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-arch-gold transition"
        >
          <option value="">Estado</option>
          <option value="Vigente">Vigente</option>
          <option value="Desvinculado">Desvinculado</option>
        </select>

        {/* Etapa */}
        <select
          value={selectedEtapa}
          onChange={(e) => setSelectedEtapa(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white focus:outline-none focus:border-arch-gold transition"
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
            className="w-4 h-4 accent-arch-gold rounded border-slate-300"
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
              setTorresOptions([]);
              setSelectedEstado("");
              setSelectedEtapa("");
              setOcultarDesistidos(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            {" "}Limpiar
          </button>
        )}

        {/* Result count — right-aligned */}
        {!isLoading && (
          <span className="ml-auto text-xs text-slate-400 dark:text-white/30 tabular-nums">
            {filtered.length} expediente{filtered.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[20%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              {["Expediente", "Proyecto / Unidad", "Titulares", "Etapa actual", "Asesor", "Estado", ""].map((h) => (
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
            {(() => {
              if (isLoading) {
                return ["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => <SkeletonRow key={key} />);
              }
              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-400 dark:text-white/40">
                      {hasActiveFilters
                        ? "Sin resultados para los filtros seleccionados."
                        : "No hay expedientes registrados."}
                    </td>
                  </tr>
                );
              }
              return paginatedList.map((contract) => (
                <ContractRow
                  key={contract.uuidUsuarioActivo}
                  contract={contract}
                  stages={contractsStages[contract.uuidUsuarioActivo]}
                  isStagesLoading={isStagesLoading}
                  onRemoveAsesor={handleRemoveAsesor}
                  onAssignAsesor={setAssignTarget}
                />
              ));
            })()}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={filtered.length}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          itemNamePlural="expedientes"
        />
      </div>

      {/* ── Assign Asesor Modal ── */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/40 cursor-default border-0 outline-none w-full h-full"
            onClick={() => setAssignTarget(null)}
            aria-label="Cerrar modal"
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl z-10">
            <h3 className="text-base font-semibold text-build-main dark:text-white mb-4">
              Asignar asesor
            </h3>

            {asesores.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/50">
                No hay asesores disponibles.
              </p>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {asesores.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={assignLoading}
                    onClick={() => handleAssignAsesor(a.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-arch-gold">badge</span>
                    {[a.nombre, a.apellidos].filter(Boolean).join(" ")}
                    <span className="ml-auto text-[11px] text-slate-400 dark:text-white/30">{a.email}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignTarget(null)}
                className="rounded-lg border border-slate-200 dark:border-white/10 px-4 py-1.5 text-xs text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}