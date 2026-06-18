"use client";

import { useState, useEffect } from "react";
import type { CartaAprobacionResponse, CreditoHipotecarioItem, CreditoHipotecarioResumen } from "@/modules/finanzas/types";
import type { CartaAprobacionPayload } from "@/lib/api/finanzas";
import { createCartaAprobacion, updateCartaAprobacion, deleteCartaAprobacion } from "@/lib/api/finanzas";
import type { HitoComercialResponseDTO } from "@/lib/api/expedientes";
import { updateCommercialHitoEstado, createCommercialHito, deleteCommercialHito, updateCommercialHito } from "@/lib/api/expedientes";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import CreditDocumentsSection from "./CreditDocumentsSection";


interface MortgageFinancingViewProps {
    expediente: UsuarioActivoResponseDTO;
    carta: CartaAprobacionResponse | null;
    creditoHipotecario: CreditoHipotecarioResumen | null;
    onUpdate: () => void;
}

export default function MortgageFinancingView({ expediente, carta, creditoHipotecario, onUpdate }: MortgageFinancingViewProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [editingHito, setEditingHito] = useState<string | null>(null);
    const [showCartaForm, setShowCartaForm] = useState(false);
    const [showHitoForm, setShowHitoForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [cartaFormData, setCartaFormData] = useState<Partial<CartaAprobacionPayload>>({
        banco: "",
        montoAprobado: 0,
        fechaEmision: "",
        fechaVencimiento: "",
        fechaDesembolsoProyectada: "",
        comentarios: "",
    });

    const [hitoFormData, setHitoFormData] = useState({
        nombre: "",
    });

    // Sincronizar form con data cuando cambia o se abre el form
    useEffect(() => {
        if (carta) {
            setCartaFormData({
                banco: carta.banco,
                montoAprobado: carta.montoAprobado,
                fechaEmision: carta.fechaEmision ? new Date(carta.fechaEmision).toISOString().split('T')[0] : "",
                fechaVencimiento: carta.fechaVencimiento ? new Date(carta.fechaVencimiento).toISOString().split('T')[0] : "",
                fechaDesembolsoProyectada: carta.fechaDesembolsoProyectada ? new Date(carta.fechaDesembolsoProyectada).toISOString().split('T')[0] : "",
                comentarios: carta.comentarios ?? "",
            });
        }
    }, [carta, showCartaForm]);

    // Progreso viene del backend (endpoint unificado) o cae a 0
    const progress = creditoHipotecario?.progreso ?? 0;
    // Hitos del stepper interno (para CRUD manual)
    const paymentHitos = creditoHipotecario?.items ?? [];


    const handleHitoToggle = async (uuidHito: string, currentEstado: string) => {
        const newEstado =
            currentEstado === "PENDIENTE"
                ? "EN_PROGRESO"
                : currentEstado === "EN_PROGRESO"
                    ? "COMPLETADO"
                    : "PENDIENTE";
        setIsUpdating(uuidHito);
        try {
            await updateCommercialHitoEstado(uuidHito, newEstado);
            onUpdate();
        } catch (e) {
            console.error("Error updating hito status", e);
            alert("No se pudo actualizar el hito.");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleSaveCarta = async () => {
        setIsSaving(true);
        try {
            const payload: CartaAprobacionPayload = {
                uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                banco: cartaFormData.banco || "",
                montoAprobado: Number(cartaFormData.montoAprobado),
                fechaEmision: cartaFormData.fechaEmision || "",
                fechaVencimiento: cartaFormData.fechaVencimiento || "",
                fechaDesembolsoProyectada: cartaFormData.fechaDesembolsoProyectada || "",
                comentarios: cartaFormData.comentarios,
            };

            if (carta) {
                await updateCartaAprobacion(carta.uuidCarta, payload);
            } else {
                await createCartaAprobacion(payload);
            }
            // Importante: Llamar a onUpdate primero para disparar la recarga de datos (incluyendo hitos)
            onUpdate();
            setShowCartaForm(false);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al guardar carta");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddHito = async () => {
        if (!hitoFormData.nombre || isSaving) return;
        setIsSaving(true);
        try {
            if (editingHito) {
                await updateCommercialHito(editingHito, {
                    nombreHito: hitoFormData.nombre,
                    descripcion: "",
                });
                setEditingHito(null);
            } else {
                await createCommercialHito({
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    etapaProceso: "PAGO",
                    nombreHito: hitoFormData.nombre,
                    descripcion: "",
                    orden: (paymentHitos.length ?? 0) + 1,
                });
            }
            setHitoFormData({ nombre: "" });
            setShowHitoForm(false);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al procesar hito");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteHito = async (uuidHito: string) => {
        if (!confirm("¿Eliminar este hito comercial?")) return;
        setIsSaving(true);
        try {
            await deleteCommercialHito(uuidHito);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al eliminar hito");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditingHito = (hito: HitoComercialResponseDTO) => {
        setEditingHito(hito.uuidHitoComercial);
        setHitoFormData({
            nombre: hito.nombreHito,
        });
        setShowHitoForm(true);
    };

    const handleDeleteCarta = async () => {
        if (!carta || !confirm("¿Eliminar los datos de la carta bancaria?")) return;
        setIsSaving(true);
        try {
            await deleteCartaAprobacion(carta.uuidCarta);
            setShowCartaForm(false);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al eliminar carta");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <span className="material-symbols-outlined text-[28px]">account_balance</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wider">Crédito Hipotecario</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40">Gestión de aprobación bancaria y desembolso</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Progreso Desembolso</p>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{progress.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Documentos de Crédito — fila completa */}
            <CreditDocumentsSection
                expedienteId={expediente.uuidUsuarioActivo}
                onUpdate={onUpdate}
            />
            {/* Carta + Hitos — grilla 5 columnas */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Lado Izquierdo: Carta de Aprobación (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-build-accent">description</span>
                                Carta de Aprobación
                            </h4>
                            {carta && !showCartaForm && (
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCartaForm(true)} className="text-xs font-bold text-build-accent hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">edit</span> Editar
                                    </button>
                                    <button onClick={handleDeleteCarta} className="text-xs font-bold text-red-500 hover:opacity-70 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">delete</span> Eliminar
                                    </button>
                                </div>
                            )}
                        </div>

                        {showCartaForm ? (
                            <div className="space-y-5 flex-1 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Banco Financiador</label>
                                        <input
                                            type="text"
                                            value={cartaFormData.banco}
                                            onChange={(e) => setCartaFormData(p => ({ ...p, banco: e.target.value }))}
                                            placeholder="Ej. BCP, BBVA, Interbank..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent focus:ring-2 focus:ring-build-accent/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Monto Aprobado (S/)</label>
                                        <input
                                            type="number"
                                            value={cartaFormData.montoAprobado}
                                            onChange={(e) => setCartaFormData(p => ({ ...p, montoAprobado: Number(e.target.value) }))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Fecha Emisión</label>
                                        <input
                                            type="date"
                                            value={cartaFormData.fechaEmision}
                                            onChange={(e) => setCartaFormData(p => ({ ...p, fechaEmision: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Fecha Vencimiento</label>
                                        <input
                                            type="date"
                                            value={cartaFormData.fechaVencimiento}
                                            onChange={(e) => setCartaFormData(p => ({ ...p, fechaVencimiento: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Proyección Desembolso</label>
                                        <input
                                            type="date"
                                            value={cartaFormData.fechaDesembolsoProyectada}
                                            onChange={(e) => setCartaFormData(p => ({ ...p, fechaDesembolsoProyectada: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Comentarios Adicionales</label>
                                    <textarea
                                        rows={3}
                                        value={cartaFormData.comentarios}
                                        onChange={(e) => setCartaFormData(p => ({ ...p, comentarios: e.target.value }))}
                                        placeholder="Notas sobre tasaciones o condiciones..."
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-build-accent resize-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                    <button
                                        disabled={isSaving}
                                        onClick={handleSaveCarta}
                                        className="flex-1 bg-build-main text-white py-3 rounded-xl text-sm font-bold hover:bg-build-main/80 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? "Guardando..." : "Guardar Información"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!carta) {
                                                setShowCartaForm(false);
                                            } else {
                                                setShowCartaForm(false);
                                            }
                                        }}
                                        className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-build-main dark:hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : carta ? (
                            <div className="space-y-8 flex-1 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Entidad Bancaria</p>
                                        <p className="text-base font-bold text-build-main dark:text-white">{carta.banco}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Monto Aprobado</p>
                                        <p className="text-base font-bold text-build-accent">
                                            S/ {carta.montoAprobado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">F. Emisión</p>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-white/80">{new Date(carta.fechaEmision).toLocaleDateString("es-PE")}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">F. Vencimiento</p>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-white/80">{new Date(carta.fechaVencimiento).toLocaleDateString("es-PE")}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Proyección de Desembolso</p>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-purple-500">event_upcoming</span>
                                        <p className="text-sm font-bold text-build-main dark:text-white">{new Date(carta.fechaDesembolsoProyectada).toLocaleDateString("es-PE", { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                {carta.comentarios && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Comentarios</p>
                                        <p className="text-sm text-slate-500 dark:text-white/60 italic leading-relaxed">"{carta.comentarios}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 py-10">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-[32px]">assignment_late</span>
                                </div>
                                <h5 className="text-base font-bold text-build-main dark:text-white mb-2">Carta no registrada</h5>
                                <p className="text-sm text-slate-400 dark:text-white/40 mb-6 max-w-[280px]">
                                    Aún no se ha cargado la información técnica de la aprobación hipotecaria.
                                </p>
                                <button
                                    onClick={() => setShowCartaForm(true)}
                                    className="bg-build-accent text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-build-accent/80 transition-all shadow-lg shadow-build-accent/20"
                                >
                                    Registrar Carta Ahora
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Lado Derecho: Hitos del Crédito (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-build-accent">timeline</span>
                            <h4 className="text-base font-bold text-build-main dark:text-white">Etapas del Desembolso</h4>
                            {creditoHipotecario && (
                                <span className="ml-auto text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                    {creditoHipotecario.progreso.toFixed(0)}% completo
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 relative flex-1">
                            {/* Línea vertical decorativa */}
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />

                            {paymentHitos.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                                    <p className="text-sm italic">Cargando etapas...</p>
                                </div>
                            )}

                            {paymentHitos.map((item, idx) => {
                                const isCompleted = item.estado === "COMPLETADO";
                                const isEnProgreso = item.estado === "EN_PROGRESO";
                                const canChangeEstado = Boolean(item.uuidHitoComercial);

                                return (
                                    <div key={item.uuidHitoComercial ?? `${item.nombre}-${idx}`} className="relative pl-10 last:mb-0 group">
                                        {/* Punto en la línea */}
                                        <button
                                            type="button"
                                            disabled={!canChangeEstado || isUpdating === item.uuidHitoComercial}
                                            onClick={() => item.uuidHitoComercial && handleHitoToggle(item.uuidHitoComercial, item.estado)}
                                            title={!canChangeEstado ? "No hay hito asociado" : isCompleted ? "Marcar como pendiente" : isEnProgreso ? "Marcar como completado" : "Marcar como en curso"}
                                            className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors disabled:cursor-not-allowed ${
                                            isCompleted
                                                ? "bg-green-500 border-green-500 text-white"
                                                : isEnProgreso
                                                    ? "bg-amber-500 border-amber-500 text-white"
                                                    : "bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 text-slate-300"
                                            } ${canChangeEstado ? "hover:scale-105" : "opacity-60"}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {isUpdating === item.uuidHitoComercial ? "more_horiz" : isCompleted ? "check" : isEnProgreso ? "priority_high" : "radio_button_unchecked"}
                                            </span>
                                        </button>

                                        <div className={`p-3 rounded-xl border transition-all ${
                                            isCompleted
                                                ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30"
                                                : isEnProgreso
                                                    ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20"
                                                    : "bg-white dark:bg-white/0 border-transparent"
                                        }`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${
                                                        isCompleted ? "text-green-800 dark:text-green-400" : "text-build-main dark:text-white"
                                                    }`}>
                                                        {item.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        {item.monto > 0 && (
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-white/40">
                                                                S/ {item.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                        {item.fecha && (
                                                            <span className="text-[10px] text-slate-400 dark:text-white/30">
                                                                {new Date(item.fecha).toLocaleDateString("es-PE")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={!canChangeEstado || isUpdating === item.uuidHitoComercial}
                                                        onClick={() => item.uuidHitoComercial && handleHitoToggle(item.uuidHitoComercial, item.estado)}
                                                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full transition-colors disabled:cursor-not-allowed ${
                                                        isCompleted
                                                            ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                                                            : isEnProgreso
                                                                ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
                                                                : "text-slate-400 bg-slate-100 dark:bg-white/5"
                                                    } ${canChangeEstado ? "hover:ring-2 hover:ring-build-accent/20" : "opacity-70"}`}
                                                    >
                                                        {item.estado === "COMPLETADO" ? "Listo" : item.estado === "EN_PROGRESO" ? "En curso" : "Pendiente"}
                                                    </button>
                                                    {item.downloadUrl && (
                                                        <a
                                                            href={item.downloadUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[9px] text-build-accent hover:underline flex items-center gap-0.5"
                                                            title="Descargar documento"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">download</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Monto total */}
                            {creditoHipotecario && creditoHipotecario.montoTotal > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monto Total Hipotecario</span>
                                    <span className="text-sm font-bold text-build-main dark:text-white">
                                        S/ {creditoHipotecario.montoTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

}
