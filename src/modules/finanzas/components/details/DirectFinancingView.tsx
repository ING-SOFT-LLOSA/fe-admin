import React, { useState } from "react";
import type { PagoResponse, CronogramaPagoResponse, CronogramaResumenResponse } from "@/modules/finanzas/types";
import type { CartaAprobacionResponse } from "@/modules/finanzas/types";
import InstallmentStatusBadge from "../details/InstallmentStatusBadge";
import { updatePagoEstado, uploadPagoComprobante, addPago, deletePago, createCronograma, updateCronograma } from "@/lib/api/finanzas";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import { fetchSignedUrl } from "@/lib/api/documents";

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
    cuotaInicial: string;
    numeroCuotas: string;
}

export default function DirectFinancingView({ expediente, cronograma, pagos, resumen, onUpdate }: DirectFinancingViewProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCronogramaForm, setShowCronogramaForm] = useState(!cronograma);
    const [cronogramaForm, setCronogramaForm] = useState<CronogramaFormData>({
        totalPactado: cronograma?.totalPactado?.toString() ?? "",
        cuotaInicial: cronograma?.cuotaInicial?.toString() ?? "",
        numeroCuotas: cronograma?.numeroCuotas?.toString() ?? "",
    });
    const [addForm, setAddForm] = useState({ nroCuota: "", montoProgramado: "", fechaVencimiento: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [activeDropzoneId, setActiveDropzoneId] = useState<string | null>(null);

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

    const handleFastPayment = async (uuidPago: string, file: File) => {
        setUpdatingId(uuidPago);
        setActiveDropzoneId(null);
        try {
            await uploadPagoComprobante(uuidPago, file);
            await updatePagoEstado(uuidPago, "PAGADO");
            onUpdate();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al registrar el cobro rápido");
        } finally {
            setUpdatingId(null);
        }
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
                    cuotaInicial: parseFloat(cronogramaForm.cuotaInicial),
                    numeroCuotas: parseInt(cronogramaForm.numeroCuotas),
                });
            } else {
                await createCronograma({
                    uuidUsuarioActivo: expediente.uuidUsuarioActivo,
                    totalPactado: parseFloat(cronogramaForm.totalPactado),
                    cuotaInicial: parseFloat(cronogramaForm.cuotaInicial),
                    numeroCuotas: parseInt(cronogramaForm.numeroCuotas),
                });
            }
            setShowCronogramaForm(false);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al guardar cronograma");
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
            alert(e instanceof Error ? e.message : "Error al actualizar estado");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFileUpload = async (uuidPago: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUpdatingId(uuidPago);
        try {
            await uploadPagoComprobante(uuidPago, file);
            onUpdate();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al subir comprobante");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDownloadVoucher = async (uuidComprobante: string) => {
        try {
            const { url } = await fetchSignedUrl(uuidComprobante);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {
            alert("No se pudo obtener el enlace del comprobante.");
        }
    };

    const handleDeletePago = async (uuidPago: string) => {
        if (!confirm("¿Eliminar esta cuota?")) return;
        setUpdatingId(uuidPago);
        try {
            await deletePago(uuidPago);
            onUpdate();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Error al eliminar cuota");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddPago = async () => {
        if (!cronograma) return;
        setIsSaving(true);
        try {
            await addPago(cronograma.uuidCronograma, {
                nroCuota: parseInt(addForm.nroCuota),
                montoProgramado: parseFloat(addForm.montoProgramado),
                fechaVencimiento: addForm.fechaVencimiento,
            });
            setAddForm({ nroCuota: "", montoProgramado: "", fechaVencimiento: "" });
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

            {/* Cronograma — Configuración */}
            {showCronogramaForm ? (
                <div className="rounded-2xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10 p-6">
                    <h3 className="text-base font-bold text-build-main dark:text-white mb-4">
                        {cronograma ? "Editar" : "Crear"} Cronograma de Pagos
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { key: "totalPactado", label: "Total Pactado (S/)", placeholder: "350000" },
                            { key: "cuotaInicial", label: "Cuota Inicial (S/)", placeholder: "50000" },
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
                        onClick={() => setShowCronogramaForm(true)}
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
                            <div className="grid gap-3 md:grid-cols-4 items-end">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">N° Cuota</label>
                                    <input type="number" value={addForm.nroCuota} onChange={(e) => setAddForm((p) => ({ ...p, nroCuota: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent" />
                                </div>
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
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vencimiento</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Monto</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Pagado</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {pagos.sort((a, b) => a.nroCuota - b.nroCuota).map((pago) => {
                                    const busy = updatingId === pago.uuidPago;
                                    const showDropzone = activeDropzoneId === pago.uuidPago;
                                    const statusInfo = getPagoStatusInfo(pago);
                                    return (
                                        <React.Fragment key={pago.uuidPago}>
                                            <tr className={`transition-colors ${busy ? "opacity-60" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}>
                                                <td className="px-6 py-3 font-bold text-build-main dark:text-white text-sm">
                                                    {pago.nroCuota === 0 ? <span className="text-build-accent">Inicial</span> : pago.nroCuota}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-white/60">
                                                    {new Date(pago.fechaVencimiento).toLocaleDateString("es-PE")}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-build-main dark:text-white">
                                                    S/ {pago.montoProgramado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-white/50">
                                                    S/ {pago.montoPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
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

                                                        {/* Cobro Rápido (Dropzone Toggle) */}
                                                        {pago.estado !== "PAGADO" && (
                                                            <button
                                                                disabled={busy}
                                                                onClick={() => setActiveDropzoneId(showDropzone ? null : pago.uuidPago)}
                                                                title="Registrar Cobro Rápido"
                                                                className={`p-1.5 rounded-lg transition-colors ${showDropzone ? "bg-build-accent/15 text-build-accent" : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-build-accent"}`}
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                                            </button>
                                                        )}

                                                        {/* Subir comprobante — solo si está PAGADO */}
                                                        {pago.estado === "PAGADO" && (
                                                            <label title="Subir comprobante" className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                                <span className="material-symbols-outlined text-[18px] text-build-accent">upload_file</span>
                                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(pago.uuidPago, e)} accept="application/pdf,image/*" />
                                                            </label>
                                                        )}

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
                                                        {pago.estado !== "PAGADO" && (
                                                            <button
                                                                title="Eliminar cuota"
                                                                disabled={busy}
                                                                onClick={() => handleDeletePago(pago.uuidPago)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-white/20 hover:text-red-500">delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {showDropzone && (
                                                <tr key={`${pago.uuidPago}-dropzone`}>
                                                    <td colSpan={6} className="bg-slate-50/50 dark:bg-white/[0.01] px-6 py-4">
                                                        <div 
                                                            className="border-2 border-dashed border-build-accent/40 hover:border-build-accent rounded-xl p-4 text-center cursor-pointer bg-white dark:bg-white/5 transition flex flex-col items-center justify-center gap-1.5"
                                                            onClick={() => document.getElementById(`file-input-${pago.uuidPago}`)?.click()}
                                                            onDragOver={(e) => { e.preventDefault(); }}
                                                            onDrop={async (e) => {
                                                                e.preventDefault();
                                                                const file = e.dataTransfer.files?.[0];
                                                                if (file) handleFastPayment(pago.uuidPago, file);
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined text-build-accent text-[28px] animate-bounce">upload_file</span>
                                                            <p className="text-xs font-bold text-slate-600 dark:text-white/80">Arrastra el comprobante de pago o haz clic para subir</p>
                                                            <p className="text-[10px] text-slate-400">PDF, JPG, PNG (máx 10MB)</p>
                                                            <input
                                                                type="file"
                                                                id={`file-input-${pago.uuidPago}`}
                                                                className="hidden"
                                                                accept="application/pdf,image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleFastPayment(pago.uuidPago, file);
                                                                }}
                                                            />
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveDropzoneId(null); }}
                                                                className="mt-1 text-[11px] font-bold text-slate-400 hover:text-red-500"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
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
