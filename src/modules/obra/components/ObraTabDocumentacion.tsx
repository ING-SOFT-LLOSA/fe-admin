"use client";

import { useEffect, useState } from "react";
import { fetchDocumentosByReferencia, fetchSignedUrl, deleteDocumento, uploadDocument } from "@/lib/api/documents";
import DialogModal from "@/components/ui/DialogModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocCategoria = "anteproyecto" | "licencia" | "planos" | "acabados" | "certificacion";

type Documento = {
  id: string;
  nombre: string;
  categoria: DocCategoria;
  fechaCarga: string;
};

type ObraTabDocumentacionProps = {
  projectId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS: { id: DocCategoria; label: string; icon: string; description: string }[] = [
  { id: "anteproyecto",   label: "Anteproyecto Aprobado",         icon: "architecture",       description: "Planos y documentos del anteproyecto aprobado por la municipalidad" },
  { id: "licencia",        label: "Licencia de Construcción",      icon: "verified",           description: "Resolución de licencia, conformidad de obra y habilitación"         },
  { id: "planos",          label: "Planos",                        icon: "draw",               description: "Planos de arquitectura, estructura, IIEE, IISS y especialidades"     },
  { id: "acabados",        label: "Cuadro de Acabados",            icon: "format_paint",       description: "Especificaciones técnicas de acabados por unidad inmobiliaria"        },
  { id: "certificacion",   label: "Certificación EDGE / LEED",    icon: "eco",                description: "Documentos de pre-certificación y certificación de sostenibilidad"    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObraTabDocumentacion({ projectId }: ObraTabDocumentacionProps) {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCat, setUploadingCat] = useState<DocCategoria | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

  const loadDocuments = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const dbDocs = await fetchDocumentosByReferencia(projectId);
      const mapped = dbDocs.map((doc) => {
        let categoria: DocCategoria = "planos";
        let nombre = doc.nombreOriginal;
        for (const cat of CATEGORIAS) {
          if (doc.nombreOriginal.startsWith(`[${cat.id}] `)) {
            categoria = cat.id;
            nombre = doc.nombreOriginal.substring(cat.id.length + 3);
            break;
          }
        }
        return {
          id: doc.id,
          nombre,
          categoria,
          fechaCarga: doc.createdAt ? doc.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        };
      });
      setDocuments(mapped);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError(err instanceof Error ? err.message : "Error al cargar documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const handleUploadClick = (categoria: DocCategoria) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.dwg,.xlsx,.docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await handleUpload(categoria, file);
    };
    input.click();
  };

  const handleUpload = async (categoria: DocCategoria, file: File) => {
    setUploadingCat(categoria);
    setActionError(null);
    try {
      const finalFileName = `[${categoria}] ${file.name}`;
      const renamedFile = new File([file], finalFileName, { type: file.type });
      
      await uploadDocument(projectId, renamedFile, "PDF_LEGAL");
      await loadDocuments();
    } catch (err) {
      console.error("Error uploading project document:", err);
      setActionError(err instanceof Error ? err.message : "Error al subir el documento.");
    } finally {
      setUploadingCat(null);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetchSignedUrl(docId);
      window.open(res.url, "_blank");
    } catch (err) {
      console.error("Error fetching signed URL:", err);
      setDialog({
        isOpen: true,
        title: "Error de Descarga",
        message: "No se pudo obtener el enlace de descarga.",
        type: "danger",
        confirmText: "Aceptar",
      });
    }
  };

  const handleDelete = (docId: string) => {
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
          await deleteDocumento(docId);
          await loadDocuments();
        } catch (err) {
          console.error("Error deleting document:", err);
          setActionError(err instanceof Error ? err.message : "Error al eliminar el documento.");
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {(error || actionError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error || actionError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <span className="material-symbols-outlined text-build-accent text-[20px]">folder_open</span>
          <h3 className="text-sm font-bold text-build-main dark:text-white font-sans">Documentación del Proyecto</h3>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-5 h-5 text-build-accent mr-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm text-slate-500 dark:text-white/40 font-medium">Cargando documentos...</span>
            </div>
          ) : (
            CATEGORIAS.map((cat) => {
              const doc = documents.find((d) => d.categoria === cat.id);
              const isCompleted = !!doc;
              const isUploading = uploadingCat === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex flex-col px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors gap-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${isCompleted ? "text-emerald-500" : "text-slate-300 dark:text-white/20"}`}>
                        {isCompleted ? "verified" : cat.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{cat.label}</p>
                        {isCompleted ? (
                          <div className="space-y-0.5 mt-0.5">
                            <p className="text-xs text-slate-500 dark:text-white/50 truncate max-w-[280px] sm:max-w-md" title={doc.nombre}>
                              Archivo: {doc.nombre}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-white/30">
                              Completado el: {new Date(doc.fechaCarga).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{cat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {isCompleted ? (
                        <>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Completado
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors"
                            title="Descargar / Ver archivo"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                            title="Eliminar archivo"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
                            Pendiente
                          </span>
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => handleUploadClick(cat.id)}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Subir archivo"
                          >
                            {isUploading ? (
                              <svg className="animate-spin w-4 h-4 text-build-accent" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
