"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";

type ClientExpedienteViewProps = {
  clientId: number;
};

const LEGAL_SECTIONS = [
  "Contratos",
  "Minutas",
  "Actas",
  "Documentos visibles para cliente",
  "Validación de acceso documental",
];

export default function ClientExpedienteView({ clientId }: ClientExpedienteViewProps) {
  const [client, setClient] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadClient() {
      setIsLoading(true);
      setError("");
      try {
        const users = await fetchUsuarios();
        if (mounted) setClient(users.find((user) => user.id === clientId) ?? null);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el cliente.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadClient();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-80 w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-white/60 hover:text-build-main dark:text-white"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a clientes
        </Link>
        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-build-main dark:text-white">
          Expediente de cliente
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
          Vista administrativa legal del cliente y sus documentos.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h2 className="text-[20px] font-bold text-build-main dark:text-white">
          {client ? [client.nombre, client.apellidos].filter(Boolean).join(" ") : "Cliente no encontrado"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Documento</p>
            <p className="mt-2 text-sm font-semibold text-build-main dark:text-white">{client?.documentoIdentidad || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Correo</p>
            <p className="mt-2 text-sm font-semibold text-build-main dark:text-white">{client?.email || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Teléfono</p>
            <p className="mt-2 text-sm font-semibold text-build-main dark:text-white">{client?.telefono || "-"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-10">
        <h2 className="text-[20px] font-bold text-build-main dark:text-white">Pipeline legal</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
          El backend todavía no expone contratos, minutas, actas ni permisos documentales por expediente.
          Esta pantalla queda preparada como frontera del módulo legal sin depender de datos mock compartidos.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {LEGAL_SECTIONS.map((section) => (
            <div key={section} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-sm font-bold text-build-main dark:text-white">{section}</p>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-white/60">Pendiente de integración backend.</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
