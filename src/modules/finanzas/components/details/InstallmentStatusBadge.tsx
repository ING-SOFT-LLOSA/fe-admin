import type { PaymentStatus } from "@/modules/finanzas/types";

interface InstallmentStatusBadgeProps {
    status: PaymentStatus;
}

export default function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
    const styles = {
        PAGADO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        VENCIDO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    const labels = {
        PAGADO: "Pagado",
        PENDIENTE: "Pendiente",
        VENCIDO: "Vencido",
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}
