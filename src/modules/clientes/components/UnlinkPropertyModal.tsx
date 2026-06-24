"use client";

import { useState } from "react";

import { unlinkAssignment } from "@/lib/api/users";

export type UnlinkAssignmentInfo = {
  uuidUsuarioActivo: string | number;
  projectName?: string;
  unitId: string | number;
  unitLabel?: string;
};

type UnlinkPropertyModalProps = {
  readonly open: boolean;
  readonly assignment: UnlinkAssignmentInfo | null;
  readonly onClose: () => void;
  readonly onUnlinked: () => void;
};

export default function UnlinkPropertyModal({
  open,
  assignment,
  onClose,
  onUnlinked,
}: Readonly<UnlinkPropertyModalProps>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !assignment) return null;

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await unlinkAssignment(String(assignment!.uuidUsuarioActivo));
      onUnlinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[28px]">
              contract_delete
            </span>
          </div>

          <h3 className="text-lg font-bold text-build-main dark:text-white mb-1">
            Cancelar contrato
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 mb-4">
            Esta acción no se puede deshacer.
          </p>

          {/* Unidades afectadas */}
          {assignment.unitLabel && (
            <div className="w-full mb-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                Unidades que se desvincularán
              </p>
              <p className="text-sm font-semibold text-build-main dark:text-white">
                {assignment.unitLabel}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="w-full mb-5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-left flex gap-2.5">
            <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[18px] shrink-0 mt-0.5">warning</span>
            <p className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">
              Se cancelará el contrato completo y se desvincularán todas las unidades asociadas del cliente.
            </p>
          </div>

          {error && (
            <div className="w-full mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400 text-left">
              {error}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Cancelando…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">contract_delete</span>
                  <span>Confirmar cancelación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
