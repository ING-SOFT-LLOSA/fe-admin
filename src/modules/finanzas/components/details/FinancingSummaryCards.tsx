import { useMemo } from "react";
import type { CronogramaResumenResponse } from "@/modules/finanzas/types";

interface FinancingSummaryCardsProps {
    resumen: CronogramaResumenResponse | null;
    commercialValue: number;
    unitCount: number;
}

export default function FinancingSummaryCards({ resumen, commercialValue, unitCount }: FinancingSummaryCardsProps) {
    return (
        <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2 grid-cols-1">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Unidades</p>
                <p className="mt-2 text-lg font-semibold text-build-main dark:text-white">{unitCount}</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Valor Comercial Total</p>
                <p className="mt-2 text-lg font-semibold text-build-main dark:text-white">
                    S/ {commercialValue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Total Pagado</p>
                <p className="mt-2 text-lg font-semibold text-green-600 dark:text-green-400">
                    S/ {(resumen?.totalPagado ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Saldo Pendiente</p>
                <p className="mt-2 text-lg font-semibold text-red-600 dark:text-red-400">
                    S/ {(resumen?.totalPendiente ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
            </div>
        </section>
    );
}
