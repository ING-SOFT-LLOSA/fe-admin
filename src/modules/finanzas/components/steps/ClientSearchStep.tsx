"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUsuariosPaginado } from "@/lib/api/users";
import type { Usuario } from "@/types/user";

interface ClientSearchStepProps {
    onSelectClient: (client: Usuario) => void;
}

function useDebounce(value: string, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

function getInitials(nombre: string, apellidos?: string) {
    const a = nombre.trim().charAt(0).toUpperCase();
    const b = (apellidos?.trim().charAt(0) ?? "").toUpperCase();
    return `${a}${b}`;
}

export default function ClientSearchStep({ onSelectClient }: ClientSearchStepProps) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [clients, setClients] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (q: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const page = await fetchUsuariosPaginado(0, 20, q);
            setClients(page.content.filter((u) => u.tipoUsuario === "CLIENTE"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al buscar clientes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => {
            void search(debouncedQuery);
        });
    }, [debouncedQuery, search]);

    return (
        <div className="space-y-6">
            {/* Header del paso */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-arch-gold/15 border border-arch-gold/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-arch-gold">1</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-build-main dark:text-white">Buscar Cliente</h3>
                    <p className="text-sm text-slate-500 dark:text-white/50">Ingresa el nombre o DNI del cliente para comenzar</p>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                    search
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre completo, DNI o correo electrónico…"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-11 pr-4 py-3 text-sm text-build-main dark:text-white placeholder-slate-400 outline-none focus:border-build-accent focus:ring-2 focus:ring-build-accent/20 transition-all"
                />
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-build-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Lista de resultados */}
            <div className="space-y-2">
                {clients.length === 0 && !isLoading && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-white/20 mb-2 block">
                            person_search
                        </span>
                        <p className="text-sm text-slate-400 dark:text-white/40">
                            {query ? "Sin resultados para tu búsqueda" : "Escribe el nombre del cliente para buscar"}
                        </p>
                    </div>
                )}

                {clients.map((client) => (
                    <button
                        key={client.id}
                        onClick={() => onSelectClient(client)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-build-accent hover:bg-build-accent/5 dark:hover:bg-build-accent/10 transition-all group cursor-pointer text-left"
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-build-main dark:bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-build-accent transition-colors">
                            <span className="text-sm font-bold text-white">
                                {getInitials(client.nombre, client.apellidos)}
                            </span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-build-main dark:text-white truncate">
                                {[client.nombre, client.apellidos].filter(Boolean).join(" ")}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-white/40 truncate">
                                {client.documentoIdentidad ? `DNI: ${client.documentoIdentidad}` : ""} {client.email}
                            </p>
                        </div>
                        {/* Indicador activo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {client.activo ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Activo
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40">
                                    Inactivo
                                </span>
                            )}
                            <span className="material-symbols-outlined text-slate-300 dark:text-white/20 group-hover:text-arch-gold transition-colors text-[18px]">
                                chevron_right
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
