"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";

export default function LegalOverview() {
  const [clients, setClients] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadClients() {
      setIsLoading(true);
      setError("");
      try {
        const users = await fetchUsuarios();
        if (mounted) setClients(users.filter((user) => user.tipoUsuario === "CLIENTE"));
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadClients();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-build-main dark:text-white md:text-3xl">
          Gestión Legal
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
          Expedientes, contratos, minutas, actas y documentos visibles para cliente.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              {["Cliente", "Documento", "Correo", "Pipeline legal", "Acción"].map((header) => (
                <th key={header} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                  Cargando expedientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                  No hay clientes registrados para expediente legal.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:bg-white/5">
                  <td className="px-5 py-4 text-sm font-bold text-build-main dark:text-white">
                    {[client.nombre, client.apellidos].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-white/70">{client.documentoIdentidad || "-"}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-white/70">{client.email}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-white/70">
                    Pendiente de endpoint de expedientes
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/clientes/${client.id}/expediente`}
                      className="inline-flex items-center gap-2 rounded-lg bg-build-main px-3 py-2 text-xs font-bold text-white hover:bg-build-main/90"
                    >
                      <span className="material-symbols-outlined text-[16px]">balance</span>
                      Abrir expediente
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
