import type { ProcesoEtapa, StageId } from "./constants";
import { ESTADO_BADGE, ESTADO_A_BACKEND, OPCIONES_ESTADO, STAGE_ORDER, STAGE_META } from "./constants";

type Props = {
  etapas:         ProcesoEtapa[];
  loadingStepper: boolean;
  canEdit:        boolean;
  onUpdateHito:   (uuidHito: string, nuevoEstado: string) => Promise<void>;
};

// Agrupa la lista plana de hitos por etapaProceso manteniendo el orden canónico
function groupByStage(etapas: ProcesoEtapa[]): { stageId: StageId; hitos: ProcesoEtapa[] }[] {
  const map = new Map<StageId, ProcesoEtapa[]>();
  for (const e of etapas) {
    if (!map.has(e.etapaProceso)) map.set(e.etapaProceso, []);
    map.get(e.etapaProceso)!.push(e);
  }
  return STAGE_ORDER
    .filter((id) => map.has(id))
    .map((id) => ({ stageId: id, hitos: map.get(id)! }));
}

// Calcula el estado global de la sección para el encabezado
function stageEstado(hitos: ProcesoEtapa[]): "completado" | "en_proceso" | "pendiente" {
  if (hitos.every((h) => h.estado === "completado")) return "completado";
  if (hitos.some((h) => h.estado === "completado" || h.estado === "en_proceso")) return "en_proceso";
  return "pendiente";
}

export function TabProceso({ etapas, loadingStepper, canEdit, onUpdateHito }: Props) {
  const grupos = groupByStage(etapas);

  const getGlobalBadgeClass = (estado: string) => {
    if (estado === "completado") return "bg-emerald-500 border-emerald-500 text-white";
    if (estado === "en_proceso") return "bg-white dark:bg-[#111] border-arch-gold text-arch-gold";
    return "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20";
  };

  const getHitoBadgeClass = (estado: string) => {
    if (estado === "completado") return "bg-emerald-500 border-emerald-500 text-white";
    if (estado === "en_proceso") return "bg-white dark:bg-[#111] border-arch-gold text-arch-gold";
    if (estado === "observado") return "bg-white dark:bg-[#111] border-amber-400 text-amber-400";
    return "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20";
  };

  return (
    <div className="space-y-4">
      {grupos.map(({ stageId, hitos }) => {
        const meta   = STAGE_META[stageId];
        const global = stageEstado(hitos);

        return (
          <div
            key={stageId}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden"
          >
            {/* ── Encabezado de sección ── */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0
                  ${getGlobalBadgeClass(global)}
                `}>
                  <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-build-main dark:text-white leading-none">
                    {meta.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5">
                    {hitos.filter((h) => h.estado === "completado").length} / {hitos.length} hitos completados
                  </p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <div className="w-32 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (hitos.filter((h) => h.estado === "completado").length / hitos.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Lista de hitos ── */}
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5" />
                <ol className="space-y-0">
                  {hitos.map((etapa, idx) => {
                    const badge = ESTADO_BADGE[etapa.estado] ?? ESTADO_BADGE.pendiente;
                    return (
                      <li key={etapa.id} className="relative flex gap-5 pb-6 last:pb-0">
                        {/* Nodo timeline */}
                        <div className="relative z-10 shrink-0">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                            ${getHitoBadgeClass(etapa.estado)}
                          `}>
                            <span className="material-symbols-outlined text-[15px]">{etapa.icon}</span>
                          </div>
                          {/* Número de orden */}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-100 dark:bg-white/10 text-[9px] font-bold text-slate-500 dark:text-white/40 flex items-center justify-center">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-start justify-between gap-4 flex-wrap mb-1.5">
                            <p className={`text-sm font-bold leading-snug ${
                              etapa.estado === "pendiente"
                                ? "text-slate-400 dark:text-white/30"
                                : "text-build-main dark:text-white"
                            }`}>
                              {etapa.label}
                            </p>

                            {canEdit && etapa.uuidHito ? (
                              <select
                                value={ESTADO_A_BACKEND[etapa.estado]}
                                disabled={loadingStepper}
                                onChange={(e) => onUpdateHito(etapa.uuidHito!, e.target.value)}
                                className={`
                                  text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 cursor-pointer
                                  focus:ring-2 focus:ring-arch-gold/50 focus:outline-none transition-all
                                  ${badge.cls}
                                  ${loadingStepper ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                              >
                                {OPCIONES_ESTADO.map((op) => (
                                  <option
                                    key={op.value}
                                    value={op.value}
                                    className="bg-white dark:bg-[#111] text-slate-700 dark:text-white"
                                  >
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>

                          {/* Fechas */}
                          <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-slate-400 dark:text-white/40">
                            {etapa.fechaInicio && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                {etapa.fechaInicio}
                              </span>
                            )}
                            {etapa.fechaFin && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">event_available</span>
                                {etapa.fechaFin}
                              </span>
                            )}
                          </div>

                          {/* Descripción */}
                          {etapa.comentarios && (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-100 dark:border-white/10">
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
          </div>
        );
      })}
    </div>
  );
}