"use client";

import type { EtapaResponseDTO } from "@/lib/api/obra";

type ObraTabTimelineProps = {
  projectId: string;
  etapas: EtapaResponseDTO[];
};

type HitoStatus = "completado" | "en_progreso" | "pendiente";

function getIconForHito(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("ante")) return "architecture";
  if (n.includes("licencia")) return "gavel";
  if (n.includes("demoli")) return "home_work";
  if (n.includes("inicio")) return "construction";
  if (n.includes("excava")) return "foundation";
  if (n.includes("ciment")) return "domain";
  if (n.includes("casco") || n.includes("estruct")) return "apartment";
  if (n.includes("humed") || n.includes("húmed")) return "water_drop";
  if (n.includes("seco")) return "window";
  if (n.includes("terminado") || n.includes("fin")) return "celebration";
  return "flag";
}

function resolveStatus(estadoStr: string | null): HitoStatus {
  if (estadoStr === "COMPLETADA" || estadoStr === "COMPLETADO") return "completado";
  if (estadoStr === "EN_PROGRESO") return "en_progreso";
  return "pendiente";
}

export default function ObraTabTimeline({ etapas }: ObraTabTimelineProps) {
  // Ordenar por orden
  const sortedEtapas = [...etapas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-base font-bold text-build-main dark:text-white mb-1">Timeline Constructivo</h3>
      <p className="text-xs text-slate-500 dark:text-white/50 mb-8">
        Secuencia de hitos reales configurados para este proyecto.
      </p>

      {sortedEtapas.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-400">
          No hay hitos maestros configurados. Créalos desde la vista "Por proyecto" en la pestaña de Hitos.
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

          <ol className="space-y-0">
            {sortedEtapas.map((etapa) => {
              const status = resolveStatus(etapa.estado);
              const icon = getIconForHito(etapa.nombre);

              return (
                <li key={etapa.id} className="relative flex gap-6 pb-8 last:pb-0">
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${status === "completado"
                          ? "bg-build-accent border-build-accent text-white"
                          : status === "en_progreso"
                          ? "bg-white dark:bg-[#111] border-build-accent text-build-accent"
                          : "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30"
                        }
                      `}
                    >
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            status === "completado"
                              ? "text-build-main dark:text-white"
                              : status === "en_progreso"
                              ? "text-build-accent"
                              : "text-slate-400 dark:text-white/40"
                          }`}
                        >
                          {etapa.nombre}
                        </p>
                        {etapa.descripcion && (
                          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                            {etapa.descripcion}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: HitoStatus }) {
  if (status === "completado") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        <span className="material-symbols-outlined text-[11px]">check_circle</span>
        Completado
      </span>
    );
  }
  if (status === "en_progreso") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
        <span className="material-symbols-outlined text-[11px]">pending</span>
        En progreso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
      <span className="material-symbols-outlined text-[11px]">schedule</span>
      Pendiente
    </span>
  );
}