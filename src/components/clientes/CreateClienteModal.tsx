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

      setSuccess(
        "Cliente creado. Se envió un correo para que defina su contraseña e inicie sesión.",
      );
      onCreated();

      setTimeout(() => {
        handleClose();
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-8 py-5 border-b border-[#e2e2e4] flex justify-between items-center bg-[#f9f9fb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c2e8ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#023143]">person_add</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#1a1c1d]">Crear cliente</h2>
              <p className="text-[12px] text-[#41484c] font-medium mt-0.5">
                Registro en Firebase y base de datos Llosa
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="text-[#c1c7cc] hover:text-[#ba1a1a] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-[#27a85e]/30 bg-[#d6f0e0] px-4 py-3 text-[13px] font-semibold text-[#1c663b]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#e2e2e4] rounded-xl text-[14px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10"
                placeholder="Andre"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
                Apellidos *
              </label>
              <input
                required
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#e2e2e4] rounded-xl text-[14px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10"
                placeholder="Contreras"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
              Correo electrónico *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#e2e2e4] rounded-xl text-[14px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
                DNI / RUC
              </label>
              <input
                value={form.documentoIdentidad}
                onChange={(e) => setForm((f) => ({ ...f, documentoIdentidad: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#e2e2e4] rounded-xl text-[14px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
                Teléfono
              </label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#e2e2e4] rounded-xl text-[14px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10"
                placeholder="+51 999 888 777"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#72787c] leading-relaxed">
            El cliente recibirá un correo de Firebase para crear su contraseña. El rol{" "}
            <span className="font-bold text-[#023143]">CLIENTE</span> se asigna automáticamente.
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#e2e2e4]">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-[#41484c] hover:bg-[#f4f3f5] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="px-6 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Creando…
                </>
              ) : (
                <>
                  Crear cliente
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
