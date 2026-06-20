import type { PagoResponse } from "@/modules/finanzas/types";

export const estadoGlobalStyles: Record<string, { bg: string; text: string; label: string }> = {
    AL_DIA: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "Al día" },
    EN_RIESGO: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", label: "En riesgo" },
    EN_MORA: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", label: "En mora" },
    LIQUIDADO: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Liquidado" },
};

export function isSpecialConcepto(pago: PagoResponse): boolean {
    return pago.concepto === "SEPARACION" || pago.concepto === "INICIAL" || pago.concepto === "COMPLETO";
}

export function getConceptoLabel(pago: PagoResponse): string {
    if (pago.concepto) {
        return pago.concepto;
    }
    if (pago.nroCuota === -1) {
        return "SEPARACION";
    }
    if (pago.nroCuota === 0) {
        return "INICIAL";
    }
    return "COMPLETO";
}

export function getPagoStatusInfo(pago: PagoResponse) {
    if (pago.estado === "PAGADO") {
        return {
            bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/20",
            label: "Pagado",
            moraDays: 0,
        };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = pago.fechaVencimiento.split("-").map(Number);
    const dueDate = new Date(y, m - 1, d);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
        return {
            bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/30",
            label: "Vencido",
            moraDays: diffDays,
            moraText: `${diffDays} ${diffDays === 1 ? "día" : "días"} de mora`,
        };
    } else if (diffDays >= -3 && diffDays <= 0) {
        const daysToDue = Math.abs(diffDays);
        return {
            bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30",
            label: daysToDue === 0 ? "Vence hoy" : `Vence en ${daysToDue} d`,
            moraDays: 0,
        };
    } else {
        return {
            bg: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/40",
            label: "Pendiente",
            moraDays: 0,
        };
    }
}
