import type { Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { ProcesoEtapa } from "./constants";
import { ESTADO_BADGE } from "./constants";
import { ResumenKpi } from "./ui";

type Props = {
  client:         Usuario | null;
  expediente:     UsuarioActivoResponseDTO | null;
  contrato:       UsuarioActivoResponseDTO | null;
  etapas:         ProcesoEtapa[];
  loadingStepper: boolean;
};

export function TabResumen({ client, expediente, contrato, etapas, loadingStepper }: Props) {
  const activo = expediente?.activos?.[0];
  const etapaActual =
    etapas.find((e) => e.estado === "en_proceso") ??
    etapas.find((e) => e.estado === "pendiente")  ??
    etapas[0];

  const completadas   = etapas.filter((e) => e.estado === "completado").length;
  const fullName      = [client?.nombre, client?.apellidos].filter(Boolean).join(" ") || "—";
  const currentHito   = etapaActual?.hitos?.find((h) => h.estado === "EN_PROGRESO") ?? etapaActual?.hitos?.[0];
  const ultimaFecha   = currentHito?.fechaCompletado ?? currentHito?.createdAt ?? null;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenKpi icon="person"       label="Cliente"        value={fullName} />
        <ResumenKpi icon="apartment"    label="Proyecto"       value={activo?.proyectoNombre || "—"} />
        <ResumenKpi icon="layers"       label="Torre / Piso"   value={activo ? `${activo.torreNombre} — Piso ${activo.nroPiso}` : "—"} />
        <ResumenKpi icon="meeting_room" label="Unidad"         value={activo ? `${activo.tipo} ${activo.nro}` : "—"} />
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
                    <span className={`material-symbols-outlined text-[16px] ${
                      etapa.estado === "completado" ? "text-emerald-500" :
                      etapa.estado === "en_proceso" ? "text-blue-500"    : "text-slate-300 dark:text-white/20"
                    }`}>
                      {etapa.estado === "completado"
                        ? "check_circle"
                        : etapa.estado === "en_proceso"
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
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
                className="h-1.5 rounded-full bg-build-accent transition-all"
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
                <div className="w-10 h-10 rounded-xl bg-build-accent/10 dark:bg-build-accent/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-build-accent text-[20px]">{etapaActual.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-build-main dark:text-white">{etapaActual.label}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{currentHito?.descripcion || "En proceso"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">Última actualización</p>
              <p className="text-sm font-semibold text-build-main dark:text-white">
                {ultimaFecha ? new Date(ultimaFecha).toLocaleDateString("es-PE") : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
