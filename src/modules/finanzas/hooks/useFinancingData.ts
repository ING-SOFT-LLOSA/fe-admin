import { useState, useEffect, useCallback } from "react";
import { fetchContratoActivo, fetchCommercialStepper } from "@/lib/api/expedientes";
import { ApiError } from "@/lib/api/http";
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
    CartaAprobacionResponse,
    FinanceType
} from "@/modules/finanzas/types";

export function useFinancingData(selectedUnitId: string | null) {
    const [expediente, setExpediente] = useState<UsuarioActivoResponseDTO | null>(null);
    const [cronograma, setCronograma] = useState<CronogramaPagoResponse | null>(null);
    const [pagos, setPagos] = useState<PagoResponse[]>([]);
    const [resumen, setResumen] = useState<CronogramaResumenResponse | null>(null);
    const [cartaAprobacion, setCartaAprobacion] = useState<CartaAprobacionResponse | null>(null);
    const [stepper, setStepper] = useState<StepperResponseDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // null = aún cargando, false = no tiene expediente, true = sí tiene
    const [hasExpediente, setHasExpediente] = useState<boolean | null>(null);

    const loadData = useCallback(async () => {
        if (!selectedUnitId) {
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
            const data = await fetchContratoActivo(selectedUnitId);
            let exp: UsuarioActivoResponseDTO | null = null;
            let cronogramaData: CronogramaPagoResponse | null = null;
            let resumenData: CronogramaResumenResponse | null = null;
            let cartaAprobacionData: CartaAprobacionResponse | null = null;

            if (Array.isArray(data)) {
                const found = data.find((d: any) => d.activo?.id === selectedUnitId || d.activos?.some((a: any) => a.id === selectedUnitId)) || data[0];
                exp = found ?? null;
            } else {
                exp = data.expediente ?? null;
                cronogramaData = data.cronograma ?? null;
                resumenData = data.resumen ?? null;
                cartaAprobacionData = data.cartaAprobacion ?? null;
            }

            setExpediente(exp);
            setHasExpediente(!!exp);
            setCronograma(cronogramaData);
            setResumen(resumenData);
            setCartaAprobacion(cartaAprobacionData);

            if (!exp) {
                throw new Error("No se pudo determinar el expediente del contrato");
            }

            const uuid = exp.uuidUsuarioActivo;
            const rawType = (exp.tipoFinanciamiento || "").toLowerCase();

            // Solo fetch de lo que no viene en el wrapper (pagos y stepper)
            if (rawType.includes("directo")) {
                if (cronogramaData) {
                    try {
                        const pagosList = await fetchPagos(cronogramaData.uuidCronograma);
                        setPagos(pagosList);
                    } catch (e) {
                        console.warn("Error fetching payments", e);
                        setPagos([]);
                    }
                } else {
                    try {
                        const cronograma = await fetchCronograma(uuid);
                        setCronograma(cronograma);
                        if (cronograma) {
                            const pagosList = await fetchPagos(cronograma.uuidCronograma);
                            setPagos(pagosList);
                            const resumen = await fetchResumenPagos(cronograma.uuidCronograma);
                            setResumen(resumen);
                        }
                    } catch (e) {
                        console.warn("Error fetching cronograma or payments", e);
                        setPagos([]);
                    }
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
                setPagos([]);
                setCronograma(null);
                setResumen(null);
                if (!cartaAprobacionData) {
                    try {
                        const carta = await fetchCartaAprobacion(uuid);
                        setCartaAprobacion(carta);
                    } catch (e) {
                        console.warn("Error fetching carta aprobacion", e);
                        setCartaAprobacion(null);
                    }
                }
            }
        } catch (err) {
            // 404 = la unidad no tiene expediente asignado → estado vacío, no error
            if (err instanceof ApiError && err.status === 404) {
                setExpediente(null);
                setHasExpediente(false);
                setCronograma(null);
                setPagos([]);
                setResumen(null);
                setCartaAprobacion(null);
                setStepper(null);
            } else {
                setError(err instanceof Error ? err.message : "Error al cargar datos de financiamiento");
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedUnitId]);

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
