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
      <p className="text-xs text-slate-500 dark:text-white/50 mb-6">
        Secuencia de hitos reales configurados para este proyecto.
      </p>

      {sortedEtapas.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-400">
          No hay hitos maestros configurados. Créalos desde la vista "Por proyecto" en la pestaña de Hitos.
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
          <div className="relative flex justify-between min-w-max gap-8 px-4 py-2">
            {sortedEtapas.map((etapa, index) => {
              const status = resolveStatus(etapa.estado);
              const icon = getIconForHito(etapa.nombre);
              const isLast = index === sortedEtapas.length - 1;

              return (
                <div key={etapa.id} className="relative z-10 flex flex-col items-center text-center w-36 shrink-0">
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-5 h-[2px] z-0 transition-colors ${
                        status === "completado"
                          ? "bg-build-accent"
                          : "bg-slate-200 dark:bg-white/10"
                      }`}
                    />
                  )}

                  {/* Node */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10
                      ${status === "completado"
                        ? "bg-build-accent border-build-accent text-white"
                        : status === "en_progreso"
                        ? "bg-white dark:bg-[#111] border-build-accent text-build-accent animate-pulse"
                        : "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30"
                      }
                    `}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  </div>

                  {/* Content */}
                  <div className="mt-3 flex flex-col items-center w-full px-1">
                    <p
                      className={`text-xs font-bold truncate w-full ${
                        status === "completado"
                          ? "text-build-main dark:text-white"
                          : status === "en_progreso"
                          ? "text-build-accent"
                          : "text-slate-400 dark:text-white/40"
                      }`}
                      title={etapa.nombre}
                    >
                      {etapa.nombre}
                    </p>
                    {etapa.descripcion && (
                      <p className="text-[10px] text-slate-400 dark:text-white/30 truncate w-full mt-0.5" title={etapa.descripcion}>
                        {etapa.descripcion}
                      </p>
                    )}
                    <div className="mt-2 scale-90">
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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