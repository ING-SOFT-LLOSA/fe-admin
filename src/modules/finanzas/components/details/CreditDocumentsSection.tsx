"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchStageDocuments, uploadRequisitoArchivo, deleteRequisitoArchivo, type DocumentoItem } from "@/lib/api/requisitos";

interface CreditDocDef {
  id: string;
  label: string;
  descripcion: string;
  icon: string;
  colorCls: string;
  stage: "SEPARACION" | "PAGO" | null;
  requisitoTitle: string | null;
}

const CREDIT_DOCS: CreditDocDef[] = [
  {
    id: "SEPARACION",
    label: "Pago de Separación",
    descripcion: "Comprobante de pago inicial de reserva del inmueble.",
    icon: "receipt_long",
    colorCls: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    stage: "SEPARACION",
    requisitoTitle: "Comprobante de separación",
  },
  {
    id: "PAGO_INICIAL",
    label: "Pago Inicial",
    descripcion: "Documento de cuota inicial / pie del crédito hipotecario.",
    icon: "payments",
    colorCls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    stage: null,
    requisitoTitle: null,
  },
  {
    id: "DESEMBOLSO",
    label: "Desembolso Bancario",
    descripcion: "Constancia de desembolso emitida por la entidad financiera.",
    icon: "account_balance_wallet",
    colorCls: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
    stage: "PAGO",
    requisitoTitle: "Inicio De desembolso",
  },
];

interface CreditDocumentsSectionProps {
  expedienteId: string;
  onUpdate?: () => void;
}

export default function CreditDocumentsSection({
  expedienteId,
  onUpdate,
}: CreditDocumentsSectionProps) {
  const [slots, setSlots] = useState<Record<string, DocumentoItem | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sepRes, pagoRes] = await Promise.all([
        fetchStageDocuments("SEPARACION", expedienteId),
        fetchStageDocuments("PAGO", expedienteId),
      ]);

      const next: Record<string, DocumentoItem | null> = {};

      for (const def of CREDIT_DOCS) {
        if (!def.stage || !def.requisitoTitle) continue;
        const stageRes = def.stage === "SEPARACION" ? sepRes : pagoRes;
        const doc = stageRes.documents.find(
          (d) => d.title?.toLowerCase().trim() === def.requisitoTitle!.toLowerCase().trim()
        ) ?? null;
        next[def.id] = doc;
      }

      setSlots(next);
    } catch (e) {
      setError("No se pudieron cargar los documentos de crédito.");
    } finally {
      setIsLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = (def: CreditDocDef) => {
    if (!def.stage || !def.requisitoTitle) return;
    const current = slots[def.id];
    const requisitoId = current?.id;
    if (!requisitoId) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingId(def.id);
      setError(null);
      try {
        await uploadRequisitoArchivo(requisitoId, file);
        await loadDocuments();
        onUpdate?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al subir el archivo.");
      } finally {
        setUploadingId(null);
      }
    };
    input.click();
  };

  const handleDelete = async (def: CreditDocDef) => {
    const current = slots[def.id];
    if (!current?.hasDownload) return;
    if (!confirm(`¿Eliminar el archivo de "${def.label}"?`)) return;

    setDeletingId(def.id);
    setError(null);
    try {
      await deleteRequisitoArchivo(current.id);
      setSlots((prev) => ({ ...prev, [def.id]: null }));
      onUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar el archivo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (def: CreditDocDef) => {
    const current = slots[def.id];
    if (!current?.downloadUrl) return;
    setOpeningId(def.id);
    window.open(current.downloadUrl, "_blank", "noopener,noreferrer");
    setOpeningId(null);
  };

  const loadedCount = CREDIT_DOCS.filter(
    (def) => def.stage && slots[def.id]?.hasDownload
  ).length;
  const functionalCount = CREDIT_DOCS.filter((def) => def.stage).length;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <span className="material-symbols-outlined text-[22px]">folder_special</span>
        </div>
        <div>
          <h4 className="text-base font-bold text-build-main dark:text-white">
            Documentos de Crédito Hipotecario
          </h4>
          <p className="text-xs text-slate-400 dark:text-white/40">
            Comprobantes asociados al contrato de compraventa
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isLoading && (
            <span className="material-symbols-outlined text-slate-300 dark:text-white/20 animate-spin text-[18px]">
              progress_activity
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {loadedCount}/{functionalCount} cargados
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-sm text-red-700 dark:text-red-400">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {CREDIT_DOCS.map((def) => {
          const current = slots[def.id];
          const hasFile = current?.hasDownload ?? false;
          const doc = current;
          const isPlaceholder = !def.stage;

          const isUploading = uploadingId === def.id;
          const isDeleting = deletingId === def.id;
          const isOpening = openingId === def.id;
          const isBusy = isUploading || isDeleting || isOpening;

          if (isPlaceholder) {
            return (
              <div
                key={def.id}
                className="relative rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3 opacity-50"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    Próximamente
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-white/5 text-slate-300">
                    <span className="material-symbols-outlined text-[22px]">lock</span>
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-bold text-build-main dark:text-white leading-tight">
                      {def.label}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5 leading-snug">
                      {def.descripcion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-white/5 mt-auto">
                  <div className="flex-1 py-1.5 rounded-lg text-[11px] text-center text-slate-400 italic">
                    En desarrollo
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={def.id}
              className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                hasFile
                  ? "border-green-200 dark:border-green-900/40 bg-green-50/30 dark:bg-green-900/5"
                  : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
              }`}
            >
              <div
                className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-colors ${
                  hasFile ? "bg-green-400" : "bg-slate-300 dark:bg-white/20"
                }`}
              />

              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${def.colorCls}`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {def.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-bold text-build-main dark:text-white leading-tight">
                    {def.label}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5 leading-snug">
                    {def.descripcion}
                  </p>
                </div>
              </div>

              {hasFile && doc && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                    attach_file
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-white/60 truncate flex-1">
                    {doc.title}
                  </span>
                  {doc.emissionDate && (
                    <span className="text-[10px] text-slate-300 dark:text-white/25 shrink-0">
                      {new Date(doc.emissionDate).toLocaleDateString("es-PE")}
                    </span>
                  )}
                </div>
              )}

              {isLoading && !doc && (
                <div className="h-9 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
              )}

              <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-white/5 mt-auto">
                {hasFile && (
                  <button
                    onClick={() => handleView(def)}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100/60 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isOpening ? "more_horiz" : "open_in_new"}
                    </span>
                    {isOpening ? "Abriendo..." : "Ver"}
                  </button>
                )}

                <button
                  onClick={() => handleUpload(def)}
                  disabled={isBusy}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-white/70 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isUploading ? "more_horiz" : hasFile ? "upload_file" : "cloud_upload"}
                  </span>
                  {isUploading ? "Subiendo..." : hasFile ? "Reemplazar" : "Subir"}
                </button>

                {hasFile && (
                  <button
                    onClick={() => handleDelete(def)}
                    disabled={isBusy}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition disabled:opacity-50"
                    title="Eliminar archivo"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isDeleting ? "more_horiz" : "delete"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
