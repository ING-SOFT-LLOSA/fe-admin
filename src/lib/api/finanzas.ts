import { apiFetch } from "@/lib/api/http";
import { getFreshToken } from "@/lib/auth/session";
import type {
    CronogramaPagoResponse,
    PagoResponse,
    CronogramaResumenResponse,
    PaymentStatus
} from "@/modules/finanzas/types";
import { normalizeCronograma } from "@/modules/finanzas/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

// ─── Cronogramas ──────────────────────────────────────────────────────────────

export async function fetchCronograma(uuidUsuarioActivo: string): Promise<CronogramaPagoResponse> {
    const raw = await apiFetch<Record<string, unknown>>(`/api/cronogramas/${uuidUsuarioActivo}`);
    return normalizeCronograma(raw);
}

interface CronogramaPayload {
    uuidUsuarioActivo: string;
    totalPactado: number;
    pagoSeparacion: number;
    pagoInicial: number;
    numeroCuotas: number;
}

function toCronogramaBody(p: CronogramaPayload) {
    return {
        uuidUsuarioActivo: p.uuidUsuarioActivo,
        totalPactado: p.totalPactado,
        pagoSeparacion: p.pagoSeparacion,
        pagoIncial: p.pagoInicial,
        numeroCuotas: p.numeroCuotas,
    };
}

export function createCronograma(payload: CronogramaPayload): Promise<CronogramaPagoResponse> {
    return apiFetch<CronogramaPagoResponse>("/api/cronogramas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCronogramaBody(payload)),
    });
}

export function updateCronograma(uuidCronograma: string, payload: CronogramaPayload): Promise<CronogramaPagoResponse> {
    return apiFetch<CronogramaPagoResponse>(`/api/cronogramas/${uuidCronograma}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCronogramaBody(payload)),
    });
}

export function deleteCronograma(uuidCronograma: string): Promise<void> {
    return apiFetch<void>(`/api/cronogramas/${uuidCronograma}`, { method: "DELETE" });
}

// ─── Pagos (Cuotas) ───────────────────────────────────────────────────────────

export function fetchPagos(uuidCronograma: string): Promise<PagoResponse[]> {
    return apiFetch<PagoResponse[]>(`/api/cronogramas/${uuidCronograma}/pagos`);
}

export function fetchResumenPagos(uuidCronograma: string): Promise<CronogramaResumenResponse> {
    return apiFetch<CronogramaResumenResponse>(`/api/cronogramas/${uuidCronograma}/resumen`);
}

export function addPago(uuidCronograma: string, payload: {
    nroCuota: number;
    montoProgramado: number;
    fechaVencimiento: string;
    concepto?: string;
    comentario?: string | null;
}): Promise<PagoResponse> {
    return apiFetch<PagoResponse>(`/api/cronogramas/${uuidCronograma}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function updatePago(uuidPago: string, payload: {
    nroCuota: number;
    montoProgramado: number;
    fechaVencimiento: string;
    concepto?: string;
    comentario?: string | null;
}): Promise<PagoResponse> {
    return apiFetch<PagoResponse>(`/api/pagos/${uuidPago}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function deletePago(uuidPago: string): Promise<void> {
    return apiFetch<void>(`/api/pagos/${uuidPago}`, { method: "DELETE" });
}

export function updatePagoEstado(uuidPago: string, estado: PaymentStatus): Promise<PagoResponse> {
    return apiFetch<PagoResponse>(`/api/pagos/${uuidPago}/estado?estado=${estado}`, {
        method: "PATCH",
    });
}

export async function uploadPagoComprobante(uuidPago: string, file: File, comentario?: string): Promise<PagoResponse> {
    const token = await getFreshToken();
    if (!token) throw new Error("No hay sesión activa. Inicia sesión de nuevo.");

    const formData = new FormData();
    formData.append("file", file);
    if (comentario) formData.append("comentario", comentario);

    const res = await fetch(`${API_URL}/api/pagos/${uuidPago}/comprobante`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        const errorText = await res.text();
        let message = errorText;
        try { const j = JSON.parse(errorText); message = j.error ?? j.message ?? errorText; } catch { /* */ }
        throw new Error(message || "Error al subir el comprobante");
    }
    return res.json();
}


