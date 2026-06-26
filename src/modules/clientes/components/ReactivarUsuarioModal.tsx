"use client";

import { useState } from "react";

import { activarUsuario } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";

type ReactivarUsuarioModalProps = {
  readonly open: boolean;
  readonly usuario: ClienteRow | null;
  readonly onClose: () => void;
  readonly onReactivated: () => void;
};

export default function ReactivarUsuarioModal({
  open,
  usuario,
  onClose,
  onReactivated,
}: Readonly<ReactivarUsuarioModalProps>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !usuario) return null;

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await activarUsuario(usuario!.id);
      onReactivated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reactivar el cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[28px]">check_circle</span>
          </div>
          <h3 className="text-[20px] font-bold text-[#1a1c1d] dark:text-white mb-2">Reactivar cliente</h3>
          <p className="text-[14px] text-[#41484c] dark:text-white/80 mb-1">
            ¿Reactivar a <b>{usuario.name}</b>?
          </p>
          <p className="text-[12px] text-[#72787c] dark:text-white/60 mb-6">{usuario.email}</p>
          <p className="text-[12px] text-slate-600 dark:text-white/70 font-medium mb-6 w-full text-left bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3">
            El cliente volverá a estar ACTIVO en el sistema y recuperará el acceso.
          </p>

          {error && (
            <div className="w-full mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400 text-left">
              {error}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-[#41484c] dark:text-white/60 hover:bg-[#f4f3f5] dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Reactivando..." : "Reactivar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
