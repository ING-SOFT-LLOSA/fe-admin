"use client";

import { useState, useEffect } from "react";
import { fetchExpedientesPorUsuario } from "@/lib/api/users";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { Usuario } from "@/types/user";

interface ContractSelectionStepProps {
    client: Usuario;
    onSelectContract: (expediente: UsuarioActivoResponseDTO) => void;
    onBack: () => void;
}

const financeTypeColor: Record<string, string> = {
    "Crédito Directo": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Crédito Hipotecario": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const phaseLabel: Record<string, string> = {
    SEPARACION: "Separación",
    CONTRATO: "Contrato",
    PAGO: "Pago",
    ENTREGA: "Entrega",
    SANEAMIENTO: "Saneamiento",
};

function getInitials(nombre: string, apellidos?: string) {
    const a = nombre.trim().charAt(0).toUpperCase();
    const b = (apellidos?.trim().charAt(0) ?? "").toUpperCase();
    return `${a}${b}`;
}

export default function ContractSelectionStep({ client, onSelectContract, onBack }: ContractSelectionStepProps) {
    const [expedientes, setExpedientes] = useState<UsuarioActivoResponseDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchExpedientesPorUsuario(client.id);
                if (mounted) setExpedientes(data);
            } catch (err) {
                if (mounted) setError(err instanceof Error ? err.message : "Error al cargar contratos");
            } finally {
                if (mounted) setIsLoading(false);
            }
        }
        void load();
        return () => { mounted = false; };
    }, [client.id]);

    return (
        <div className="space-y-6">
            {/* Header del paso */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-build-accent/15 border border-build-accent/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-build-accent">2</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-build-main dark:text-white">Seleccionar Contrato</h3>
                    <p className="text-sm text-slate-500 dark:text-white/50">Elige el contrato / unidad del cliente</p>
                </div>
            </div>

            {/* Tarjeta del cliente seleccionado */}
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10">
                <div className="w-12 h-12 rounded-full bg-build-main flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-white">
                        {getInitials(client.nombre, client.apellidos)}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-build-main dark:text-white truncate">
                        {[client.nombre, client.apellidos].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/40 truncate">
                        {client.documentoIdentidad ? `DNI ${client.documentoIdentidad} · ` : ""}{client.email}
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-build-accent transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Cambiar
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Contratos */}
            {isLoading ? (
                <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-build-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Cargando contratos…</p>
                </div>
            ) : expedientes.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-white/20 mb-2 block">folder_off</span>
                    <p className="text-sm text-slate-400 dark:text-white/40">Este cliente no tiene contratos activos.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                        {expedientes.length} contrato{expedientes.length !== 1 ? "s" : ""} encontrado{expedientes.length !== 1 ? "s" : ""}
                    </p>
                    {expedientes.map((exp) => {
                        const activo = exp.activo;
                        const colorClass = financeTypeColor[exp.tipoFinanciamiento] ?? "bg-slate-100 text-slate-600";
                        return (
                            <button
                                key={exp.uuidUsuarioActivo}
                                onClick={() => onSelectContract(exp)}
                                className="w-full text-left p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-build-accent hover:shadow-md dark:hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-build-bg dark:bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-build-accent/10 transition-colors">
                                            <span className="material-symbols-outlined text-build-main dark:text-white text-[22px]">apartment</span>
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-build-main dark:text-white">
                                                {activo ? `Unidad ${activo.nro} — ${activo.proyectoNombre}` : `Expediente ${exp.uuidUsuarioActivo.slice(-6).toUpperCase()}`}
                                            </p>
                                            {activo && (
                                                <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                                                    {activo.torreNombre ? `${activo.torreNombre} · ` : ""}Piso {activo.nroPiso} · {activo.areaM2} m²
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 dark:text-white/20 group-hover:text-build-accent transition-colors text-[20px] flex-shrink-0 mt-1">
                                        chevron_right
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-3 pl-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colorClass}`}>
                                        {exp.tipoFinanciamiento}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60">
                                        {exp.faseComercial ? (phaseLabel[exp.faseComercial] ?? exp.faseComercial) : "—"}
                                    </span>
                                    {activo && (
                                        <span className="text-[11px] text-slate-400 dark:text-white/40 ml-auto">
                                            S/ {activo.precio?.toLocaleString("es-PE") ?? "—"}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
