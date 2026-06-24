import { useState } from "react";

import {
  uploadRequisitoArchivo,
  deleteRequisitoArchivo,
  updateRequisito,
  type DocumentoItem,
} from "@/lib/api/requisitos";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

import type { StageSection } from "./hooks";
import { Spinner, ErrorBanner } from "./ui";
import DialogModal from "@/components/ui/DialogModal";

type Props = {
  readonly contrato:      UsuarioActivoResponseDTO | null;
  readonly sections:      StageSection[];
  readonly loading:       boolean;
  readonly loadError:     string | null;
  readonly canUploadDocs: boolean;
  readonly canEditNotes:  boolean;
  readonly onRefresh:     () => Promise<void>;
};

export function TabDocumentos({
  contrato,
  sections,
  loading,
  loadError,
  canUploadDocs,
  canEditNotes,
  onRefresh,
}: Readonly<Props>) {
  const [uploadingDoc, setUploadingDoc]   = useState<string | null>(null);
  const [actionError,  setActionError]    = useState<string | null>(null);
  const [editingNota,  setEditingNota]    = useState<{ id: string; text: string } | null>(null);
  const [savingNotaId, setSavingNotaId]   = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "danger";
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  if (!contrato) {
    return (
      <div className="text-center py-12 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
        <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-white/20 mb-2">folder_open</span>
        <p className="text-sm font-semibold text-slate-500 dark:text-white/40">
          Selecciona una unidad para ver y gestionar sus documentos.
        </p>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleUploadClick(requisitoId: string) {
    const input = document.createElement("input");
    input.type   = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await handleUpload(requisitoId, file);
    };
    input.click();
  }

  async function handleUpload(requisitoId: string, file: File) {
    setUploadingDoc(requisitoId);
    setActionError(null);
    try {
      await uploadRequisitoArchivo(requisitoId, file);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al subir el documento.");
    } finally {
      setUploadingDoc(null);
    }
  }

  function handleDelete(requisitoId: string) {
    setDialog({
      isOpen: true,
      title: "Eliminar Documento",
      message: "¿Estás seguro de que deseas eliminar este documento?",
      type: "danger",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        setActionError(null);
        try {
          await deleteRequisitoArchivo(requisitoId);
          await onRefresh();
        } catch (err) {
          setActionError(err instanceof Error ? err.message : "Error al eliminar el documento.");
        }
      },
    });
  }

  async function handleSaveNota(doc: DocumentoItem) {
    if (!editingNota) return;
    setSavingNotaId(doc.id);
    setActionError(null);
    try {
      await updateRequisito(doc.id, {
        titulo:          doc.title,
        notaCorporativa: editingNota.text.trim(),
      });
      setEditingNota(null);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al guardar la nota corporativa.");
    } finally {
      setSavingNotaId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {(loadError || actionError) && (
        <ErrorBanner message={(loadError ?? actionError)!} />
      )}

      {loading && sections.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-5 h-5 text-arch-gold mr-3" />
          <span className="text-sm text-slate-500 dark:text-white/40 font-medium">
            Cargando documentos y requisitos...
          </span>
        </div>
      ) : (
        sections.map((seccion) => (
          <div
            key={seccion.id}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden"
          >
            {/* Section header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <span className="material-symbols-outlined text-arch-gold text-[20px]">{seccion.icon}</span>
              <h3 className="text-sm font-bold text-build-main dark:text-white">{seccion.label}</h3>
            </div>

            {/* Document rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {seccion.docs.length === 0 ? (
                <div className="px-5 py-6 flex flex-col items-center gap-1.5 text-center">
                  <span className="material-symbols-outlined text-[28px] text-slate-200 dark:text-white/10">folder_open</span>
                  <p className="text-xs text-slate-400 dark:text-white/30">No se han configurado requisitos para esta etapa.</p>
                </div>
              ) : (
                seccion.docs.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    isUploading={uploadingDoc === doc.id}
                    isEditingNota={editingNota?.id === doc.id}
                    editingNotaText={editingNota?.id === doc.id ? editingNota.text : ""}
                    isSavingNota={savingNotaId === doc.id}
                    canUploadDocs={canUploadDocs}
                    canEditNotes={canEditNotes}
                    onUploadClick={() => handleUploadClick(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    onDownload={() => doc.downloadUrl && window.open(doc.downloadUrl, "_blank", "noopener,noreferrer")}
                    onEditNotaStart={() => setEditingNota({ id: doc.id, text: doc.notaCorporativa ?? "" })}
                    onEditNotaChange={(text) => setEditingNota({ id: doc.id, text })}
                    onSaveNota={() => handleSaveNota(doc)}
                    onCancelNota={() => setEditingNota(null)}
                  />
                ))
              )}
            </div>
          </div>
        ))
      )}

      <DialogModal
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// ─── DocRow ───────────────────────────────────────────────────────────────────

type DocRowProps = {
  readonly doc:               DocumentoItem;
  readonly isUploading:       boolean;
  readonly isEditingNota:     boolean;
  readonly editingNotaText:   string;
  readonly isSavingNota:      boolean;
  readonly canUploadDocs:     boolean;
  readonly canEditNotes:      boolean;
  readonly onUploadClick:     () => void;
  readonly onDelete:          () => void;
  readonly onDownload:        () => void;
  readonly onEditNotaStart:   () => void;
  readonly onEditNotaChange:  (text: string) => void;
  readonly onSaveNota:        () => void;
  readonly onCancelNota:      () => void;
};

function DocRow({
  doc, isUploading, isEditingNota, editingNotaText, isSavingNota,
  canUploadDocs, canEditNotes,
  onUploadClick, onDelete, onDownload, onEditNotaStart,
  onEditNotaChange, onSaveNota, onCancelNota,
}: Readonly<DocRowProps>) {
  const isCompleted = doc.status?.toLowerCase() === "completada";

  return (
    <div className="relative flex flex-col px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors gap-3 group">
      {isUploading && (
        <div className="absolute inset-0 bg-white/75 dark:bg-[#111]/75 flex items-center justify-center gap-3 z-10">
          <Spinner className="w-5 h-5 text-arch-gold animate-spin" />
          <span className="text-xs font-bold text-build-main dark:text-white">Subiendo documento...</span>
        </div>
      )}
      {/* Title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${isCompleted ? "text-emerald-500" : "text-slate-300 dark:text-white/20"}`}>
            {isCompleted ? "verified" : "description"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{doc.title}</p>
            {doc.description && (
              <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{doc.description}</p>
            )}
            {doc.emissionDate && (
              <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
                Completado el: {doc.emissionDate}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {isCompleted ? (
            <>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Completado
              </span>
              {doc.hasDownload && doc.downloadUrl && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors"
                  title="Descargar / Ver archivo"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              )}
              {canUploadDocs && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                  title="Eliminar archivo"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
                Pendiente
              </span>
              {canUploadDocs && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={onUploadClick}
                  className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Subir archivo"
                >
                  {isUploading
                    ? <Spinner className="w-4 h-4 text-arch-gold" />
                    : <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  }
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Corporate note */}
      <div className="mt-1 pl-8 border-l border-slate-100 dark:border-white/5 space-y-2">
        {isEditingNota ? (
          <div className="flex gap-2 items-center w-full max-w-2xl">
            <input
              type="text"
              value={editingNotaText}
              onChange={(e) => onEditNotaChange(e.target.value)}
              placeholder="Escribe una nota interna..."
              disabled={isSavingNota}
              className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-3 py-1.5 text-xs focus:outline-none dark:text-white"
            />
            <button
              type="button"
              onClick={onSaveNota}
              disabled={isSavingNota}
              className="px-3 py-1.5 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isSavingNota && <Spinner className="w-3 h-3 text-white" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={onCancelNota}
              disabled={isSavingNota}
              className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {doc.notaCorporativa ? (
                <div className="text-xs text-slate-500 dark:text-white/50 leading-relaxed italic bg-slate-50 dark:bg-white/[0.02] rounded-lg px-3 py-2 border border-slate-100 dark:border-white/5">
                  <span className="font-bold not-italic text-slate-600 dark:text-white/60 block text-[10px] uppercase tracking-wider mb-1">
                    Nota Corporativa:
                  </span>
                  {doc.notaCorporativa}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-white/30 italic">Sin notas corporativas.</p>
              )}
            </div>
            {canEditNotes && (
              <button
                type="button"
                onClick={onEditNotaStart}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-arch-gold hover:text-build-main dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">edit_note</span>
                {doc.notaCorporativa ? "Editar Nota" : "Agregar Nota"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
