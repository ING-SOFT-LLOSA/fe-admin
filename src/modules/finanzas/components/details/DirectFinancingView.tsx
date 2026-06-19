import React, { useState, useEffect } from "react";
import type { PagoResponse, CronogramaPagoResponse, CronogramaResumenResponse } from "@/modules/finanzas/types";
import InstallmentStatusBadge from "../details/InstallmentStatusBadge";
import { updatePagoEstado, uploadPagoComprobante, addPago, deletePago, updatePago, createCronograma, updateCronograma } from "@/lib/api/finanzas";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import { fetchSignedUrl } from "@/lib/api/documents";
import { linkComprobanteToLegal } from "@/modules/finanzas/utils/linkComprobanteToLegal";
import DialogModal from "@/components/ui/DialogModal";

    interface DirectFinancingViewProps {
        expediente: UsuarioActivoResponseDTO;
        cronograma: CronogramaPagoResponse | null;
        pagos: PagoResponse[];
        resumen: CronogramaResumenResponse | null;
        onUpdate: () => void;
    }

    const estadoGlobalStyles: Record<string, { bg: string; text: string; label: string }> = {
        AL_DIA: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "Al día" },
        EN_RIESGO: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", label: "En riesgo" },
        EN_MORA: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", label: "En mora" },
        LIQUIDADO: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Liquidado" },
    };

    interface CronogramaFormData {
        totalPactado: string;
        pagoSeparacion: string;
        pagoInicial: string;
        numeroCuotas: string;
    }

export default function DirectFinancingView({ expediente, cronograma, pagos, resumen, onUpdate }: DirectFinancingViewProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCronogramaForm, setShowCronogramaForm] = useState(!cronograma);
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "info" | "success" | "warning" | "danger";
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    });
    const [cronogramaForm, setCronogramaForm] = useState<CronogramaFormData>({
        totalPactado: cronograma?.totalPactado?.toString() ?? "",
        pagoSeparacion: cronograma?.pagoSeparacion?.toString() ?? "",
        pagoInicial: cronograma?.pagoInicial?.toString() ?? "",
            numeroCuotas: cronograma?.numeroCuotas?.toString() ?? "",
        });
        const [addForm, setAddForm] = useState({ nroCuota: "", montoProgramado: "", fechaVencimiento: "", concepto: "CUOTA" });

        useEffect(() => {
            if (showCronogramaForm && cronograma) {
                setCronogramaForm({
                    totalPactado: cronograma.totalPactado?.toString() ?? "",
                    pagoSeparacion: cronograma.pagoSeparacion?.toString() ?? "",
                    pagoInicial: cronograma.pagoInicial?.toString() ?? "",
                    numeroCuotas: cronograma.numeroCuotas?.toString() ?? "",
                });
            }
        }, [showCronogramaForm, cronograma]);

        useEffect(() => {
            const existing = new Set(pagos.map(p => p.concepto).filter(Boolean));
            const valid = (["CUOTA", "SEPARACION", "INICIAL"] as const).filter(c => c === "CUOTA" || !existing.has(c));
            setAddForm(p => valid.includes(p.concepto as any) ? p : { ...p, concepto: valid[0] ?? "CUOTA" });
        }, [pagos]);

        const [isSaving, setIsSaving] = useState(false);
        const [activeDropzoneId, setActiveDropzoneId] = useState<string | null>(null);
        const [dropzoneComentario, setDropzoneComentario] = useState("");
        const [dropzoneFile, setDropzoneFile] = useState<File | null>(null);
        const [editingId, setEditingId] = useState<string | null>(null);
        const [editForm, setEditForm] = useState({ montoProgramado: "", fechaVencimiento: "" });

        const handleSelectFile = (uuidPago: string, file: File) => {
            setDropzoneFile(file);
        };

        const handleConfirmUpload = async (uuidPago: string, currentEstado: string, concepto?: string) => {
            if (!dropzoneFile) return;
            setUpdatingId(uuidPago);
            const file = dropzoneFile;
            const comentario = dropzoneComentario.trim() || undefined;
            try {
                await uploadPagoComprobante(uuidPago, file, comentario);
                if (currentEstado !== "PAGADO") {
                    await updatePagoEstado(uuidPago, "PAGADO");
                }
                if (concepto === "SEPARACION" || concepto === "INICIAL") {
                    await linkComprobanteToLegal(expediente.uuidUsuarioActivo, concepto, file).catch(() => {});
                }
                setActiveDropzoneId(null);
                setDropzoneComentario("");
                setDropzoneFile(null);
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
                setUpdatingId(null);
            }
        };

        const openDropzone = (uuidPago: string) => {
            setDropzoneFile(null);
            setDropzoneComentario("");
            setActiveDropzoneId(prev => prev === uuidPago ? null : uuidPago);
        };

        const estadoStyle = resumen?.estadoGlobal ? estadoGlobalStyles[resumen.estadoGlobal] : null;

        // ─── Cronograma ───────────────────────────────────────────────────────────

        const handleCreateCronograma = async () => {
            setIsSaving(true);
        try {
            if (cronograma) {
                    await updateCronograma(cronograma.uuidCronograma, {
                        uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                        totalPactado: parseFloat(cronogramaForm.totalPactado),
                        pagoSeparacion: parseFloat(cronogramaForm.pagoSeparacion),
                        pagoInicial: parseFloat(cronogramaForm.pagoInicial),
                        numeroCuotas: parseInt(cronogramaForm.numeroCuotas),
                    });
                } else {
                    await createCronograma({
                        uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                        totalPactado: parseFloat(cronogramaForm.totalPactado),
                        pagoSeparacion: parseFloat(cronogramaForm.pagoSeparacion),
                        pagoInicial: parseFloat(cronogramaForm.pagoInicial),
                        numeroCuotas: parseInt(cronogramaForm.numeroCuotas),
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

        // ─── Pagos ────────────────────────────────────────────────────────────────

        const handleStatusChange = async (uuidPago: string, current: string) => {
            const newStatus = current === "PAGADO" ? "PENDIENTE" : "PAGADO";
            setUpdatingId(uuidPago);
        try {
            await updatePagoEstado(uuidPago, newStatus as any);
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
            setUpdatingId(null);
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

    const handleDeletePago = async (uuidPago: string) => {
        setDialog({
            isOpen: true,
            title: "Eliminar Cuota",
            message: "¿Eliminar esta cuota? Se borrará también el comprobante asociado, si existe.",
            type: "danger",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            onConfirm: async () => {
                setDialog((prev) => ({ ...prev, isOpen: false }));
                setUpdatingId(uuidPago);
                try {
                    await deletePago(uuidPago);
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
                    setUpdatingId(null);
                }
            },
        });
    };

    const startEditingPago = (pago: PagoResponse) => {
        setEditingId(pago.uuidPago);
        setEditForm({
            montoProgramado: pago.montoProgramado.toString(),
            fechaVencimiento: pago.fechaVencimiento,
        });
        setActiveDropzoneId(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ montoProgramado: "", fechaVencimiento: "" });
    };

    const handleSaveEdit = async (uuidPago: string) => {
        setIsSaving(true);
        try {
            await updatePago(uuidPago, {
                nroCuota: pagos.find(p => p.uuidPago === uuidPago)!.nroCuota,
                montoProgramado: parseFloat(editForm.montoProgramado),
                fechaVencimiento: editForm.fechaVencimiento,
            });
            cancelEditing();
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

        const handleAddPago = async () => {
            if (!cronograma) return;
            setIsSaving(true);
            const concepto = addForm.concepto as "CUOTA" | "SEPARACION" | "INICIAL";
            const rawNro = addForm.nroCuota.trim();
            const nroCuota = rawNro !== ""
                ? parseInt(rawNro)
                : concepto === "SEPARACION" ? -1
                : concepto === "INICIAL" ? 0
                : 1;
            try {
                await addPago(cronograma.uuidCronograma, {
                    nroCuota,
                    montoProgramado: parseFloat(addForm.montoProgramado),
                    fechaVencimiento: addForm.fechaVencimiento,
                    concepto,
                });
                setAddForm({ nroCuota: "", montoProgramado: "", fechaVencimiento: "", concepto: "CUOTA" });
                setShowAddForm(false);
                onUpdate();
            } catch (e) {
                alert(e instanceof Error ? e.message : "Error al agregar cuota");
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <div className="space-y-5">
                {/* Resumen de saldos */}
                {resumen && (
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
                )}

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
                {showCronogramaForm ? (
                    <div className="rounded-2xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10 p-6">
                        <h3 className="text-base font-bold text-build-main dark:text-white mb-4">
                            {cronograma ? "Editar" : "Crear"} Cronograma de Pagos
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            {[
                                { key: "totalPactado", label: "Total Pactado (S/)", placeholder: "350000" },
                                { key: "pagoSeparacion", label: "Pago Separación (S/)", placeholder: "1000" },
                                { key: "pagoInicial", label: "Pago Inicial (S/)", placeholder: "50000" },
                                { key: "numeroCuotas", label: "N° de Cuotas", placeholder: "12" },
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
                ) : cronograma && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-build-accent text-[20px]">event_note</span>
                            <div>
                                <p className="text-sm font-bold text-build-main dark:text-white">Cronograma Activo</p>
                                <p className="text-xs text-slate-400">{cronograma.numeroCuotas} cuotas · Estado: {cronograma.estado}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (cronograma) {
                                    setCronogramaForm({
                                        totalPactado: cronograma.totalPactado?.toString() ?? "",
                                        pagoSeparacion: cronograma.pagoSeparacion?.toString() ?? "",
                                        pagoInicial: cronograma.pagoInicial?.toString() ?? "",
                                        numeroCuotas: cronograma.numeroCuotas?.toString() ?? "",
                                    });
                                }
                                setShowCronogramaForm(true);
                            }}
                            className="text-xs font-bold text-build-accent hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                )}

                {/* Tabla de Cuotas */}
                {cronograma && (
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

                        {/* Formulario agregar cuota */}
                        {showAddForm && (
                            <div className="px-6 py-4 bg-build-accent/5 border-b border-build-accent/20">
                                <div className="grid gap-3 md:grid-cols-5 items-end">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">N° Cuota</label>
                                        <input type="number" value={addForm.nroCuota} onChange={(e) => setAddForm((p) => ({ ...p, nroCuota: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                                    </div>
                                    {(() => {
                                        const existingConceptos = new Set(pagos.map(p => p.concepto).filter(Boolean));
                                        const conceptOptions = [
                                            { value: "CUOTA" as const, label: "CUOTA" },
                                            { value: "SEPARACION" as const, label: "SEPARACION" },
                                            { value: "INICIAL" as const, label: "INICIAL" },
                                        ].filter(o => o.value === "CUOTA" || !existingConceptos.has(o.value));
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
                                        <PagoRow
                                            key={pago.uuidPago}
                                            pago={pago}
                                            busy={updatingId === pago.uuidPago}
                                            showDropzone={activeDropzoneId === pago.uuidPago}
                                            isEditing={editingId === pago.uuidPago}
                                            editForm={editForm}
                                            setEditForm={setEditForm}
                                            handleSaveEdit={handleSaveEdit}
                                            cancelEditing={cancelEditing}
                                            startEditingPago={startEditingPago}
                                            handleStatusChange={handleStatusChange}
                                            openDropzone={openDropzone}
                                            handleDownloadVoucher={handleDownloadVoucher}
                                            handleDeletePago={handleDeletePago}
                                            isSaving={isSaving}
                                            dropzoneComentario={dropzoneComentario}
                                            setDropzoneComentario={setDropzoneComentario}
                                            dropzoneFile={dropzoneFile}
                                            handleSelectFile={handleSelectFile}
                                            setActiveDropzoneId={setActiveDropzoneId}
                                            setDropzoneFile={setDropzoneFile}
                                            handleConfirmUpload={handleConfirmUpload}
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
                )}
            </div>
        );
    }

    const getPagoStatusInfo = (pago: PagoResponse) => {
        if (pago.estado === "PAGADO") {
            return {
                bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/20",
                label: "Pagado",
                moraDays: 0,
            };
        }

        // Compare dates without time
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
    };

    interface PagoRowProps {
        pago: PagoResponse;
        busy: boolean;
        showDropzone: boolean;
        isEditing: boolean;
        editForm: { fechaVencimiento: string; montoProgramado: string };
        setEditForm: React.Dispatch<React.SetStateAction<{ fechaVencimiento: string; montoProgramado: string }>>;
        handleSaveEdit: (uuidPago: string) => Promise<void>;
        cancelEditing: () => void;
        startEditingPago: (pago: PagoResponse) => void;
        handleStatusChange: (uuidPago: string, estadoActual: string) => Promise<void>;
        openDropzone: (uuidPago: string) => void;
        handleDownloadVoucher: (uuidComprobante: string) => Promise<void>;
        handleDeletePago: (uuidPago: string) => Promise<void>;
        isSaving: boolean;
        dropzoneComentario: string;
        setDropzoneComentario: (val: string) => void;
        dropzoneFile: File | null;
        handleSelectFile: (uuidPago: string, file: File) => void;
        setActiveDropzoneId: (id: string | null) => void;
        setDropzoneFile: (val: File | null) => void;
        handleConfirmUpload: (uuidPago: string, currentEstado: string, concepto?: string) => Promise<void>;
    }

    function PagoRow({
        pago,
        busy,
        showDropzone,
        isEditing,
        editForm,
        setEditForm,
        handleSaveEdit,
        cancelEditing,
        startEditingPago,
        handleStatusChange,
        openDropzone,
        handleDownloadVoucher,
        handleDeletePago,
        isSaving,
        dropzoneComentario,
        setDropzoneComentario,
        dropzoneFile,
        handleSelectFile,
        setActiveDropzoneId,
        setDropzoneFile,
        handleConfirmUpload,
    }: PagoRowProps) {
        const statusInfo = getPagoStatusInfo(pago);
        return (
            <React.Fragment key={pago.uuidPago}>
                <tr className={`transition-colors ${busy ? "opacity-60" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}>
                    <td className="px-6 py-3 font-bold text-build-main dark:text-white text-sm">
                        {pago.concepto === "SEPARACION" || pago.concepto === "INICIAL" ? <span className="text-slate-300 dark:text-white/20">—</span> : pago.nroCuota}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-white/50">
                        {pago.concepto ?? (pago.nroCuota === -1 ? "SEPARACION" : pago.nroCuota === 0 ? "INICIAL" : "CUOTA")}
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
                                        onClick={() => handleSaveEdit(pago.uuidPago)}
                                        className="p-1.5 rounded-lg bg-build-accent text-white hover:bg-build-accent/80 transition-colors"
                                        title="Guardar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                    </button>
                                    <button
                                        disabled={isSaving}
                                        onClick={cancelEditing}
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
                                        disabled={busy}
                                        onClick={() => startEditingPago(pago)}
                                        title="Editar cuota"
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-slate-400 hover:text-build-accent">edit</span>
                                    </button>

                                    {/* Toggle estado */}
                                    <button
                                        disabled={busy}
                                        onClick={() => handleStatusChange(pago.uuidPago, pago.estado)}
                                        title={pago.estado === "PAGADO" ? "Marcar Pendiente" : "Marcar Pagado"}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${pago.estado === "PAGADO" ? "text-green-500" : "text-slate-300 dark:text-white/30"}`}>
                                            {pago.estado === "PAGADO" ? "check_circle" : "radio_button_unchecked"}
                                        </span>
                                    </button>

                                    {/* Subir comprobante */}
                                    <button
                                        disabled={busy}
                                        onClick={() => openDropzone(pago.uuidPago)}
                                        title="Subir comprobante"
                                        className={`p-1.5 rounded-lg transition-colors ${showDropzone ? "bg-build-accent/15 text-build-accent" : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-build-accent"}`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                    </button>

                                    {/* Descargar comprobante */}
                                    {pago.uuidComprobante && (
                                        <button
                                            title="Descargar comprobante"
                                            onClick={() => handleDownloadVoucher(pago.uuidComprobante!)}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-build-main dark:text-white/70">download</span>
                                        </button>
                                    )}

                                    {/* Eliminar */}
                                    <button
                                        title="Eliminar cuota"
                                        disabled={busy}
                                        onClick={() => handleDeletePago(pago.uuidPago)}
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
                    <tr key={`${pago.uuidPago}-dropzone`}>
                        <td colSpan={6} className="bg-slate-50/50 dark:bg-white/[0.01] px-6 py-4">
                            <div 
                                className="border-2 border-dashed border-build-accent/40 rounded-xl p-4 bg-white dark:bg-white/5 transition flex flex-col gap-3"
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) handleSelectFile(pago.uuidPago, file);
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
                                            if (file) handleSelectFile(pago.uuidPago, file);
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
                                        onClick={(e) => { e.stopPropagation(); setActiveDropzoneId(null); setDropzoneFile(null); setDropzoneComentario(""); }}
                                        className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={!dropzoneFile || isSaving}
                                        onClick={(e) => { e.stopPropagation(); handleConfirmUpload(pago.uuidPago, pago.estado, pago.concepto); }}
                                        className="bg-build-main text-white px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-build-main/80 transition-all disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                                        {isSaving ? "Subiendo…" : "Subir"}
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    }
