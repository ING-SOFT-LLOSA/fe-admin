"use client";

import { useState } from "react";

import { unlinkAssignment } from "@/lib/api/users";
import { ClienteAssignment } from "@/types/user";

type UnlinkPropertyModalProps = {
  open: boolean;
  assignment: ClienteAssignment | null;
  onClose: () => void;
  onUnlinked: () => void;
};

export default function UnlinkPropertyModal({
  open,
  assignment,
  onClose,
  onUnlinked,
}: UnlinkPropertyModalProps) {
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
      setError(err instanceof Error ? err.message : "No se pudo desvincular la propiedad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[28px]">
              link_off
            </span>
          </div>

          <h3 className="text-[20px] font-bold text-build-main dark:text-white mb-2">
            Desvincular propiedad
          </h3>

          {/* Property info */}
          <p className="text-[14px] text-slate-600 dark:text-white/70 mb-1">
            ¿Desvincular{" "}
            <span className="font-semibold text-build-main dark:text-white">
              {assignment.projectName ?? `Propiedad #${assignment.unitId}`}
            </span>
            ?
          </p>

          {assignment.unitLabel && (
            <p className="text-[12px] text-slate-400 dark:text-white/40 mb-6">
              {assignment.unitLabel}
            </p>
          )}

          {/* Warning */}
          <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium mb-6 w-full text-left bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-4 py-3">
            Se eliminará la asignación activa. Esta acción no se puede deshacer.
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
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Desvinculando…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">link_off</span>
                  Desvincular
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}