"use client";

import { useState, useEffect } from "react";
import type { CartaAprobacionResponse } from "@/modules/finanzas/types";
import type { CartaAprobacionPayload } from "@/lib/api/finanzas";
import { createCartaAprobacion, updateCartaAprobacion, deleteCartaAprobacion } from "@/lib/api/finanzas";
import { ApiError } from "@/lib/api/http";
import type { StepperResponseDTO, HitoComercialResponseDTO } from "@/lib/api/expedientes";
import { updateCommercialHitoEstado, createCommercialHito, deleteCommercialHito, updateCommercialHito } from "@/lib/api/expedientes";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

interface MortgageFinancingViewProps {
    expediente: UsuarioActivoResponseDTO;
    carta: CartaAprobacionResponse | null;
    stepper: StepperResponseDTO | null;
    onUpdate: () => void;
}

export default function MortgageFinancingView({ expediente, carta, stepper, onUpdate }: MortgageFinancingViewProps) {
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
        descripcion: "",
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

    const paymentEtapa = stepper?.etapas.find(e => e.etapa === "PAGO");
    const progress = paymentEtapa?.porcentajeAvance ?? 0;

    const handleHitoToggle = async (uuidHito: string, currentEstado: string) => {
        const newEstado = currentEstado === "COMPLETADO" ? "PENDIENTE" : "COMPLETADO";
        setIsUpdating(uuidHito);
        try {
            await updateCommercialHitoEstado(uuidHito, newEstado);
            onUpdate();
        } catch (error) {
            console.error("Error updating hito status", error);
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
            if (e instanceof ApiError && e.status === 409) {
                alert("Ya existe una carta de aprobación para este expediente. Se recargarán los datos.");
                onUpdate();
                setShowCartaForm(false);
            } else {
                alert(e instanceof Error ? e.message : "Error al guardar carta");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddHito = async () => {
        if (!hitoFormData.nombre || isSaving) return;
        setIsSaving(true);
        try {
            if (editingHito) {
                const currentHito = paymentEtapa?.hitos.find(h => h.uuidHitoComercial === editingHito);
                await updateCommercialHito(editingHito, {
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    etapaProceso: "PAGO",
                    nombreHito: hitoFormData.nombre,
                    descripcion: hitoFormData.descripcion,
                    orden: currentHito?.orden ?? (paymentEtapa?.hitos.length ?? 0) + 1,
                });
                setEditingHito(null);
            } else {
                await createCommercialHito({
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    etapaProceso: "PAGO",
                    nombreHito: hitoFormData.nombre,
                    descripcion: hitoFormData.descripcion,
                    orden: (paymentEtapa?.hitos.length ?? 0) + 1,
                });
            }
            setHitoFormData({ nombre: "", descripcion: "" });
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
            descripcion: hito.descripcion,
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

                {/* Lado Derecho: Hitos de Desembolso (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-build-accent">task_alt</span>
                                Hitos
                            </h4>
                            <button
                                onClick={() => setShowHitoForm(!showHitoForm)}
                                className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-build-accent hover:border-build-accent transition-all"
                                title="Agregar Hito Manual"
                            >
                                <span className="material-symbols-outlined text-[20px]">{showHitoForm ? "close" : "add"}</span>
                            </button>
                        </div>

                        <div className="space-y-4 relative flex-1">
                            {showHitoForm && (
                                <div className="mb-6 p-4 rounded-xl border border-build-accent/20 bg-build-accent/5 animate-in slide-in-from-top-2 duration-300">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-build-accent mb-3">
                                        {editingHito ? "Editar Hito" : "Nuevo Hito (Etapa PAGO)"}
                                    </p>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Nombre del hito (ej. Minuta)"
                                            value={hitoFormData.nombre}
                                            onChange={(e) => setHitoFormData(p => ({ ...p, nombre: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-xs outline-none focus:border-build-accent"
                                        />
                                        <textarea
                                            placeholder="Descripción breve..."
                                            rows={2}
                                            value={hitoFormData.descripcion}
                                            onChange={(e) => setHitoFormData(p => ({ ...p, descripcion: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-xs outline-none focus:border-build-accent resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddHito}
                                                disabled={!hitoFormData.nombre || isSaving}
                                                className="flex-1 bg-build-accent text-white py-1.5 rounded-lg text-xs font-bold hover:bg-build-accent/80 transition-all disabled:opacity-50"
                                            >
                                                {isSaving ? "Procesando..." : editingHito ? "Guardar Cambios" : "Agregar Hito"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowHitoForm(false);
                                                    setEditingHito(null);
                                                    setHitoFormData({ nombre: "", descripcion: "" });
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-400"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Línea vertical decorativa */}
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />

                            {paymentEtapa?.hitos.sort((a, b) => a.orden - b.orden).map((hito) => {
                                const isCompleted = hito.estado === "COMPLETADO";
                                const isEnProgreso = hito.estado === "EN_PROGRESO";

                                return (
                                    <div key={hito.uuidHitoComercial} className="relative pl-10 mb-4 last:mb-0 group">
                                        {/* Punto en la línea */}
                                        <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${isCompleted
                                            ? "bg-green-500 border-green-500 text-white"
                                            : isEnProgreso
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 text-slate-300"
                                            }`}>
                                            <span className="material-symbols-outlined text-[16px]">
                                                {isCompleted ? "check" : isEnProgreso ? "priority_high" : "radio_button_unchecked"}
                                            </span>
                                        </div>

                                        <div className={`p-3 rounded-xl border transition-all ${isCompleted ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" : "bg-white dark:bg-white/0 border-transparent shadow-sm"
                                            }`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-bold transition-colors ${isCompleted ? "text-green-800 dark:text-green-400" : "text-build-main dark:text-white"}`}>
                                                            {hito.nombreHito}
                                                        </p>
                                                        <div className="hidden group-hover:flex items-center gap-1">
                                                            <button
                                                                onClick={() => startEditingHito(hito)}
                                                                className="text-slate-400 hover:text-build-accent transition-colors"
                                                                title="Editar"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteHito(hito.uuidHitoComercial)}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{hito.descripcion}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <button
                                                        disabled={isUpdating === hito.uuidHitoComercial}
                                                        onClick={() => handleHitoToggle(hito.uuidHitoComercial, hito.estado)}
                                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                                        title={isCompleted ? "Marcar como pendiente" : "Marcar como completado"}
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${isCompleted ? "text-green-500" : isEnProgreso ? "text-amber-500" : "text-slate-300"}`}>
                                                            {isUpdating === hito.uuidHitoComercial ? "more_horiz" : isCompleted ? "check_circle" : isEnProgreso ? "published_with_changes" : "circle"}
                                                        </span>
                                                    </button>
                                                    {hito.fechaCompletado && (
                                                        <span className="text-[9px] text-green-600 dark:text-green-400 font-bold whitespace-nowrap">
                                                            {new Date(hito.fechaCompletado).toLocaleDateString("es-PE")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {(!paymentEtapa?.hitos || paymentEtapa.hitos.length === 0) && !showHitoForm && (
                                <div className="text-center py-10 opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2">rule</span>
                                    <p className="text-sm italic">Sin hitos configurados para esta etapa.</p>
                                    <button onClick={() => setShowHitoForm(true)} className="text-xs font-bold text-build-accent underline mt-2">Agregar el primero</button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
