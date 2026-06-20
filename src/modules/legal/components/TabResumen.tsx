import type { Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { ProcesoEtapa } from "./constants";
import { ESTADO_BADGE } from "./constants";
import { ResumenKpi } from "./ui";

type Props = {
  readonly client:         Usuario | null;
  readonly expediente:     UsuarioActivoResponseDTO | null;
  readonly contrato:       UsuarioActivoResponseDTO | null;
  readonly etapas:         ProcesoEtapa[];
};

export function TabResumen({ client, expediente, contrato, etapas }: Readonly<Props>) {
  const etapaActual =
    etapas.find((e) => e.estado === "en_proceso") ??
    etapas.find((e) => e.estado === "pendiente")  ??
    etapas[0];

  const completadas = etapas.filter((e) => e.estado === "completado").length;
  const fullName    = [client?.nombre, client?.apellidos].filter(Boolean).join(" ") || "—";

  const getIconColorClass = (estado: string) => {
    if (estado === "completado") return "text-emerald-500";
    if (estado === "en_proceso") return "text-blue-500";
    return "text-slate-300 dark:text-white/20";
  };

  const getIconName = (estado: string) => {
    if (estado === "completado") return "check_circle";
    if (estado === "en_proceso") return "radio_button_checked";
    return "radio_button_unchecked";
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenKpi icon="person"       label="Cliente"        value={fullName} />
        <ResumenKpi icon="apartment"    label="Proyecto"       value={expediente?.activo?.proyectoNombre || "—"} />
        <ResumenKpi icon="meeting_room" label="Unidad"         value={expediente?.activo ? `${expediente.activo.tipo} ${expediente.activo.nro}` : "—"} />
        <ResumenKpi icon="attach_money" label="Financiamiento" value={contrato?.tipoFinanciamiento || "Pendiente"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stage progress */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-build-main dark:text-white mb-4">Progreso del proceso legal</h3>
          <div className="space-y-3">
            {etapas.map((etapa) => {
              const badge = ESTADO_BADGE[etapa.estado] ?? ESTADO_BADGE.pendiente;
              return (
                <div key={etapa.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${getIconColorClass(etapa.estado)}`}>
                      {getIconName(etapa.estado)}
                    </span>
                    <span className={`text-sm font-semibold ${
                      etapa.estado === "pendiente" ? "text-slate-400 dark:text-white/30" : "text-build-main dark:text-white"
                    }`}>
                      {etapa.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className="h-1.5 rounded-full bg-arch-gold transition-all"
                style={{ width: `${etapas.length ? (completadas / etapas.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1.5">
              {completadas} de {etapas.length} etapas completadas
            </p>
          </div>
        </div>

        {/* Current stage + last update */}
        {etapaActual && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">Etapa actual</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-arch-gold/10 dark:bg-arch-gold/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-arch-gold text-[20px]">{etapaActual.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-build-main dark:text-white">{etapaActual.label}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{etapaActual.comentarios || "En proceso"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">Última actualización</p>
              <p className="text-sm font-semibold text-build-main dark:text-white">
                {etapaActual.fechaFin ?? etapaActual.fechaInicio ?? "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
