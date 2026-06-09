"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCliente } from "@/lib/api/users";
import Link from "next/link";
 
const EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  documentoIdentidad: "",
};
 
export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await registerCliente({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || undefined,
        documentoIdentidad: form.documentoIdentidad.trim() || undefined,
        tipoUsuario: "CLIENTE",
      });
      setSuccess("Cliente creado exitosamente.");
      setTimeout(() => router.push("/clientes"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-white/60 hover:text-build-main dark:hover:text-white transition-colors text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a clientes
        </Link>
      </div>
 
      {/* Header */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-build-accent mb-1.5">
          Registro de cliente
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
          Crear nuevo cliente
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
          Registra un nuevo cliente en la plataforma para gestionar sus datos y expedientes.
        </p>
      </header>
 
      {/* Form Card */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-red-500 mt-0.5 flex-shrink-0">error</span>
            <p className="text-[13px] text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-emerald-600 mt-0.5 flex-shrink-0">check_circle</span>
            <p className="text-[13px] text-emerald-800 dark:text-emerald-400 font-semibold">{success}</p>
          </div>
        )}
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
                Nombre <span className="text-build-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. André"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
                Apellidos <span className="text-build-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                placeholder="Ej. Contreras"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
              />
            </div>
          </div>
 
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
              Correo electrónico <span className="text-build-accent">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="cliente@ejemplo.com"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
            />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="+51 999 888 777"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
                DNI / RUC
              </label>
              <input
                type="text"
                value={form.documentoIdentidad}
                onChange={(e) => setForm((f) => ({ ...f, documentoIdentidad: e.target.value }))}
                placeholder="12345678"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
              />
            </div>
          </div>
 
          {/* Actions */}
          <div className="flex items-center justify-between pt-6 mt-2 border-t border-slate-100 dark:border-white/10">
            <Link
              href="/clientes"
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-build-main dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !!success}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-build-main hover:bg-build-accent text-white rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  Crear cliente
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 