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

/** Wraps an async call so it never throws; returns fallback on error. */
async function safeFetch<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        console.warn(`Error fetching ${label}`, e);
        return fallback;
    }
}

/** Loads cronograma, resumen, and pagos for a given uuid. */
async function loadCronogramaData(uuid: string) {
    const cronograma = await safeFetch(() => fetchCronograma(uuid), null, "cronograma");
    if (!cronograma) {
        return { cronograma: null, resumen: null, pagos: [] as PagoResponse[] };
    }
    const [resumen, pagos] = await Promise.all([
        safeFetch(() => fetchResumenPagos(cronograma.uuidCronograma), null, "resumen"),
        safeFetch(() => fetchPagos(cronograma.uuidCronograma), [] as PagoResponse[], "payments"),
    ]);
    return { cronograma, resumen, pagos };
}

/** Loads hipotecario stepper items and builds the resumen. */
async function loadHipotecarioItems(
    uuid: string,
    totalPactado: number,
): Promise<CreditoHipotecarioResumen> {
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
    return {
        items: stepperItems,
        montoTotal: totalPactado,
        progreso: stepperItems.length > 0 ? (completados / stepperItems.length) * 100 : 0,
    };
}

function getFinancingType(rawType: string): "directo" | "hipotecario" | null {
    if (rawType.includes("directo")) return "directo";
    if (rawType.includes("hipotecario")) return "hipotecario";
    return null;
}

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
            const financingType = getFinancingType((exp.tipoFinanciamiento || "").toLowerCase());

            if (financingType === "directo" || financingType === "hipotecario") {
                const cronoResult = await loadCronogramaData(uuid);
                setCronograma(cronoResult.cronograma);
                setResumen(cronoResult.resumen);
                setPagos(cronoResult.pagos);

                if (financingType === "hipotecario") {
                    const hipotecarioData = await loadHipotecarioItems(
                        uuid,
                        cronoResult.cronograma?.totalPactado ?? 0,
                    );
                    setCreditoHipotecario(hipotecarioData);
                } else {
                    setCreditoHipotecario(null);
                }
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
