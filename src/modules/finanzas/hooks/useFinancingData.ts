import { useState, useEffect, useCallback } from "react";
import { fetchCommercialStepper, fetchContratoPorId } from "@/lib/api/expedientes";
import type { StepperResponseDTO, UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import {
    fetchCronograma,
    fetchPagos,
    fetchResumenPagos,
    fetchCartaAprobacion
} from "@/lib/api/finanzas";
import type {
    CronogramaPagoResponse,
    PagoResponse,
    CronogramaResumenResponse,
    CartaAprobacionResponse
} from "@/modules/finanzas/types";

export function useFinancingData(uuidExpediente: string | null, expedienteBase?: UsuarioActivoResponseDTO | null) {
    const [expediente, setExpediente] = useState<UsuarioActivoResponseDTO | null>(expedienteBase ?? null);
    const [cronograma, setCronograma] = useState<CronogramaPagoResponse | null>(null);
    const [pagos, setPagos] = useState<PagoResponse[]>([]);
    const [resumen, setResumen] = useState<CronogramaResumenResponse | null>(null);
    const [cartaAprobacion, setCartaAprobacion] = useState<CartaAprobacionResponse | null>(null);
    const [stepper, setStepper] = useState<StepperResponseDTO | null>(null);
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
            setCartaAprobacion(null);
            setStepper(null);
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
                setStepper(null);
                setCartaAprobacion(null);
            } else if (rawType.includes("hipotecario")) {
                try {
                    const step = await fetchCommercialStepper(uuid);
                    setStepper(step);
                } catch (e) {
                    console.warn("Error fetching stepper", e);
                    setStepper(null);
                }
                try {
                    const carta = await fetchCartaAprobacion(uuid);
                    setCartaAprobacion(carta);
                } catch (e) {
                    console.warn("Error fetching carta", e);
                    setCartaAprobacion(null);
                }
                setPagos([]);
                setCronograma(null);
                setResumen(null);
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
        cartaAprobacion,
        stepper,
        hasExpediente,
        isLoading,
        error,
        refresh: loadData
    };
}
