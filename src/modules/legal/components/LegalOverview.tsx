"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";

export default function LegalOverview() {
  const router = useRouter();
  const [clients, setClients] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const users = await fetchUsuarios();
        if (mounted) setClients(users.filter((u) => u.tipoUsuario === "CLIENTE"));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudieron cargar los clientes.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const filtered = clients.filter((c) => {
    const name = [c.nombre, c.apellidos].filter(Boolean).join(" ").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || c.email.toLowerCase().includes(q) || (c.documentoIdentidad ?? "").toLowerCase().includes(q);
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-build-main dark:text-white md:text-3xl">
            Gestión Legal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Expedientes, contratos, minutas, actas y proceso legal por cliente.
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-white/30">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar cliente, DNI o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-9 pr-4 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              {["Cliente", "DNI / CE", "Correo electrónico", "Estado legal", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Cargando expedientes...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-white/40">
                  {search ? `Sin resultados para "${search}"` : "No hay clientes registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => {
                const fullName = [client.nombre, client.apellidos].filter(Boolean).join(" ");
                const initials = fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

                return (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/clientes/${client.id}/expediente`)}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-build-main/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-build-main dark:text-white">{initials}</span>
                        </div>
                        <span className="text-sm font-bold text-build-main dark:text-white group-hover:text-build-accent transition-colors">
                          {fullName}
                        </span>
                      </div>
                    </td>
                    {/* DNI */}
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-white/60">
                      {client.documentoIdentidad || "—"}
                    </td>
                    {/* Correo */}
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-white/60">
                      {client.email}
                    </td>
                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[12px]">pending</span>
                        Por iniciar
                      </span>
                    </td>
                    {/* Action hint */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-build-accent">Ver expediente</span>
                        <span className="material-symbols-outlined text-[16px] text-build-accent">arrow_forward</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-400 dark:text-white/30">
              {filtered.length} expediente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}