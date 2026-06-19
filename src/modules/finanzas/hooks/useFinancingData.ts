import { useState, useEffect, useCallback } from "react";
import { fetchContratoPorId, fetchCommercialStepper } from "@/lib/api/expedientes";
import type { UsuarioActivoResponseDTO, HitoComercialResponseDTO } from "@/lib/api/expedientes";
import {
    fetchCronograma,
    fetchPagos,
    fetchResumenPagos,
} from "@/lib/api/finanzas";
import type {
    CronogramaPagoResponse,
    PagoResponse,
    CronogramaResumenResponse,
    CreditoHipotecarioResumen,
    CreditoHipotecarioItem,
} from "@/modules/finanzas/types";

export function useFinancingData(uuidExpediente: string | null, expedienteBase?: UsuarioActivoResponseDTO | null) {
    const [expediente, setExpediente] = useState<UsuarioActivoResponseDTO | null>(expedienteBase ?? null);
    const [cronograma, setCronograma] = useState<CronogramaPagoResponse | null>(null);
    const [pagos, setPagos] = useState<PagoResponse[]>([]);
    const [resumen, setResumen] = useState<CronogramaResumenResponse | null>(null);
    const [creditoHipotecario, setCreditoHipotecario] = useState<CreditoHipotecarioResumen | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // null = aún cargando, false = no tiene expediente, true = sí tiene
    const [hasExpediente, setHasExpediente] = useState<boolean | null>(expedienteBase ? true : null);

    const loadData = useCallback(async () => {
        if (!uuidExpediente && !expedienteBase) {
            setExpediente(null);
            setCronograma(null);
            setPagos([]);
            setResumen(null);
            setCreditoHipotecario(null);
            setHasExpediente(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        setHasExpediente(null);
        try {
            const exp = expedienteBase ?? (uuidExpediente ? await fetchContratoPorId(uuidExpediente) : null);
            if (!exp) {
                throw new Error("No se pudo cargar el contrato solicitado.");
            }
            setExpediente(exp);
            setHasExpediente(true);

            const uuid = exp.uuidUsuarioActivo;
            const rawType = (exp.tipoFinanciamiento || "").toLowerCase();

            if (rawType.includes("directo")) {
                let cronoData: CronogramaPagoResponse | null = null;
                try {
                    cronoData = await fetchCronograma(uuid);
                    setCronograma(cronoData);
                } catch (e) {
                    console.warn("Error fetching cronograma", e);
                    setCronograma(null);
                }

                if (cronoData) {
                    try {
                        const resumenData = await fetchResumenPagos(cronoData.uuidCronograma);
                        setResumen(resumenData);
                    } catch (e) {
                        console.warn("Error fetching resumen", e);
                        setResumen(null);
                    }

                    try {
                        const pagosList = await fetchPagos(cronoData.uuidCronograma);
                        setPagos(pagosList);
                    } catch (e) {
                        console.warn("Error fetching payments", e);
                        setPagos([]);
                    }
                } else {
                    setResumen(null);
                    setPagos([]);
                }
                setCreditoHipotecario(null);
            } else if (rawType.includes("hipotecario")) {
                let cronoData: CronogramaPagoResponse | null = null;
                try {
                    cronoData = await fetchCronograma(uuid);
                    setCronograma(cronoData);
                } catch (e) {
                    console.warn("Error fetching cronograma", e);
                    setCronograma(null);
                }

                if (cronoData) {
                    try {
                        const resumenData = await fetchResumenPagos(cronoData.uuidCronograma);
                        setResumen(resumenData);
                    } catch (e) {
                        console.warn("Error fetching resumen", e);
                        setResumen(null);
                    }

                    try {
                        const pagosList = await fetchPagos(cronoData.uuidCronograma);
                        setPagos(pagosList);
                    } catch (e) {
                        console.warn("Error fetching payments", e);
                        setPagos([]);
                    }
                } else {
                    setResumen(null);
                    setPagos([]);
                }

                // Obtener hitos reales desde el stepper comercial
                let stepperItems: CreditoHipotecarioItem[] = [];
                try {
                    const stepper = await fetchCommercialStepper(uuid);
                    const pagoEtapa = stepper.etapas.find(e => e.etapa === "PAGO");
                    if (pagoEtapa && pagoEtapa.hitos.length > 0) {
                        stepperItems = pagoEtapa.hitos.map(h => ({
                            uuidHitoComercial: h.uuidHitoComercial,
                            nombre: h.nombreHito,
                            fecha: h.fechaCompletado,
                            estado: h.estado,
                            monto: 0,
                            documentId: null,
                            downloadUrl: null,
                        }));
                    }
                } catch { /* sin stepper */ }

                const completados = stepperItems.filter(i => i.estado === "COMPLETADO").length;
                setCreditoHipotecario({
                    items: stepperItems,
                    montoTotal: cronoData?.totalPactado ?? 0,
                    progreso: stepperItems.length > 0 ? (completados / stepperItems.length) * 100 : 0,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar datos de financiamiento");
        } finally {
            setIsLoading(false);
        }
    }, [uuidExpediente, expedienteBase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        expediente,
        cronograma,
        pagos,
        resumen,
        creditoHipotecario,
        hasExpediente,
        isLoading,
        error,
        refresh: loadData
    };
}
