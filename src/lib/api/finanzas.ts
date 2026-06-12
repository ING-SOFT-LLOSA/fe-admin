import { apiFetch } from "@/lib/api/http";
import { getFreshToken } from "@/lib/auth/session";
import type {
    CronogramaPagoResponse,
    PagoResponse,
    CronogramaResumenResponse,
    CartaAprobacionResponse,
    PaymentStatus
} from "@/modules/finanzas/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_LLOSA ?? "http://localhost:8080").replace(/\/$/, "");

// ─── Cronogramas ──────────────────────────────────────────────────────────────

export function fetchCronograma(uuidUsuarioActivo: string): Promise<CronogramaPagoResponse> {
    return apiFetch<CronogramaPagoResponse>(`/api/cronogramas/${uuidUsuarioActivo}`);
}

export function createCronograma(payload: {
    uuidUsuarioActivo: string;
    totalPactado: number;
    cuotaInicial: number;
    numeroCuotas: number;
}): Promise<CronogramaPagoResponse> {
    return apiFetch<CronogramaPagoResponse>("/api/cronogramas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function updateCronograma(uuidCronograma: string, payload: {
    uuidUsuarioActivo: string;
    totalPactado: number;
    cuotaInicial: number;
    numeroCuotas: number;
}): Promise<CronogramaPagoResponse> {
    return apiFetch<CronogramaPagoResponse>(`/api/cronogramas/${uuidCronograma}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

export async function uploadPagoComprobante(uuidPago: string, file: File): Promise<PagoResponse> {
    const token = await getFreshToken();
    if (!token) throw new Error("No hay sesión activa. Inicia sesión de nuevo.");

    const formData = new FormData();
    formData.append("file", file);

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

// ─── Cartas de Aprobación ─────────────────────────────────────────────────────

export function fetchCartaAprobacion(uuidUsuarioActivo: string): Promise<CartaAprobacionResponse> {
    return apiFetch<CartaAprobacionResponse>(`/api/cartas-aprobacion/${uuidUsuarioActivo}`);
}

export interface CartaAprobacionPayload {
    uuidUsuarioActivo: string;
    banco: string;
    montoAprobado: number;
    fechaEmision: string;
    fechaVencimiento: string;
    fechaDesembolsoProyectada: string;
    comentarios?: string;
}

export function createCartaAprobacion(payload: CartaAprobacionPayload): Promise<CartaAprobacionResponse> {
    return apiFetch<CartaAprobacionResponse>("/api/cartas-aprobacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function updateCartaAprobacion(uuidCarta: string, payload: CartaAprobacionPayload): Promise<CartaAprobacionResponse> {
    return apiFetch<CartaAprobacionResponse>(`/api/cartas-aprobacion/${uuidCarta}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function deleteCartaAprobacion(uuidCarta: string): Promise<void> {
    return apiFetch<void>(`/api/cartas-aprobacion/${uuidCarta}`, { method: "DELETE" });
}
