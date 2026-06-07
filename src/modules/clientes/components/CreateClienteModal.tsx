"use client";

import { useState } from "react";

import { registerCliente } from "@/lib/api/users";

type CreateClienteModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  documentoIdentidad: "",
};

export default function CreateClienteModal({
  open,
  onClose,
  onCreated,
}: CreateClienteModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClose() {
    if (loading) return;
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    onClose();
  }

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

      setSuccess("Cliente creado correctamente.");
      onCreated();

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-build-main dark:text-white">person_add</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-build-main dark:text-white">Crear cliente</h2>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="text-slate-400 dark:text-white/50 hover:text-build-main dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-[#27a85e]/30 bg-[#d6f0e0] px-4 py-3 text-[13px] font-semibold text-[#1c663b]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1.5">
                Nombres *
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-build-main dark:text-white focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Carlos"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1.5">
                Apellidos *
              </label>
              <input
                required
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-build-main dark:text-white focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Ruiz"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1.5">
              Correo electronico *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-build-main dark:text-white focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1.5">
                DNI / CE
              </label>
              <input
                value={form.documentoIdentidad}
                onChange={(e) => setForm((f) => ({ ...f, documentoIdentidad: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-build-main dark:text-white focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1.5">
                Telefono
              </label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-build-main dark:text-white focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-build-main dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="px-6 py-2.5 bg-build-main text-white rounded-lg text-sm font-bold hover:bg-build-main/90 transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? "Creando..." : "Crear cliente"}
              {!loading && <span className="material-symbols-outlined text-[18px]">check</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
