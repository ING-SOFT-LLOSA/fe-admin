"use client";

import { useState } from "react";

import { eliminarUsuarioCompleto } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";

type DeleteUsuarioModalProps = {
  open: boolean;
  usuario: ClienteRow | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteUsuarioModal({
  open,
  usuario,
  onClose,
  onDeleted,
}: DeleteUsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !usuario) return null;

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await eliminarUsuarioCompleto(usuario!.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[28px]">delete_forever</span>
          </div>
          <h3 className="text-[20px] font-bold text-[#1a1c1d] mb-2">Eliminar cliente</h3>
          <p className="text-[14px] text-[#41484c] mb-1">
            ¿Eliminar a <b>{usuario.name}</b>?
          </p>
          <p className="text-[12px] text-[#72787c] mb-6">{usuario.email}</p>
          <p className="text-[12px] text-[#ba1a1a] font-medium mb-6 w-full text-left bg-[#ffdad6]/30 border border-[#ba1a1a]/20 rounded-lg px-4 py-3">
            Se retirara al cliente del prototipo. Esta accion no se puede deshacer.
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
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-[#41484c] hover:bg-[#f4f3f5] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-bold hover:bg-[#93000a] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
