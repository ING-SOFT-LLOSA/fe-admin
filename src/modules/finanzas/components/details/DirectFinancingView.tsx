import React, { useState, useEffect, useId } from "react";
import type { PagoResponse, CronogramaPagoResponse, CronogramaResumenResponse } from "@/modules/finanzas/types";
import { updatePagoEstado, uploadPagoComprobante, addPago, deletePago, updatePago, createCronograma, updateCronograma } from "@/lib/api/finanzas";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import { fetchSignedUrl } from "@/lib/api/documents";
import { linkComprobanteToLegal } from "@/modules/finanzas/utils/linkComprobanteToLegal";
import DialogModal from "@/components/ui/DialogModal";
import DatePickerInput, { validateFutureDate } from "@/components/ui/DatePickerInput";
import { getPagoStatusInfo, getConceptoLabel, isSpecialConcepto } from "@/modules/finanzas/utils/paymentHelpers";
import ResumenSaldosCard from "@/modules/finanzas/components/details/ResumenSaldosCard";

    interface DirectFinancingViewProps {
        readonly expediente: UsuarioActivoResponseDTO;
        readonly cronograma: CronogramaPagoResponse | null;
        readonly pagos: PagoResponse[];
        readonly resumen: CronogramaResumenResponse | null;
        readonly onUpdate: () => void;
    }

    interface CronogramaFormData {
        totalPactado: string;
        pagoSeparacion: string;
        pagoInicial: string;
        numeroCuotas: string;
    }

export default function DirectFinancingView({ expediente, cronograma, pagos, resumen, onUpdate }: Readonly<DirectFinancingViewProps>) {
    const nroCuotaId = useId();
    const conceptoId = useId();
    const montoId = useId();

    const cronogramaIds = {
        totalPactado: useId(),
        pagoSeparacion: useId(),
        pagoInicial: useId(),
        numeroCuotas: useId(),
    };

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
                Promise.resolve().then(() => {
                    setCronogramaForm({
                        totalPactado: cronograma.totalPactado?.toString() ?? "",
                        pagoSeparacion: cronograma.pagoSeparacion?.toString() ?? "",
                        pagoInicial: cronograma.pagoInicial?.toString() ?? "",
                        numeroCuotas: cronograma.numeroCuotas?.toString() ?? "",
                    });
                });
            }
        }, [showCronogramaForm, cronograma]);

        useEffect(() => {
            const existing = new Set(pagos.map(p => p.concepto).filter(Boolean));
            const valid = (["CUOTA", "SEPARACION", "INICIAL"] as const).filter(c => c === "CUOTA" || !existing.has(c));
            Promise.resolve().then(() => {
                setAddForm(p => valid.includes(p.concepto as "CUOTA" | "SEPARACION" | "INICIAL") ? p : { ...p, concepto: valid[0] ?? "CUOTA" });
            });
        }, [pagos]);

        const [isSaving, setIsSaving] = useState(false);
        const [activeDropzoneId, setActiveDropzoneId] = useState<string | null>(null);
        const [dropzoneComentario, setDropzoneComentario] = useState("");
        const [dropzoneFile, setDropzoneFile] = useState<File | null>(null);
        const [editingId, setEditingId] = useState<string | null>(null);
        const [editForm, setEditForm] = useState({ montoProgramado: "", fechaVencimiento: "" });
        const [addDateError, setAddDateError] = useState<string | null>(null);
        const [editDateError, setEditDateError] = useState<string | null>(null);

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

        // ─── Cronograma ───────────────────────────────────────────────────────────

        const handleCreateCronograma = async () => {
            setIsSaving(true);
        try {
            if (cronograma) {
                    await updateCronograma(cronograma.uuidCronograma, {
                        uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                        totalPactado: Number.parseFloat(cronogramaForm.totalPactado),
                        pagoSeparacion: Number.parseFloat(cronogramaForm.pagoSeparacion),
                        pagoInicial: Number.parseFloat(cronogramaForm.pagoInicial),
                        numeroCuotas: Number.parseInt(cronogramaForm.numeroCuotas, 10),
                    });
                } else {
                    await createCronograma({
                        uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                        totalPactado: Number.parseFloat(cronogramaForm.totalPactado),
                        pagoSeparacion: Number.parseFloat(cronogramaForm.pagoSeparacion),
                        pagoInicial: Number.parseFloat(cronogramaForm.pagoInicial),
                        numeroCuotas: Number.parseInt(cronogramaForm.numeroCuotas, 10),
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
            await updatePagoEstado(uuidPago, newStatus as PagoResponse["estado"]);
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
        setEditDateError(null);
    };

    const handleSaveEdit = async (uuidPago: string) => {
        // Validar fecha antes de llamar al backend
        const dateErr = validateFutureDate(editForm.fechaVencimiento);
        if (dateErr) {
            setEditDateError(dateErr);
            return;
        }
        setEditDateError(null);
        setIsSaving(true);
        try {
            await updatePago(uuidPago, {
                nroCuota: pagos.find(p => p.uuidPago === uuidPago)!.nroCuota,
                montoProgramado: Number.parseFloat(editForm.montoProgramado),
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
            // Validar fecha antes de llamar al backend
            const dateErr = validateFutureDate(addForm.fechaVencimiento);
            if (dateErr) {
                setAddDateError(dateErr);
                return;
            }
            setAddDateError(null);
            setIsSaving(true);
            const concepto = addForm.concepto as "CUOTA" | "SEPARACION" | "INICIAL";
            const rawNro = addForm.nroCuota.trim();
            let nroCuota;
            if (rawNro === "") {
                if (concepto === "SEPARACION") {
                    nroCuota = -1;
                } else if (concepto === "INICIAL") {
                    nroCuota = 0;
                } else {
                    nroCuota = 1;
                }
            } else {
                nroCuota = Number.parseInt(rawNro, 10);
            }
            try {
                await addPago(cronograma.uuidCronograma, {
                    nroCuota,
                    montoProgramado: Number.parseFloat(addForm.montoProgramado),
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
                            ].map(({ key, label, placeholder }) => {
                                const inputId = cronogramaIds[key as keyof typeof cronogramaIds];
                                return (
                                    <div key={key}>
                                        <label htmlFor={inputId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-1.5">{label}</label>
                                        <input
                                            id={inputId}
                                            type="number"
                                            value={cronogramaForm[key as keyof CronogramaFormData]}
                                            onChange={(e) => setCronogramaForm((p) => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-2 focus:ring-build-accent/20"
                                        />
                                    </div>
                                );
                            })}
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
                                {" "}Agregar Cuota
                            </button>
                        </div>

                        {/* Formulario agregar cuota */}
                        {showAddForm && (
                            <div className="px-6 py-4 bg-build-accent/5 border-b border-build-accent/20">
                                <div className="grid gap-3 md:grid-cols-5 items-end">
                                    <div>
                                        <label htmlFor={nroCuotaId} className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">N° Cuota</label>
                                        <input id={nroCuotaId} type="number" value={addForm.nroCuota} onChange={(e) => setAddForm((p) => ({ ...p, nroCuota: e.target.value }))}
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
                                                <label htmlFor={conceptoId} className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Concepto</label>
                                                <select id={conceptoId} value={addForm.concepto} onChange={(e) => setAddForm((p) => ({ ...p, concepto: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent">
                                                    {conceptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <label htmlFor={montoId} className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monto (S/)</label>
                                        <input id={montoId} type="number" value={addForm.montoProgramado} onChange={(e) => setAddForm((p) => ({ ...p, montoProgramado: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                                    </div>
                                    <DatePickerInput
                                        label="Vencimiento"
                                        value={addForm.fechaVencimiento}
                                        onChange={(v) => { setAddForm((p) => ({ ...p, fechaVencimiento: v })); setAddDateError(null); }}
                                        error={addDateError ?? undefined}
                                        size="sm"
                                    />
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
                                    {[...pagos].sort((a, b) => a.nroCuota - b.nroCuota).map((pago) => (
                                        <PagoRow
                                            key={pago.uuidPago}
                                            pago={pago}
                                            busy={updatingId === pago.uuidPago}
                                            showDropzone={activeDropzoneId === pago.uuidPago}
                                            isEditing={editingId === pago.uuidPago}
                                            editForm={editForm}
                                            editDateError={editingId === pago.uuidPago ? editDateError : null}
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
                                    Sin cuotas registradas. Usa &quot;+ Agregar Cuota&quot; para comenzar.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

/* ── Sub-component: action buttons for a pago row ── */

interface PagoActionsProps {
    readonly pago: PagoResponse;
    readonly busy: boolean;
    readonly showDropzone: boolean;
    readonly isEditing: boolean;
    readonly isSaving: boolean;
    readonly handleSaveEdit: (uuidPago: string) => Promise<void>;
    readonly cancelEditing: () => void;
    readonly startEditingPago: (pago: PagoResponse) => void;
    readonly handleStatusChange: (uuidPago: string, estadoActual: string) => Promise<void>;
    readonly openDropzone: (uuidPago: string) => void;
    readonly handleDownloadVoucher: (uuidComprobante: string) => Promise<void>;
    readonly handleDeletePago: (uuidPago: string) => Promise<void>;
}

function PagoActions({
    pago, busy, showDropzone, isEditing, isSaving,
    handleSaveEdit, cancelEditing, startEditingPago,
    handleStatusChange, openDropzone, handleDownloadVoucher, handleDeletePago,
}: Readonly<PagoActionsProps>) {
    if (isEditing) {
        return (
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
        );
    }

    const isPagado = pago.estado === "PAGADO";
    const dropzoneClass = showDropzone
        ? "bg-build-accent/15 text-build-accent"
        : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-build-accent";

    return (
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
                title={isPagado ? "Marcar Pendiente" : "Marcar Pagado"}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
                <span className={`material-symbols-outlined text-[18px] ${isPagado ? "text-green-500" : "text-slate-300 dark:text-white/30"}`}>
                    {isPagado ? "check_circle" : "radio_button_unchecked"}
                </span>
            </button>

            {/* Subir comprobante */}
            <button
                disabled={busy}
                onClick={() => openDropzone(pago.uuidPago)}
                title="Subir comprobante"
                className={`p-1.5 rounded-lg transition-colors ${dropzoneClass}`}
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
    );
}

/* ── Sub-component: file upload dropzone ── */

interface PagoDropzoneProps {
    readonly uuidPago: string;
    readonly estado: string;
    readonly concepto?: string;
    readonly isSaving: boolean;
    readonly dropzoneComentario: string;
    readonly setDropzoneComentario: (val: string) => void;
    readonly dropzoneFile: File | null;
    readonly handleSelectFile: (uuidPago: string, file: File) => void;
    readonly setActiveDropzoneId: (id: string | null) => void;
    readonly setDropzoneFile: (val: File | null) => void;
    readonly handleConfirmUpload: (uuidPago: string, currentEstado: string, concepto?: string) => Promise<void>;
}

function PagoDropzone({
    uuidPago, estado, concepto, isSaving,
    dropzoneComentario, setDropzoneComentario,
    dropzoneFile, handleSelectFile,
    setActiveDropzoneId, setDropzoneFile, handleConfirmUpload,
}: Readonly<PagoDropzoneProps>) {
    return (
        <tr key={`${uuidPago}-dropzone`}>
            <td colSpan={6} className="bg-slate-50/50 dark:bg-white/[0.01] px-6 py-4">
                <section
                    aria-label="Subir comprobante"
                    className="border-2 border-dashed border-build-accent/40 rounded-xl p-4 bg-white dark:bg-white/5 transition flex flex-col gap-3"
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleSelectFile(uuidPago, file);
                    }}
                >
                    <button
                        type="button"
                        className="w-full text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-transparent border-0 outline-none"
                        onClick={() => document.getElementById(`file-input-${uuidPago}`)?.click()}
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
                    </button>
                    <input
                        type="file"
                        id={`file-input-${uuidPago}`}
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSelectFile(uuidPago, file);
                        }}
                    />
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
                            onClick={(e) => { e.stopPropagation(); handleConfirmUpload(uuidPago, estado, concepto); }}
                            className="bg-build-main text-white px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-build-main/80 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                            {isSaving ? "Subiendo…" : "Subir"}
                        </button>
                    </div>
                </section>
            </td>
        </tr>
    );
}

/* ── Main pago row component ── */

interface PagoRowProps {
    readonly pago: PagoResponse;
    readonly busy: boolean;
    readonly showDropzone: boolean;
    readonly isEditing: boolean;
    readonly editForm: { readonly fechaVencimiento: string; readonly montoProgramado: string };
    readonly editDateError: string | null;
    readonly setEditForm: React.Dispatch<React.SetStateAction<{ fechaVencimiento: string; montoProgramado: string }>>;
    readonly handleSaveEdit: (uuidPago: string) => Promise<void>;
    readonly cancelEditing: () => void;
    readonly startEditingPago: (pago: PagoResponse) => void;
    readonly handleStatusChange: (uuidPago: string, estadoActual: string) => Promise<void>;
    readonly openDropzone: (uuidPago: string) => void;
    readonly handleDownloadVoucher: (uuidComprobante: string) => Promise<void>;
    readonly handleDeletePago: (uuidPago: string) => Promise<void>;
    readonly isSaving: boolean;
    readonly dropzoneComentario: string;
    readonly setDropzoneComentario: (val: string) => void;
    readonly dropzoneFile: File | null;
    readonly handleSelectFile: (uuidPago: string, file: File) => void;
    readonly setActiveDropzoneId: (id: string | null) => void;
    readonly setDropzoneFile: (val: File | null) => void;
    readonly handleConfirmUpload: (uuidPago: string, currentEstado: string, concepto?: string) => Promise<void>;
}

function PagoRow({
    pago, busy, showDropzone, isEditing, editForm, editDateError, setEditForm,
    handleSaveEdit, cancelEditing, startEditingPago,
    handleStatusChange, openDropzone, handleDownloadVoucher, handleDeletePago,
    isSaving, dropzoneComentario, setDropzoneComentario,
    dropzoneFile, handleSelectFile, setActiveDropzoneId, setDropzoneFile, handleConfirmUpload,
}: Readonly<PagoRowProps>) {
    const statusInfo = getPagoStatusInfo(pago);
    return (
        <React.Fragment key={pago.uuidPago}>
            <tr className={`transition-colors ${busy ? "opacity-60" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}>
                <td className="px-6 py-3 font-bold text-build-main dark:text-white text-sm">
                    {isSpecialConcepto(pago) ? <span className="text-slate-300 dark:text-white/20">—</span> : pago.nroCuota}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-white/50">
                    {getConceptoLabel(pago)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-white/60">
                    {isEditing ? (
                        <DatePickerInput
                            value={editForm.fechaVencimiento}
                            onChange={(v) => setEditForm(p => ({ ...p, fechaVencimiento: v }))}
                            error={editDateError ?? undefined}
                            size="sm"
                        />
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
                        <PagoActions
                            pago={pago} busy={busy} showDropzone={showDropzone}
                            isEditing={isEditing} isSaving={isSaving}
                            handleSaveEdit={handleSaveEdit} cancelEditing={cancelEditing}
                            startEditingPago={startEditingPago} handleStatusChange={handleStatusChange}
                            openDropzone={openDropzone} handleDownloadVoucher={handleDownloadVoucher}
                            handleDeletePago={handleDeletePago}
                        />
                    </div>
                </td>
            </tr>
            {showDropzone && (
                <PagoDropzone
                    uuidPago={pago.uuidPago} estado={pago.estado} concepto={pago.concepto}
                    isSaving={isSaving}
                    dropzoneComentario={dropzoneComentario} setDropzoneComentario={setDropzoneComentario}
                    dropzoneFile={dropzoneFile} handleSelectFile={handleSelectFile}
                    setActiveDropzoneId={setActiveDropzoneId} setDropzoneFile={setDropzoneFile}
                    handleConfirmUpload={handleConfirmUpload}
                />
            )}
        </React.Fragment>
    );
}

