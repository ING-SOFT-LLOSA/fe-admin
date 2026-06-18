"use client";

import { useFinancingData } from "../../hooks/useFinancingData";
import DirectFinancingView from "../details/DirectFinancingView";
import MortgageFinancingView from "../details/MortgageFinancingView";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

interface PaymentManagementStepProps {
    expediente: UsuarioActivoResponseDTO;
    onBack: () => void;
}

export default function PaymentManagementStep({ expediente, onBack }: PaymentManagementStepProps) {
    const {
        expediente: refreshedExpediente,
        cronograma,
        pagos,
        resumen,
        cartaAprobacion,
        creditoHipotecario,
        isLoading,
        error,
        refresh
    } = useFinancingData(expediente.uuidUsuarioActivo, expediente);

    // Priorizar el expediente refrescado por el hook, caer en el del prop si aún está cargando
    const activeExpediente = refreshedExpediente || expediente;
    const rawType = (activeExpediente.tipoFinanciamiento || "").toLowerCase();
    const isDirecto = rawType.includes("directo");

    return (
        <div className="space-y-6">
            {/* Header del paso */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-build-accent/15 border border-build-accent/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-build-accent">3</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-build-main dark:text-white">Gestionar Pagos</h3>
                        <p className="text-sm text-slate-500 dark:text-white/50">
                            {isDirecto ? "Cronograma y vouchers de cuotas" : "Hitos de desembolso y carta bancaria"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-build-main dark:hover:text-white transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Regresar a Contratos
                </button>
            </div>

            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-build-accent rounded-full mb-4"></div>
                    <p className="text-slate-500 text-sm">Cargando información del contrato…</p>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
                    {error}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {isDirecto ? (
                        <DirectFinancingView
                            expediente={activeExpediente}
                            cronograma={cronograma}
                            pagos={pagos}
                            resumen={resumen}
                            onUpdate={refresh}
                        />
                    ) : (
                        <MortgageFinancingView
                            expediente={activeExpediente}
                            carta={cartaAprobacion}
                            creditoHipotecario={creditoHipotecario}
                            onUpdate={refresh}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
