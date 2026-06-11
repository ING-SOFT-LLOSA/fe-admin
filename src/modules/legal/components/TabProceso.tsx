import type { ProcesoEtapa } from "./constants";
import { ESTADO_BADGE } from "./constants";

type Props = {
  etapas:         ProcesoEtapa[];
  loadingStepper: boolean;
  canEdit:        boolean;
  onUpdateHito:   (uuidHito: string, nuevoEstado: string) => Promise<void>;
};

const BACKEND_ESTADO: Record<ProcesoEtapa["estado"], string> = {
  completado: "COMPLETADO",
  en_proceso: "EN_PROGRESO",
  pendiente:  "PENDIENTE",
  observado:  "PENDIENTE",
};

export function TabProceso({ etapas, loadingStepper, canEdit, onUpdateHito }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-build-main dark:text-white mb-1">Proceso Legal</h3>
      <p className="text-xs text-slate-400 dark:text-white/40 mb-8">
        Estado de cada etapa jurídica de la operación.
      </p>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

        <ol className="space-y-0">
          {etapas.map((etapa) => {
            const badge = ESTADO_BADGE[etapa.estado] ?? ESTADO_BADGE.pendiente;

            return (
              <li key={etapa.id} className="relative flex gap-6 pb-8 last:pb-0">
                {/* Timeline node */}
                <div className="relative z-10 shrink-0">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${etapa.estado === "completado"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : etapa.estado === "en_proceso"
                      ? "bg-white dark:bg-[#111] border-build-accent text-build-accent"
                      : etapa.estado === "observado"
                      ? "bg-white dark:bg-[#111] border-amber-400 text-amber-400"
                      : "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20"
                    }
                  `}>
                    <span className="material-symbols-outlined text-[18px]">{etapa.icon}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <p className={`text-sm font-bold ${
                      etapa.estado === "pendiente"
                        ? "text-slate-400 dark:text-white/30"
                        : "text-build-main dark:text-white"
                    }`}>
                      {etapa.label}
                    </p>

                    {canEdit && etapa.uuidHito ? (
                      <select
                        value={BACKEND_ESTADO[etapa.estado]}
                        disabled={loadingStepper}
                        onChange={(e) => onUpdateHito(etapa.uuidHito!, e.target.value)}
                        className={`
                          text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 cursor-pointer
                          focus:ring-2 focus:ring-build-accent/50 focus:outline-none transition-all
                          ${badge.cls}
                          ${loadingStepper ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <option value="PENDIENTE"   className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">Pendiente</option>
                        <option value="EN_PROGRESO" className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">En proceso</option>
                        <option value="COMPLETADO"  className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">Completado</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 dark:text-white/40">
                    {etapa.fechaInicio && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {etapa.fechaInicio}
                      </span>
                    )}
                    {etapa.fechaFin && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">event_available</span>
                        {etapa.fechaFin}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {etapa.comentarios && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-100 dark:border-white/10">
                      {etapa.comentarios}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
