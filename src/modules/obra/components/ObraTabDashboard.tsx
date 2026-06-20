"use client";

import type { EtapaResponseDTO } from "@/lib/api/obra";

type ObraTabDashboardProps = {
  readonly etapas: EtapaResponseDTO[];
};

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  PENDIENTE:   { label: "Pendiente",   color: "text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-white/60" },
  EN_PROGRESO: { label: "En progreso", color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETADA:  { label: "Completada",  color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  RETRASADA:   { label: "Retrasada",   color: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ObraTabDashboard({ etapas }: Readonly<ObraTabDashboardProps>) {
  return (
    <div className="space-y-6">
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