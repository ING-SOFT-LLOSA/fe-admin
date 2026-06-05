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
    /*
     * -mx-6 -mt-8 md:-mx-8 cancela los paddings del layout (px-6 py-8 md:px-8)
     * para que el componente se extienda de borde a borde del área de contenido.
     */
    <div
      className="-mx-6 -mt-8 md:-mx-8 flex min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Panel izquierdo oscuro ── */}
      <div className="hidden lg:flex w-[38%] bg-[#f0e9df] dark:bg-[#1e1a16] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0 border-r border-[#e0d5c8] dark:border-white/10">
        {/* Decorative shapes in warm tones */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-build-accent/10" />
        <div className="absolute bottom-10 -right-16 w-64 h-64 rounded-full bg-build-accent/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-build-accent/20" />
 
        {/* Back */}
        <div className="relative z-10">
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 text-build-main/50 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors text-[13px] font-semibold"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            Volver a clientes
          </Link>
        </div>
 
        {/* Hero */}
        <div className="relative z-10">
          <div className="w-8 h-0.5 bg-build-accent mb-7" />
          <h1
            className="text-5xl font-bold text-build-main dark:text-white leading-[1.1] mb-5 tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Nuevo
            <br />
            <span className="text-build-accent">cliente.</span>
          </h1>
          <p className="text-build-main/50 dark:text-white/50 text-[14px] leading-relaxed max-w-[260px]">
            Registra un nuevo cliente en la plataforma de Llosa Edificaciones.
          </p>
        </div>
 
        {/* Info cards */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: "mail",         text: "Se enviará un correo de activación al cliente" },
            { icon: "lock",         text: "El cliente creará su propia contraseña"        },
            { icon: "check_circle", text: "Acceso inmediato tras la activación"           },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-build-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[15px] text-build-accent">{icon}</span>
              </div>
              <span className="text-[13px] text-build-main/50 dark:text-white/50">{text}</span>
            </div>
          ))}
        </div>
      </div>
 
      {/* ── Panel derecho con formulario ── */}
      <div className="flex-1 flex flex-col bg-build-bg overflow-y-auto">
        {/* Mobile back */}
        <div className="lg:hidden flex items-center gap-3 px-6 pt-5 pb-2">
          <Link
            href="/clientes"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          </Link>
          <span className="text-[13px] font-bold text-build-main dark:text-white">Volver a clientes</span>
        </div>
 
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 py-10 max-w-2xl w-full">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-build-accent mb-2">
              Registro de cliente
            </p>
            <h2
              className="text-3xl font-bold text-build-main dark:text-white leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Crear nuevo cliente
            </h2>
          </div>
 
          {/* Alerts */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[17px] text-red-500 mt-0.5 flex-shrink-0">error</span>
              <p className="text-[13px] text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[17px] text-emerald-600 mt-0.5 flex-shrink-0">check_circle</span>
              <p className="text-[13px] text-emerald-800 dark:text-emerald-400 font-semibold">{success}</p>
            </div>
          )}
 
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50 mb-1.5">
                  Nombre <span className="text-build-accent">*</span>
                </label>
                <input
                  type="text" required value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="André"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50 mb-1.5">
                  Apellidos <span className="text-build-accent">*</span>
                </label>
                <input
                  type="text" required value={form.apellidos}
                  onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                  placeholder="Contreras"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50 mb-1.5">
                Correo electrónico <span className="text-build-accent">*</span>
              </label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="cliente@ejemplo.com"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
              />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel" value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="+51 999 888 777"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50 mb-1.5">
                  DNI / RUC
                </label>
                <input
                  type="text" value={form.documentoIdentidad}
                  onChange={(e) => setForm((f) => ({ ...f, documentoIdentidad: e.target.value }))}
                  placeholder="12345678"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[14px] text-build-main dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none transition-all focus:border-build-accent focus:ring-4 focus:ring-build-accent/15"
                />
              </div>
            </div>
 
            {/* Actions */}
            <div className="flex items-center justify-between pt-5 mt-1 border-t border-slate-200 dark:border-white/10">
              <Link
                href="/clientes"
                className="px-5 py-2.5 text-[13px] font-bold text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !!success}
                className="inline-flex items-center gap-2 px-7 py-2.5 bg-build-main hover:bg-build-accent text-white rounded-xl text-[13px] font-bold transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
    </div>
  );
}
 