import type { ProcesoEtapa, HitoItem } from "./constants";
import { ESTADO_BADGE } from "./constants";

type Props = {
  etapas:         ProcesoEtapa[];
  loadingStepper: boolean;
  canEdit:        boolean;
  onUpdateHito:   (uuidHito: string, nuevoEstado: string) => Promise<void>;
};

const BACKEND_ESTADO: Record<string, string> = {
  completado: "COMPLETADO",
  en_proceso: "EN_PROGRESO",
  pendiente:  "PENDIENTE",
  observado:  "PENDIENTE",
};

const ESTADO_CLS: Record<string, string> = {
  PENDIENTE:   "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50",
  EN_PROGRESO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETADO:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_PROGRESO: "En proceso",
  COMPLETADO:  "Completado",
};

function HitoRow({ hito, canEdit, loadingStepper, onUpdateHito }: {
  hito: HitoItem;
  canEdit: boolean;
  loadingStepper: boolean;
  onUpdateHito: (uuidHito: string, nuevoEstado: string) => Promise<void>;
}) {
  const cls = ESTADO_CLS[hito.estado] ?? ESTADO_CLS.PENDIENTE;
  const lbl = ESTADO_LABEL[hito.estado] ?? hito.estado;

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
      <div className="w-2 h-2 rounded-full shrink-0 bg-slate-300 dark:bg-white/20" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-build-main dark:text-white">{hito.nombre}</p>
        {hito.descripcion && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5 line-clamp-1">{hito.descripcion}</p>
        )}
      </div>
      {canEdit ? (
        <select
          value={hito.estado}
          disabled={loadingStepper}
          onChange={(e) => onUpdateHito(hito.uuidHito, e.target.value)}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-build-accent/50 focus:outline-none transition-all ${cls} ${loadingStepper ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="PENDIENTE"   className="bg-white dark:bg-[#111]">Pendiente</option>
          <option value="EN_PROGRESO" className="bg-white dark:bg-[#111]">En proceso</option>
          <option value="COMPLETADO"  className="bg-white dark:bg-[#111]">Completado</option>
        </select>
      ) : (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls}`}>{lbl}</span>
      )}
      {hito.fechaCompletado && (
        <span className="text-[10px] text-slate-400 dark:text-white/40 whitespace-nowrap">
          {new Date(hito.fechaCompletado).toLocaleDateString("es-PE")}
        </span>
      )}
    </div>
  );
}

export function TabProceso({ etapas, loadingStepper, canEdit, onUpdateHito }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-build-main dark:text-white mb-1">Proceso Legal</h3>
      <p className="text-xs text-slate-400 dark:text-white/40 mb-8">
        Estado de cada etapa jurídica de la operación y sus hitos asociados.
      </p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

        <ol className="space-y-0">
          {etapas.map((etapa) => {
            const badge = ESTADO_BADGE[etapa.estado] ?? ESTADO_BADGE.pendiente;

            return (
              <li key={etapa.id} className="relative flex gap-6 pb-8 last:pb-0">
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

                <div className="flex-1 pt-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-bold ${
                        etapa.estado === "pendiente"
                          ? "text-slate-400 dark:text-white/30"
                          : "text-build-main dark:text-white"
                      }`}>
                        {etapa.label}
                      </p>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {etapa.porcentajeAvance > 0 && (
                        <span className="text-[10px] text-slate-400 dark:text-white/40">
                          {etapa.porcentajeAvance}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hitos list */}
                  {etapa.hitos.length > 0 ? (
                    <div className="space-y-0.5 ml-1 border-l-2 border-slate-100 dark:border-white/5 pl-2">
                      {etapa.hitos.map((hito) => (
                        <HitoRow
                          key={hito.uuidHito}
                          hito={hito}
                          canEdit={canEdit}
                          loadingStepper={loadingStepper}
                          onUpdateHito={onUpdateHito}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-white/40 italic ml-1">
                      Sin hitos registrados
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
