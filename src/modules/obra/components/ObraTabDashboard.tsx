"use client";

import type { EtapaResponseDTO } from "@/lib/api/obra";
import type { Proyecto } from "@/modules/proyectos/types";

type ObraTabDashboardProps = {
  project: Proyecto | null;
  avance: number;
  etapas: EtapaResponseDTO[];
};

// Avance proyectado es un mock — reemplazar con dato real cuando el backend lo exponga
const AVANCE_PROYECTADO = 72;

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  PENDIENTE:   { label: "Pendiente",   color: "text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-white/60" },
  EN_PROGRESO: { label: "En progreso", color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETADA:  { label: "Completada",  color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  RETRASADA:   { label: "Retrasada",   color: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ObraTabDashboard({ project, avance, etapas }: ObraTabDashboardProps) {
  const desviacion = avance - AVANCE_PROYECTADO;
  const completadas = etapas.filter((e) => e.estado === "COMPLETADA").length;
  const enProgreso  = etapas.filter((e) => e.estado === "EN_PROGRESO").length;
  const retrasadas  = etapas.filter((e) => e.estado === "RETRASADA").length;

  const estadoGeneral =
    retrasadas > 0       ? "RETRASADA"   :
    enProgreso > 0       ? "EN_PROGRESO" :
    completadas === etapas.length && etapas.length > 0 ? "COMPLETADA" :
    "PENDIENTE";

  const estado = ESTADO_LABELS[estadoGeneral] ?? ESTADO_LABELS.PENDIENTE;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon="construction"
          label="Avance real"
          value={`${avance}%`}
          sub="Calculado desde hitos"
          accent="text-build-accent"
          bar={{ value: avance, color: "bg-build-accent" }}
        />
        <KpiCard
          icon="event_note"
          label="Avance proyectado"
          value={`${AVANCE_PROYECTADO}%`}
          sub="Según cronograma original"
          accent="text-blue-500"
          bar={{ value: AVANCE_PROYECTADO, color: "bg-blue-400" }}
        />
        <KpiCard
          icon={desviacion >= 0 ? "trending_up" : "trending_down"}
          label="Desviación"
          value={`${desviacion > 0 ? "+" : ""}${desviacion}%`}
          sub={desviacion >= 0 ? "Adelantado respecto al plan" : "Retraso respecto al plan"}
          accent={desviacion >= 0 ? "text-emerald-500" : "text-red-500"}
        />
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400 dark:text-white/40">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span className="text-xs font-bold uppercase tracking-wider">Estado general</span>
          </div>
          <span className={`self-start text-xs font-bold px-3 py-1 rounded-full ${estado.color}`}>
            {estado.label}
          </span>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-auto">
            {etapas.length} etapa{etapas.length !== 1 ? "s" : ""} registrada{etapas.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Progress breakdown */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-base font-bold text-build-main dark:text-white mb-1">Comparativa de avance</h3>
        <p className="text-xs text-slate-500 dark:text-white/50 mb-6">
          Avance real vs. proyectado para {project?.nombre ?? "este proyecto"}.
        </p>

        <div className="space-y-4">
          <ProgressRow label="Avance real" value={avance} color="bg-build-accent" />
          <ProgressRow label="Avance proyectado" value={AVANCE_PROYECTADO} color="bg-blue-400" />
        </div>
      </div>

      {/* Etapas summary */}
      {etapas.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h3 className="text-base font-bold text-build-main dark:text-white mb-4">Resumen de etapas</h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {etapas.map((etapa) => {
              const s = ESTADO_LABELS[etapa.estado ?? "PENDIENTE"] ?? ESTADO_LABELS.PENDIENTE;
              return (
                <div
                  key={etapa.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-white/10 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-build-main dark:text-white truncate">{etapa.nombre}</p>
                    <p className="text-xs text-slate-400 dark:text-white/40">Orden {etapa.orden}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  bar,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent: string;
  bar?: { value: number; color: string };
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2 text-slate-400 dark:text-white/40">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {bar && (
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className={`h-1.5 rounded-full ${bar.color} transition-all`}
            style={{ width: `${Math.min(bar.value, 100)}%` }}
          />
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-white/40 mt-auto">{sub}</p>
    </div>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600 dark:text-white/70">{label}</span>
        <span className="font-bold text-build-main dark:text-white">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={`h-2.5 rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}