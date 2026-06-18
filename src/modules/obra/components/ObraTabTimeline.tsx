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
  const sortedEtapas = [...etapas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm h-fit">
      <h3 className="text-sm font-bold text-build-main dark:text-white mb-1">Timeline Constructivo</h3>
      <p className="text-[11px] text-slate-500 dark:text-white/50 mb-5">
        Secuencia de hitos configurados para este proyecto.
      </p>

      {sortedEtapas.length === 0 ? (
        <div className="p-3 text-center text-xs text-slate-400">
          No hay hitos maestros configurados. Créalos desde "Por proyecto".
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          {sortedEtapas.map((etapa, index) => {
            const status = resolveStatus(etapa.estado);
            const icon = getIconForHito(etapa.nombre);
            const isLast = index === sortedEtapas.length - 1;

            return (
              <div key={etapa.id} className="relative flex items-stretch gap-4 pb-1">
                {/* Left column: node + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 shrink-0
                      ${status === "completado"
                        ? "bg-arch-gold border-arch-gold text-white"
                        : status === "en_progreso"
                        ? "bg-white dark:bg-[#111] border-arch-gold text-arch-gold animate-pulse"
                        : "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30"
                      }
                    `}
                  >
                    <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  </div>
                  {!isLast && (
                    <div className="w-[2px] flex-1 min-h-[20px] my-1 bg-slate-200 dark:bg-white/10" />
                  )}
                </div>

                {/* Right column: content */}
                <div className="flex flex-col justify-center pb-4 min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      status === "completado"
                        ? "text-build-main dark:text-white"
                        : status === "en_progreso"
                        ? "text-arch-gold"
                        : "text-slate-400 dark:text-white/40"
                    }`}
                    title={etapa.nombre}
                  >
                    {etapa.nombre}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>
            );
          })}
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