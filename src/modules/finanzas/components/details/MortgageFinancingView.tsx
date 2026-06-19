"use client";

import React, { useState, useEffect } from "react";
import type { PagoResponse, CronogramaPagoResponse, CronogramaResumenResponse, CreditoHipotecarioResumen } from "@/modules/finanzas/types";
import { createCronograma, updateCronograma, addPago, deletePago, uploadPagoComprobante, updatePago, updatePagoEstado } from "@/lib/api/finanzas";
import { fetchSignedUrl } from "@/lib/api/documents";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import { updateCommercialHitoEstado, createCommercialHito, deleteCommercialHito, updateCommercialHito } from "@/lib/api/expedientes";
import type { HitoComercialResponseDTO } from "@/lib/api/expedientes";
import { linkComprobanteToLegal } from "@/modules/finanzas/utils/linkComprobanteToLegal";
import DialogModal from "@/components/ui/DialogModal";

interface MortgageFinancingViewProps {
    expediente: UsuarioActivoResponseDTO;
    cronograma: CronogramaPagoResponse | null;
    pagos: PagoResponse[];
    resumen: CronogramaResumenResponse | null;
    creditoHipotecario: CreditoHipotecarioResumen | null;
    onUpdate: () => void;
}

interface CronogramaFormData {
    totalPactado: string;
    pagoSeparacion: string;
    pagoInicial: string;
}

const estadoGlobalStyles: Record<string, { bg: string; text: string; label: string }> = {
    AL_DIA: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "Al día" },
    EN_RIESGO: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", label: "En riesgo" },
    EN_MORA: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", label: "En mora" },
    LIQUIDADO: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Liquidado" },
};

function isSpecialConcepto(pago: PagoResponse): boolean {
    return pago.concepto === "SEPARACION" || pago.concepto === "INICIAL" || pago.concepto === "COMPLETO";
}

function getConceptoLabel(pago: PagoResponse): string {
    return pago.concepto ?? (pago.nroCuota === -1 ? "SEPARACION" : pago.nroCuota === 0 ? "INICIAL" : "COMPLETO");
}

function getPagoStatusInfo(pago: PagoResponse) {
    if (pago.estado === "PAGADO") {
        return {
            bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/20",
            label: "Pagado",
            moraDays: 0,
        };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(pago.fechaVencimiento);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
        return {
            bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/30",
            label: "Vencido",
            moraDays: diffDays,
            moraText: `${diffDays} ${diffDays === 1 ? "día" : "días"} de mora`,
        };
    } else if (diffDays >= -3 && diffDays <= 0) {
        const daysToDue = Math.abs(diffDays);
        return {
            bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30",
            label: daysToDue === 0 ? "Vence hoy" : `Vence en ${daysToDue} d`,
            moraDays: 0,
        };
    } else {
        return {
            bg: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/40",
            label: "Pendiente",
            moraDays: 0,
        };
    }
}

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

interface ResumenSaldosCardProps {
    resumen: CronogramaResumenResponse | null;
}

function ResumenSaldosCard({ resumen }: ResumenSaldosCardProps) {
    if (!resumen) return null;
    const estadoStyle = resumen.estadoGlobal ? estadoGlobalStyles[resumen.estadoGlobal] : null;

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wide">Resumen de Saldos</h3>
                {estadoStyle && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoStyle.bg} ${estadoStyle.text}`}>
                        {estadoStyle.label}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                    { label: "Total Pactado", value: resumen.totalPactado, color: "text-build-main dark:text-white" },
                    { label: "Total Pagado", value: resumen.totalPagado, color: "text-green-600 dark:text-green-400" },
                    { label: "Saldo Pendiente", value: resumen.totalPendiente, color: "text-red-600 dark:text-red-400" },
                    { label: "Próx. Vencimiento", value: null, extra: resumen.proximoVencimiento ? new Date(resumen.proximoVencimiento).toLocaleDateString("es-PE") : "—", color: "text-build-accent" },
                ].map((item) => (
                    <div key={item.label} className="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-base font-bold ${item.color}`}>
                            {item.value != null ? `S/ ${item.value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}` : item.extra}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-400 dark:text-white/40">
                <span>{resumen.cuotasPagadas} cuota{resumen.cuotasPagadas !== 1 ? "s" : ""} pagada{resumen.cuotasPagadas !== 1 ? "s" : ""}</span>
                <span>{resumen.cuotasPendientes} pendiente{resumen.cuotasPendientes !== 1 ? "s" : ""}</span>
                <span>{resumen.cuotasVencidas} vencida{resumen.cuotasVencidas !== 1 ? "s" : ""}</span>
            </div>
        </div>
    );
}

interface CronogramaSeccionProps {
    cronograma: CronogramaPagoResponse | null;
    expediente: UsuarioActivoResponseDTO;
    onUpdate: () => void;
    setDialog: React.Dispatch<React.SetStateAction<any>>;
}

function CronogramaSeccion({ cronograma, expediente, onUpdate, setDialog }: CronogramaSeccionProps) {
    const [showCronogramaForm, setShowCronogramaForm] = useState(!cronograma);
    const [isSaving, setIsSaving] = useState(false);
    const [cronogramaForm, setCronogramaForm] = useState<CronogramaFormData>({
        totalPactado: cronograma?.totalPactado?.toString() ?? "",
        pagoSeparacion: cronograma?.pagoSeparacion?.toString() ?? "",
        pagoInicial: cronograma?.pagoInicial?.toString() ?? "",
    });

    useEffect(() => {
        if (showCronogramaForm && cronograma) {
            setCronogramaForm({
                totalPactado: cronograma.totalPactado?.toString() ?? "",
                pagoSeparacion: cronograma.pagoSeparacion?.toString() ?? "",
                pagoInicial: cronograma.pagoInicial?.toString() ?? "",
            });
        }
    }, [showCronogramaForm, cronograma]);

    const handleCreateCronograma = async () => {
        setIsSaving(true);
        try {
            if (cronograma) {
                await updateCronograma(cronograma.uuidCronograma, {
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    totalPactado: parseFloat(cronogramaForm.totalPactado),
                    pagoSeparacion: parseFloat(cronogramaForm.pagoSeparacion),
                    pagoInicial: parseFloat(cronogramaForm.pagoInicial),
                    numeroCuotas: 1,
                });
            } else {
                await createCronograma({
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    totalPactado: parseFloat(cronogramaForm.totalPactado),
                    pagoSeparacion: parseFloat(cronogramaForm.pagoSeparacion),
                    pagoInicial: parseFloat(cronogramaForm.pagoInicial),
                    numeroCuotas: 1,
                });
            }
            setShowCronogramaForm(false);
            onUpdate();
        } catch (e) {
            setDialog({
                isOpen: true,
                title: "Error",
                message: e instanceof Error ? e.message : "Error al guardar cronograma",
                type: "danger",
                confirmText: "Aceptar",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (showCronogramaForm) {
        return (
            <div className="rounded-2xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10 p-6">
                <h3 className="text-base font-bold text-build-main dark:text-white mb-4">
                    {cronograma ? "Editar" : "Crear"} Cronograma de Pagos
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { key: "totalPactado", label: "Total Pactado (S/)", placeholder: "350000" },
                        { key: "pagoSeparacion", label: "Pago Separación (S/)", placeholder: "1000" },
                        { key: "pagoInicial", label: "Pago Inicial (S/)", placeholder: "50000" },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-1.5">{label}</label>
                            <input
                                type="number"
                                value={cronogramaForm[key as keyof CronogramaFormData]}
                                onChange={(e) => setCronogramaForm((p) => ({ ...p, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-2 focus:ring-build-accent/20"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-5">
                    <button
                        disabled={isSaving}
                        onClick={handleCreateCronograma}
                        className="bg-build-main text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-build-main/80 transition-all disabled:opacity-50"
                    >
                        {isSaving ? "Guardando…" : "Guardar Cronograma"}
                    </button>
                    {cronograma && (
                        <button onClick={() => setShowCronogramaForm(false)} className="text-sm font-bold text-slate-400 hover:text-build-main dark:hover:text-white transition-colors">Cancelar</button>
                    )}
                </div>
            </div>
        );
    }

    if (cronograma) {
        return (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-build-accent text-[20px]">event_note</span>
                    <div>
                        <p className="text-sm font-bold text-build-main dark:text-white">Cronograma Activo</p>
                        <p className="text-xs text-slate-400">{cronograma.numeroCuotas} cuota{cronograma.numeroCuotas !== 1 ? "s" : ""} · Estado: {cronograma.estado}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setCronogramaForm({
                            totalPactado: cronograma.totalPactado?.toString() ?? "",
                            pagoSeparacion: cronograma.pagoSeparacion?.toString() ?? "",
                            pagoInicial: cronograma.pagoInicial?.toString() ?? "",
                        });
                        setShowCronogramaForm(true);
                    }}
                    className="text-xs font-bold text-build-accent hover:underline"
                >
                    Editar
                </button>
            </div>
        );
    }

    return null;
}

interface MortgagePagoRowProps {
    pago: PagoResponse;
    expediente: UsuarioActivoResponseDTO;
    onUpdate: () => void;
    setDialog: React.Dispatch<React.SetStateAction<any>>;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    activeDropzoneId: string | null;
    setActiveDropzoneId: (id: string | null) => void;
}

function MortgagePagoRow({
    pago,
    expediente,
    onUpdate,
    setDialog,
    editingId,
    setEditingId,
    activeDropzoneId,
    setActiveDropzoneId
}: MortgagePagoRowProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [editForm, setEditForm] = useState({ montoProgramado: "", fechaVencimiento: "" });
    const [dropzoneFile, setDropzoneFile] = useState<File | null>(null);
    const [dropzoneComentario, setDropzoneComentario] = useState("");

    const isEditing = editingId === pago.uuidPago;
    const showDropzone = activeDropzoneId === pago.uuidPago;
    const statusInfo = getPagoStatusInfo(pago);

    useEffect(() => {
        if (isEditing) {
            setEditForm({
                montoProgramado: pago.montoProgramado.toString(),
                fechaVencimiento: pago.fechaVencimiento,
            });
        }
    }, [isEditing, pago]);

    useEffect(() => {
        if (!showDropzone) {
            setDropzoneFile(null);
            setDropzoneComentario("");
        }
    }, [showDropzone]);

    const handleSelectFile = (file: File) => {
        setDropzoneFile(file);
    };

    const handleConfirmUpload = async () => {
        if (!dropzoneFile) return;
        setIsBusy(true);
        const file = dropzoneFile;
        const comentario = dropzoneComentario.trim() || undefined;
        try {
            await uploadPagoComprobante(pago.uuidPago, file, comentario);
            if (pago.estado !== "PAGADO") {
                await updatePagoEstado(pago.uuidPago, "PAGADO");
            }
            if (pago.concepto === "SEPARACION" || pago.concepto === "INICIAL") {
                await linkComprobanteToLegal(expediente.uuidUsuarioActivo, pago.concepto, file).catch(() => {});
            }
            setActiveDropzoneId(null);
            onUpdate();
        } catch (err) {
            setDialog({
                isOpen: true,
                title: "Error",
                message: err instanceof Error ? err.message : "Error al subir comprobante",
                type: "danger",
                confirmText: "Aceptar",
            });
        } finally {
            setIsBusy(false);
        }
    };

    const handleStatusChange = async () => {
        const newStatus = pago.estado === "PAGADO" ? "PENDIENTE" : "PAGADO";
        setIsBusy(true);
        try {
            await updatePagoEstado(pago.uuidPago, newStatus as any);
            onUpdate();
        } catch (e) {
            setDialog({
                isOpen: true,
                title: "Error",
                message: e instanceof Error ? e.message : "Error al actualizar estado",
                type: "danger",
                confirmText: "Aceptar",
            });
        } finally {
            setIsBusy(false);
        }
    };

    const handleDownloadVoucher = async (uuidComprobante: string) => {
        try {
            const { url } = await fetchSignedUrl(uuidComprobante);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {
            setDialog({
                isOpen: true,
                title: "Error",
                message: "No se pudo obtener el enlace del comprobante.",
                type: "danger",
                confirmText: "Aceptar",
            });
        }
    };

    const handleDeletePago = async () => {
        setDialog({
            isOpen: true,
            title: "Eliminar Cuota",
            message: "¿Eliminar esta cuota? Se borrará también el comprobante asociado, si existe.",
            type: "danger",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            onConfirm: async () => {
                setDialog((prev: any) => ({ ...prev, isOpen: false }));
                setIsBusy(true);
                try {
                    await deletePago(pago.uuidPago);
                    onUpdate();
                    setDialog({
                        isOpen: true,
                        title: "Cuota Eliminada",
                        message: "La cuota fue eliminada correctamente.",
                        type: "success",
                        confirmText: "Aceptar",
                    });
                } catch (e) {
                    setDialog({
                        isOpen: true,
                        title: "Error",
                        message: e instanceof Error ? e.message : "Error al eliminar cuota",
                        type: "danger",
                        confirmText: "Aceptar",
                    });
                } finally {
                    setIsBusy(false);
                }
            },
        });
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            await updatePago(pago.uuidPago, {
                nroCuota: pago.nroCuota,
                montoProgramado: parseFloat(editForm.montoProgramado),
                fechaVencimiento: editForm.fechaVencimiento,
            });
            setEditingId(null);
            onUpdate();
        } catch (e) {
            setDialog({
                isOpen: true,
                title: "Error",
                message: e instanceof Error ? e.message : "Error al actualizar cuota",
                type: "danger",
                confirmText: "Aceptar",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <React.Fragment>
            <tr className={`transition-colors ${isBusy ? "opacity-60" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}>
                <td className="px-6 py-3 font-bold text-build-main dark:text-white text-sm">
                    {isSpecialConcepto(pago) ? <span className="text-slate-300 dark:text-white/20">—</span> : pago.nroCuota}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-white/50">
                    {getConceptoLabel(pago)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-white/60">
                    {isEditing ? (
                        <input type="date" value={editForm.fechaVencimiento} onChange={(e) => setEditForm(p => ({ ...p, fechaVencimiento: e.target.value }))}
                            className="w-full rounded-lg border border-build-accent bg-white dark:bg-white/5 px-2 py-1 text-xs text-build-main dark:text-white outline-none" />
                    ) : (
                        new Date(pago.fechaVencimiento).toLocaleDateString("es-PE")
                    )}
                </td>
                <td className="px-4 py-3 font-semibold text-build-main dark:text-white">
                    {isEditing ? (
                        <input type="number" value={editForm.montoProgramado} onChange={(e) => setEditForm(p => ({ ...p, montoProgramado: e.target.value }))}
                            className="w-28 rounded-lg border border-build-accent bg-white dark:bg-white/5 px-2 py-1 text-xs text-build-main dark:text-white outline-none" />
                    ) : (
                        <>S/ {pago.montoProgramado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</>
                    )}
                </td>
                <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bg}`}>
                            {statusInfo.label}
                        </span>
                        {statusInfo.moraDays > 0 && (
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px] font-bold">alarm</span>
                                {statusInfo.moraText}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {isEditing ? (
                            <>
                                <button
                                    disabled={isSaving}
                                    onClick={handleSaveEdit}
                                    className="p-1.5 rounded-lg bg-build-accent text-white hover:bg-build-accent/80 transition-colors"
                                    title="Guardar"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                </button>
                                <button
                                    disabled={isSaving}
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    title="Cancelar"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">close</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Editar */}
                                <button
                                    disabled={isBusy}
                                    onClick={() => {
                                        setEditingId(pago.uuidPago);
                                        setActiveDropzoneId(null);
                                    }}
                                    title="Editar cuota"
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-400 hover:text-build-accent">edit</span>
                                </button>

                                <button
                                    disabled={isBusy}
                                    onClick={handleStatusChange}
                                    title={pago.estado === "PAGADO" ? "Marcar Pendiente" : "Marcar Pagado"}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${pago.estado === "PAGADO" ? "text-green-500" : "text-slate-300 dark:text-white/30"}`}>
                                        {pago.estado === "PAGADO" ? "check_circle" : "radio_button_unchecked"}
                                    </span>
                                </button>

                                {/* Subir comprobante */}
                                <button
                                    disabled={isBusy}
                                    onClick={() => {
                                        setEditingId(null);
                                        setActiveDropzoneId(activeDropzoneId === pago.uuidPago ? null : pago.uuidPago);
                                    }}
                                    title="Subir comprobante"
                                    className={`p-1.5 rounded-lg transition-colors ${showDropzone ? "bg-build-accent/15 text-build-accent" : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-build-accent"}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                </button>

                                {pago.uuidComprobante && (
                                    <button
                                        title="Descargar comprobante"
                                        onClick={() => handleDownloadVoucher(pago.uuidComprobante!)}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-build-main dark:text-white/70">download</span>
                                    </button>
                                )}

                                <button
                                    title="Eliminar cuota"
                                    disabled={isBusy}
                                    onClick={handleDeletePago}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-white/20 hover:text-red-500">delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
            {showDropzone && (
                <tr>
                    <td colSpan={6} className="bg-slate-50/50 dark:bg-white/[0.01] px-6 py-4">
                        <div 
                            className="border-2 border-dashed border-build-accent/40 rounded-xl p-4 bg-white dark:bg-white/5 transition flex flex-col gap-3"
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleSelectFile(file);
                            }}
                        >
                            <div 
                                className="text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                onClick={() => document.getElementById(`file-input-${pago.uuidPago}`)?.click()}
                            >
                                <span className="material-symbols-outlined text-build-accent text-[28px]">upload_file</span>
                                {dropzoneFile ? (
                                    <p className="text-xs font-bold text-build-main">{dropzoneFile.name}</p>
                                ) : (
                                    <>
                                        <p className="text-xs font-bold text-slate-600 dark:text-white/80">Arrastra el comprobante o haz clic para seleccionar</p>
                                        <p className="text-[10px] text-slate-400">PDF, JPG, PNG (máx 10MB)</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id={`file-input-${pago.uuidPago}`}
                                    className="hidden"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSelectFile(file);
                                    }}
                                />
                            </div>
                            <div>
                                <textarea
                                    value={dropzoneComentario}
                                    onChange={(e) => setDropzoneComentario(e.target.value)}
                                    placeholder="Comentario opcional del pago..."
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs text-build-main dark:text-white outline-none focus:border-build-accent resize-none"
                                    onClick={(e) => e.stopPropagation()}
                                    onDragOver={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveDropzoneId(null); }}
                                    className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!dropzoneFile || isSaving}
                                    onClick={(e) => { e.stopPropagation(); handleConfirmUpload(); }}
                                    className="bg-build-main text-white px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-build-main/80 transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                                    {isBusy ? "Subiendo…" : "Subir"}
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}

interface CuotasSeccionProps {
    cronograma: CronogramaPagoResponse;
    pagos: PagoResponse[];
    expediente: UsuarioActivoResponseDTO;
    onUpdate: () => void;
    setDialog: React.Dispatch<React.SetStateAction<any>>;
}

function CuotasSeccion({ cronograma, pagos, expediente, onUpdate, setDialog }: CuotasSeccionProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeDropzoneId, setActiveDropzoneId] = useState<string | null>(null);
    const [addForm, setAddForm] = useState({ nroCuota: "", montoProgramado: "", fechaVencimiento: "", concepto: "COMPLETO" });

    useEffect(() => {
        const existing = new Set(pagos.map(p => p.concepto).filter(Boolean));
        const valid = (["COMPLETO", "SEPARACION", "INICIAL"] as const).filter(c => !existing.has(c));
        setAddForm(p => valid.includes(p.concepto as any) ? p : { ...p, concepto: valid[0] ?? "COMPLETO" });
    }, [pagos]);

    const handleAddPago = async () => {
        setIsSaving(true);
        const rawNro = addForm.nroCuota.trim();
        const nroCuota = rawNro !== ""
            ? parseInt(rawNro)
            : addForm.concepto === "SEPARACION" ? -1
            : addForm.concepto === "INICIAL" ? 0
            : 2;
        try {
            await addPago(cronograma.uuidCronograma, {
                nroCuota,
                montoProgramado: parseFloat(addForm.montoProgramado),
                fechaVencimiento: addForm.fechaVencimiento,
                concepto: addForm.concepto,
            });
            setAddForm({ nroCuota: "", montoProgramado: "", fechaVencimiento: "", concepto: "COMPLETO" });
            setShowAddForm(false);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al agregar cuota");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wide">Cuotas del Cronograma</h3>
                <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-bold text-build-accent hover:underline"
                >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Agregar Cuota
                </button>
            </div>

            {showAddForm && (
                <div className="px-6 py-4 bg-build-accent/5 border-b border-build-accent/20">
                    <div className="grid gap-3 md:grid-cols-5 items-end">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">N° Cuota</label>
                            <input type="number" value={addForm.nroCuota} onChange={(e) => setAddForm((p) => ({ ...p, nroCuota: e.target.value }))}
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                        </div>
                        {(() => {
                            const existing = new Set(pagos.map(p => p.concepto).filter(Boolean));
                            const conceptOptions = [
                                { value: "COMPLETO" as const, label: "COMPLETO" },
                                { value: "SEPARACION" as const, label: "SEPARACION" },
                                { value: "INICIAL" as const, label: "INICIAL" },
                            ].filter(o => !existing.has(o.value));
                            return (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Concepto</label>
                                    <select value={addForm.concepto} onChange={(e) => setAddForm((p) => ({ ...p, concepto: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent">
                                        {conceptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            );
                        })()}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monto (S/)</label>
                            <input type="number" value={addForm.montoProgramado} onChange={(e) => setAddForm((p) => ({ ...p, montoProgramado: e.target.value }))}
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vencimiento</label>
                            <input type="date" value={addForm.fechaVencimiento} onChange={(e) => setAddForm((p) => ({ ...p, fechaVencimiento: e.target.value }))}
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddPago} disabled={isSaving}
                                className="flex-1 bg-build-main text-white rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50">
                                {isSaving ? "…" : "Agregar"}
                            </button>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-build-main dark:hover:text-white text-xs px-2">✕</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                        <tr>
                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">N°</th>
                            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Concepto</th>
                            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vencimiento</th>
                            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Monto</th>
                            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {pagos.sort((a, b) => a.nroCuota - b.nroCuota).map((pago) => (
                            <MortgagePagoRow
                                key={pago.uuidPago}
                                pago={pago}
                                expediente={expediente}
                                onUpdate={onUpdate}
                                setDialog={setDialog}
                                editingId={editingId}
                                setEditingId={setEditingId}
                                activeDropzoneId={activeDropzoneId}
                                setActiveDropzoneId={setActiveDropzoneId}
                            />
                        ))}
                    </tbody>
                </table>
                {pagos.length === 0 && (
                    <div className="py-10 text-center text-sm text-slate-400">
                        Sin cuotas registradas. Usa "+ Agregar Cuota" para comenzar.
                    </div>
                )}
            </div>
        </div>
    );
}

interface HitosDesembolsoSectionProps {
    creditoHipotecario: CreditoHipotecarioResumen | null;
    expediente: UsuarioActivoResponseDTO;
    onUpdate: () => void;
}

function HitosDesembolsoSection({ creditoHipotecario, expediente, onUpdate }: HitosDesembolsoSectionProps) {
    const [showHitoForm, setShowHitoForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [editingHito, setEditingHito] = useState<string | null>(null);
    const [hitoFormData, setHitoFormData] = useState({ nombre: "" });

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
        setHitoFormData({ nombre: hito.nombreHito });
        setShowHitoForm(true);
    };

    return (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-build-accent">timeline</span>
                    <h4 className="text-base font-bold text-build-main dark:text-white">Etapas del Desembolso</h4>
                    {creditoHipotecario && (
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                            {creditoHipotecario.progreso.toFixed(0)}% completo
                        </span>
                    )}
                </div>
                <button
                    onClick={() => {
                        setEditingHito(null);
                        setHitoFormData({ nombre: "" });
                        setShowHitoForm(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-build-accent hover:underline"
                >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Agregar Hito
                </button>
            </div>

            {showHitoForm && (
                <div className="mb-4 p-4 rounded-xl border border-build-accent/20 bg-build-accent/5">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={hitoFormData.nombre}
                            onChange={(e) => setHitoFormData({ nombre: e.target.value })}
                            placeholder="Nombre del hito…"
                            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent"
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddHito(); }}
                        />
                        <button
                            disabled={isSaving || !hitoFormData.nombre}
                            onClick={handleAddHito}
                            className="bg-build-main text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            {isSaving ? "…" : editingHito ? "Actualizar" : "Agregar"}
                        </button>
                        <button
                            onClick={() => { setShowHitoForm(false); setEditingHito(null); }}
                            className="text-slate-400 hover:text-build-main dark:hover:text-white text-xs px-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3 relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />

                {paymentHitos.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                        <p className="text-sm italic">Sin hitos registrados</p>
                    </div>
                )}

                {paymentHitos.map((item, idx) => {
                    const isCompleted = item.estado === "COMPLETADO";
                    const isEnProgreso = item.estado === "EN_PROGRESO";
                    const canChangeEstado = Boolean(item.uuidHitoComercial);

                    return (
                        <div key={item.uuidHitoComercial ?? `${item.nombre}-${idx}`} className="relative pl-10 last:mb-0 group">
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
                                        {item.uuidHitoComercial && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        const h: HitoComercialResponseDTO = {
                                                            uuidHitoComercial: item.uuidHitoComercial!,
                                                            uuidEtapaExpediente: "",
                                                            etapaProceso: "PAGO",
                                                            nombreHito: item.nombre,
                                                            descripcion: "",
                                                            orden: idx,
                                                            estado: item.estado as any,
                                                            fechaCompletado: item.fecha,
                                                            createdAt: "",
                                                        };
                                                        startEditingHito(h);
                                                    }}
                                                    className="text-[9px] text-slate-400 hover:text-build-accent"
                                                    title="Editar nombre"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHito(item.uuidHitoComercial!)}
                                                    className="text-[9px] text-slate-400 hover:text-red-500"
                                                    title="Eliminar hito"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

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
    );
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function MortgageFinancingView({ expediente, cronograma, pagos, resumen, creditoHipotecario, onUpdate }: MortgageFinancingViewProps) {
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "info" | "success" | "warning" | "danger";
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, title: "", message: "", type: "info" });

    const progress = creditoHipotecario?.progreso ?? 0;

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <span className="material-symbols-outlined text-[28px]">account_balance</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-build-main dark:text-white uppercase tracking-wider">Crédito Hipotecario</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40">Cronograma de pagos y etapas de desembolso</p>
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

            {/* Resumen de saldos */}
            <ResumenSaldosCard resumen={resumen} />

            <DialogModal
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
                onConfirm={dialog.onConfirm}
                onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
            />

            {/* Cronograma — Configuración */}
            <CronogramaSeccion
                cronograma={cronograma}
                expediente={expediente}
                onUpdate={onUpdate}
                setDialog={setDialog}
            />

            {/* Tabla de Cuotas */}
            {cronograma && (
                <CuotasSeccion
                    cronograma={cronograma}
                    pagos={pagos}
                    expediente={expediente}
                    onUpdate={onUpdate}
                    setDialog={setDialog}
                />
            )}

            {/* Hitos del Desembolso */}
            <HitosDesembolsoSection
                creditoHipotecario={creditoHipotecario}
                expediente={expediente}
                onUpdate={onUpdate}
            />
        </div>
    );
}
