import React from "react";
import type { CronogramaResumenResponse } from "@/modules/finanzas/types";
import { estadoGlobalStyles } from "@/modules/finanzas/utils/paymentHelpers";

interface ResumenSaldosCardProps {
    readonly resumen: CronogramaResumenResponse | null;
}

export default function ResumenSaldosCard({ resumen }: Readonly<ResumenSaldosCardProps>) {
    if (!resumen) return null;
    const estadoStyle = resumen.estadoGlobal ? estadoGlobalStyles[resumen.estadoGlobal] : null;

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wide">Resumen de Saldos</h3>
                {estadoStyle && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoStyle.bg} ${estadoStyle.text}`}>
                        {estadoStyle.label}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                    { label: "Total Pactado", value: resumen.totalPactado, color: "text-build-main dark:text-white" },
                    { label: "Total Pagado", value: resumen.totalPagado, color: "text-green-600 dark:text-green-400" },
                    { label: "Saldo Pendiente", value: resumen.totalPendiente, color: "text-red-600 dark:text-red-400" },
                    { label: "Próx. Vencimiento", value: null, extra: resumen.proximoVencimiento ? new Date(resumen.proximoVencimiento).toLocaleDateString("es-PE") : "—", color: "text-build-accent" },
                ].map((item) => (
                    <div key={item.label} className="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-base font-bold ${item.color}`}>
                            {item.value === null || item.value === undefined ? item.extra : `S/ ${item.value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-400 dark:text-white/40">
                <span>{resumen.cuotasPagadas} cuota{resumen.cuotasPagadas === 1 ? "" : "s"} pagada{resumen.cuotasPagadas === 1 ? "" : "s"}</span>
                <span>{resumen.cuotasPendientes} pendiente{resumen.cuotasPendientes === 1 ? "" : "s"}</span>
                <span>{resumen.cuotasVencidas} vencida{resumen.cuotasVencidas === 1 ? "" : "s"}</span>
            </div>
        </div>
    );
}
