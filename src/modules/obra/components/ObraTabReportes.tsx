"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback, useRef, useId } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Proyecto } from "@/modules/proyectos/types";
import {
  fetchReportesProyecto,
  createReporte,
  deleteReporte,
  updateReporte,
  type ReporteResponse,
  type ReporteCreatePayload,
  type ReporteUpdatePayload
} from "@/lib/api/reportes";
import DialogModal from "@/components/ui/DialogModal";
import { getEtapasByProyecto, type HitoResponseDTO } from "@/lib/api/obra";
import { type DocumentoResponse } from "@/lib/api/documents";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type ObraTabReportesProps = {
  readonly projectId: string;
  readonly avance: number;
  readonly project: Proyecto | null;
};
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const ESTADO_BADGE = {
  borrador:  { label: "Borrador",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
  publicado: { label: "Publicado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  archivado: { label: "Archivado", cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"              },
};
 
// ─── Main Component ───────────────────────────────────────────────────────────
 
export default function ObraTabReportes({ projectId, avance, project }: ObraTabReportesProps) {
  const { perfil } = useAuth();
  const [showForm,       setShowForm]       = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReporteResponse | null>(null);
 
  const [reports, setReports] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  // ── Pagination state ───────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalItems, setTotalItems]   = useState(0);
  // ─────────────────────────────────────────────────────────────────────────
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
  const [error, setError] = useState<string | null>(null);
 
  const canEdit = perfil?.rol === "ADMIN" || perfil?.funciones?.includes("OBRA_EDITAR");
 
  const lastProjectIdRef = useRef(projectId);

  useEffect(() => {
    lastProjectIdRef.current = projectId;
  }, [projectId]);

  const loadReports = useCallback(async (page = 0) => {
    if (!projectId) return;
    const currentProjectId = projectId;
    setLoading(true);
    setError(null);
    try {
      const pageRes = await fetchReportesProyecto(currentProjectId, page, PAGE_SIZE);
      if (currentProjectId !== lastProjectIdRef.current) return;
      setReports(pageRes.content || []);
      setTotalPages(pageRes.totalPages ?? 0);
      setTotalItems(pageRes.totalElements ?? 0);
      setCurrentPage(pageRes.number ?? 0);
    } catch (err) {
      if (currentProjectId === lastProjectIdRef.current) {
        console.error("Error loading reports:", err);
        setError(err instanceof Error ? err.message : "Error al cargar reportes.");
      }
    } finally {
      if (currentProjectId === lastProjectIdRef.current) {
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    setCurrentPage(0);
    Promise.resolve().then(() => {
      loadReports(0);
    });
  }, [loadReports]);

  const handleCreateReport = async (payload: ReporteCreatePayload, files: File[]) => {
    // The backend now handles file upload atomically in the multipart POST.
    // We simply pass the files to createReporte — no separate upload step needed.
    await createReporte(payload, files.length > 0 ? files : undefined);
    setShowForm(false);
    // Always reload from page 0 after creating a new report
    await loadReports(0);
  };
 
  const handleDeleteReport = (id: string) => {
    setDialog({
      isOpen: true,
      title: "Eliminar Reporte de Avance",
      message: "¿Estás seguro de que deseas eliminar este reporte de avance?",
      type: "danger",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteReporte(id);
          setSelectedReport(null);
          await loadReports(0);
        } catch (err) {
          console.error("Error deleting report:", err);
          setDialog({
            isOpen: true,
            title: "Error al Eliminar",
            message: err instanceof Error ? err.message : "Error al eliminar el reporte.",
            type: "danger",
            confirmText: "Aceptar",
          });
        }
      },
    });
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateReport = async (
    reportId: string,
    payload: ReporteUpdatePayload,
    newFiles: File[],
    deletedMediaIds: string[]
  ) => {
    await updateReporte(reportId, payload);

    if (deletedMediaIds.length > 0) {
      const { deleteDocumento } = await import("@/lib/api/documents");
      await Promise.all(
        deletedMediaIds.map((mediaId) =>
          deleteDocumento(mediaId).catch((err) => console.error("Error deleting media:", err))
        )
      );
    }

    if (newFiles.length > 0) {
      const { uploadDocument } = await import("@/lib/api/documents");
      await Promise.all(
        newFiles.map((file) => {
          let tipoDoc: "FOTO_OBRA" | "VIDEO_OBRA" | "PDF_LEGAL" = "FOTO_OBRA";
          if (file.type.startsWith("video/")) {
            tipoDoc = "VIDEO_OBRA";
          } else if (file.type === "application/pdf") {
            tipoDoc = "PDF_LEGAL";
          }
          return uploadDocument(reportId, file, tipoDoc);
        })
      );
    }

    await loadReports(currentPage);
    const { apiFetch } = await import("@/lib/api/http");
    const freshReport = await apiFetch<ReporteResponse>(`/api/reportes/${reportId}`);
    setSelectedReport(freshReport);
    setIsEditing(false);
  };


  const renderContent = () => {
    if (loading && reports.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-5 h-5 text-build-accent mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-slate-500 dark:text-white/40 font-medium">Cargando reportes...</span>
        </div>
      );
    }
    if (reports.length === 0) {
      return (
        <div className="px-6 py-14 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
            content_paste_off
          </span>
          <p className="text-sm font-semibold text-slate-400 dark:text-white/40">No hay reportes registrados</p>
          <p className="text-xs text-slate-300 dark:text-white/20">
            Sube un reporte para comenzar a documentar el avance del proyecto.
          </p>
        </div>
      );
    }
    return (
      <>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onView={() => setSelectedReport(report)}
            />
          ))}
        </div>

        {/* ── Pagination controls ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-xs text-slate-500 dark:text-white/40">
              Página <span className="font-semibold">{currentPage + 1}</span> de{" "}
              <span className="font-semibold">{totalPages}</span>
              {" "}·{" "}
              <span className="font-semibold">{totalItems}</span> reporte{totalItems === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 0 || loading}
                onClick={() => loadReports(currentPage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => loadReports(currentPage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
 
  // If a report is selected, show detail view
  if (selectedReport) {
    if (isEditing) {
      return (
        <EditarReporteForm
          report={selectedReport}
          projectId={projectId}
          onClose={() => setIsEditing(false)}
          onSubmit={handleUpdateReport}
        />
      );
    }
    return (
      <>
        <ReporteDetail
          report={selectedReport}
          onBack={() => setSelectedReport(null)}
          onDelete={() => handleDeleteReport(selectedReport.id)}
          canDelete={canEdit}
          onEdit={() => setIsEditing(true)}
        />
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
      </>
    );
  }
 
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
 

 
      {/* Controls row */}
      {canEdit && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{showForm ? "close" : "upload_file"}</span>
            {showForm ? "Cancelar" : "Nuevo reporte"}
          </button>
        </div>
      )}
 
      {/* New report form */}
      {showForm && (
        <NuevoReporteForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateReport}
        />
      )}
 
      {/* Reports list */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-build-main dark:text-white">Reportes de avance</h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            {totalItems > 0 ? totalItems : reports.length} reporte{(totalItems || reports.length) === 1 ? "" : "s"} encontrado{(totalItems || reports.length) === 1 ? "" : "s"}
            {project ? ` · ${project.nombre}` : ""}
          </p>
        </div>
 
        {renderContent()}
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
 
// ─── Report Row ───────────────────────────────────────────────────────────────
 
function ReportRow({ report, onView }: Readonly<{ report: ReporteResponse; onView: () => void }>) {
  const badge = ESTADO_BADGE.publicado;
  const hasMedia = (report.multimedia?.length ?? 0) > 0;
 
  return (
    <button
      type="button"
      className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer border-0 bg-transparent outline-none focus:ring-1 focus:ring-arch-gold/20"
      onClick={onView}
    >
      <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-build-main dark:text-white text-[20px]">article</span>
      </span>
 
      <span className="min-w-0 flex-1 block">
        <span className="block text-sm font-bold text-build-main dark:text-white truncate">{report.tituloPeriodo}</span>
        <span className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            <span>{new Date(report.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">person</span>
            <span>Supervisor</span>
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">construction</span>
            <span>{report.porcentajeAvance}%</span>
          </span>
          {report.hitosConsolidados && report.hitosConsolidados.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">layers</span>
              <span>{report.hitosConsolidados.length} hitos consolidados</span>
            </span>
          )}
          {hasMedia && (
            <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">photo_library</span>
              <span>Multimedia</span>
            </span>
          )}
        </span>
      </span>
 
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
        {badge.label}
      </span>
 
      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors inline-block">
          <span className="material-symbols-outlined text-[18px]">visibility</span>
        </span>
      </span>
    </button>
  );
}
 
// ─── Report Detail ────────────────────────────────────────────────────────────
 
function ReporteDetail({
  report,
  onBack,
  onDelete,
  canDelete,
  onEdit
}: Readonly<{
  report: ReporteResponse;
  onBack: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  onEdit?: () => void;
}>) {
  const badge = ESTADO_BADGE.publicado;
  const hasMedia = (report.multimedia?.length ?? 0) > 0;
 
  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm font-semibold text-arch-gold hover:text-build-main dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver a reportes</span>
          </button>
          
          <div className="flex items-center gap-2">
            {canDelete && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar reporte</span>
              </button>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Eliminar reporte</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-build-main dark:text-white">{report.tituloPeriodo}</h2>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">
              Supervisor · {new Date(report.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
        </div>
      </div>
 

 
      {/* Hitos consolidados */}
      {report.hitosConsolidados && report.hitosConsolidados.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-sm font-bold text-build-main dark:text-white">Hitos consolidados</h3>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              Etapas del proyecto completadas o consolidadas en este periodo.
            </p>
          </div>
          <div className="p-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              {report.hitosConsolidados.map((hito) => (
                <li key={hito} className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 font-semibold">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0">check_circle</span>
                  {hito}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
 
      {/* Comentarios */}
      {report.descripcion && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-build-main dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/40">comment</span>
            <span>Comentarios del residente / supervisor</span>
          </h3>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.descripcion}</p>
        </div>
      )}
 
      {/* Multimedia */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-build-main dark:text-white mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/40">photo_library</span>
          <span>Fotos y videos del período</span>
        </h3>
        <p className="text-xs text-slate-400 dark:text-white/40 mb-5">
          Evidencias multimedia adjuntadas a este reporte.
        </p>
 
        {hasMedia ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {report.multimedia.map((media) => {
              const isImage = media.tipoMime?.startsWith("image/");
              const iconName = isImage ? "image" : "video_library";
              return (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => media.urlAcceso && window.open(media.urlAcceso, "_blank", "noopener,noreferrer")}
                  className="aspect-video w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer overflow-hidden relative group"
                >
                  {isImage && media.urlAcceso ? (
                    <img src={media.urlAcceso} alt={media.nombreOriginal} className="object-cover w-full h-full" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[28px] text-slate-400 dark:text-white/30">
                        {iconName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 px-2 truncate max-w-full">
                        {media.nombreOriginal}
                      </span>
                    </>
                  )}
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[24px]">download</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-white/40 italic">No hay archivos multimedia adjuntos a este reporte.</p>
        )}
      </div>
    </div>
  );
}
 
// ─── New Report Form ──────────────────────────────────────────────────────────
 
type NuevoReporteFormProps = {
  readonly projectId: string;
  readonly onClose: () => void;
  readonly onSubmit: (payload: ReporteCreatePayload, files: File[]) => Promise<void>;
};

const getEstadoBadgeClass = (estado: string) => {
  if (estado === "COMPLETADO") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
  }
  if (estado === "EN_PROGRESO") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
  }
  return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40";
};

interface HitosSelectorProps {
  readonly loadingHitos: boolean;
  readonly availableHitos: readonly HitoResponseDTO[];
  readonly selectedHitos: readonly string[];
  readonly handleHitoToggle: (titulo: string) => void;
}

function HitosSelector({
  loadingHitos,
  availableHitos,
  selectedHitos,
  handleHitoToggle,
}: HitosSelectorProps) {
  if (loadingHitos) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-400 dark:text-white/40">
        <svg className="animate-spin w-4 h-4 text-build-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>Cargando hitos del proyecto...</span>
      </div>
    );
  }
  if (availableHitos.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-white/30 italic py-2 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">
        No hay hitos registrados para este proyecto.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto">
      {availableHitos.map((h) => {
        const isChecked = selectedHitos.includes(h.titulo);
        return (
          <label
            key={h.id}
            className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-white/80 cursor-pointer hover:text-build-main dark:hover:text-white transition-colors py-1"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleHitoToggle(h.titulo)}
              className="rounded text-build-accent border-slate-300 dark:border-white/10 focus:ring-arch-gold/20 focus:ring-1 bg-white dark:bg-transparent"
            />
            <span className="font-semibold">{h.titulo}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getEstadoBadgeClass(h.estado)}`}>
              {h.estado}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function useProjectHitos(projectId: string, initialSelected: string[] = []) {
  const [availableHitos, setAvailableHitos] = useState<HitoResponseDTO[]>([]);
  const [selectedHitos, setSelectedHitos] = useState<string[]>(initialSelected);
  const [loadingHitos, setLoadingHitos] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let active = true;
    const fetchHitos = async () => {
      setLoadingHitos(true);
      try {
        const etapas = await getEtapasByProyecto(projectId);
        if (!active) return;
        const hitos = etapas.map((e) => ({
          id: e.id,
          titulo: e.nombre,
          orden: e.orden,
          tipo: "OBRA",
          estado: e.estado,
          fechaCompletado: null,
        }));
        setAvailableHitos(hitos);
      } catch (err) {
        console.error("Error loading project hitos:", err);
      } finally {
        if (active) {
          setLoadingHitos(false);
        }
      }
    };

    fetchHitos();
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleHitoToggle = useCallback((titulo: string) => {
    setSelectedHitos((prev) =>
      prev.includes(titulo) ? prev.filter((x) => x !== titulo) : [...prev, titulo]
    );
  }, []);

  return {
    availableHitos,
    selectedHitos,
    setSelectedHitos,
    loadingHitos,
    handleHitoToggle,
  };
}
 
function NuevoReporteForm({ projectId, onClose, onSubmit }: NuevoReporteFormProps) {
  const [titulo,      setTitulo]      = useState("");
  const [comentarios, setComentarios] = useState("");
  const [fecha,       setFecha]       = useState(new Date().toISOString().split("T")[0]);

  const tituloId = useId();
  const fechaId = useId();
  const comentariosId = useId();
  const filesId = useId();
 
  useEffect(() => {
    const d = new Date(fecha + "T12:00:00");
    const mes = d.toLocaleDateString("es-PE", { month: "long" });
    const año = d.getFullYear();
    Promise.resolve().then(() => {
      setTitulo(`${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`);
    });
  }, [fecha]);
  const [files,       setFiles]       = useState<File[]>([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const {
    availableHitos,
    selectedHitos,
    loadingHitos,
    handleHitoToggle,
  } = useProjectHitos(projectId, []);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        uuidProyecto: projectId,
        tituloPeriodo: titulo.trim(),
        descripcion: comentarios.trim(),
        fecha,
        hitosConsolidados: selectedHitos,
      }, files);
    } catch (err) {
      console.error("Error submitting report:", err);
      setError(err instanceof Error ? err.message : "Error al guardar el reporte.");
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <div className="rounded-xl border border-arch-gold/30 bg-arch-gold/5 dark:bg-arch-gold/10 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-arch-gold text-[18px]">note_add</span>
            <span>Nuevo reporte de obra</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Completa los campos del reporte
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
 
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
 
      {/* Title */}
      <div>
        <label htmlFor={tituloId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Título del reporte *
        </label>
        <input
          id={tituloId}
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Reporte Junio 2026"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition"
        />
      </div>
 
      {/* Fecha del mes */}
      <div>
        <label htmlFor={fechaId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Fecha del reporte *
        </label>
        <input
          id={fechaId}
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition"
        />
      </div>
 
      {/* Hitos consolidados */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-2">
          Hitos Consolidados en este Período
        </p>
        <p className="text-xs text-slate-400 dark:text-white/35 mb-3 leading-relaxed">
          Selecciona los hitos del proyecto que se han completado o consolidado en este periodo de reporte.
        </p>
        <HitosSelector
          loadingHitos={loadingHitos}
          availableHitos={availableHitos}
          selectedHitos={selectedHitos}
          handleHitoToggle={handleHitoToggle}
        />
      </div>
 
      {/* Comentarios */}
      <div>
        <label htmlFor={comentariosId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Comentarios del residente / supervisor
        </label>
        <textarea
          id={comentariosId}
          rows={4}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Novedades del período, incidencias, observaciones del avance físico..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition resize-none"
        />
      </div>
 
      {/* Fotos y Videos selector */}
      <div>
        <label htmlFor={filesId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Adjuntar fotos y videos del período
        </label>
        <div className="flex flex-col gap-3">
          <input
            id={filesId}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={(e) => {
              if (e.target.files) {
                const selectedFiles = Array.from(e.target.files);
                const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
                const oversizedFile = selectedFiles.find(f => f.size > MAX_SIZE);
                if (oversizedFile) {
                  setError(`El archivo "${oversizedFile.name}" supera el límite de 10 MB. Por favor, selecciona archivos más pequeños.`);
                  e.target.value = ""; // Clear file input
                  setFiles([]);
                  return;
                }
                setError(null);
                setFiles(selectedFiles);
              }
            }}
            className="w-full text-xs text-slate-500 dark:text-white/40
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-xs file:font-bold
              file:bg-build-main/10 file:text-build-main
              hover:file:bg-build-main/20
              cursor-pointer"
          />
          {files.length > 0 && (
            <div className="text-xs text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <p className="font-semibold mb-1">Archivos seleccionados:</p>
              <ul className="list-disc pl-4 space-y-1">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
 
      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/50 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!titulo.trim() || submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined text-[18px]">publish</span>
          )}
          Crear reporte
        </button>
      </div>
    </div>
  );
}
 
// ─── KPI Mini ─────────────────────────────────────────────────────────────────
 
function KpiMini({
  icon, label, value,
  accent = "text-build-main dark:text-white",
}: Readonly<{
  icon: string; label: string; value: string; accent?: string;
}>) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-arch-gold text-[20px]">{icon}</span>
      </div>  
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">{label}</p>
        <p className={`text-xl font-bold tracking-tight ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Edit Report Form ──────────────────────────────────────────────────────────

type EditarReporteFormProps = {
  readonly report: ReporteResponse;
  readonly projectId: string;
  readonly onClose: () => void;
  readonly onSubmit: (
    reportId: string,
    payload: ReporteUpdatePayload,
    newFiles: File[],
    deletedMediaIds: string[]
  ) => Promise<void>;
};

function EditarReporteForm({ report, projectId, onClose, onSubmit }: EditarReporteFormProps) {
  const [titulo,      setTitulo]      = useState(report.tituloPeriodo);
  const [comentarios, setComentarios] = useState(report.descripcion ?? "");
  const initialDateStr = report.createdAt ? report.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];
  const [fecha,       setFecha]       = useState(initialDateStr);

  const tituloId = useId();
  const fechaId = useId();
  const comentariosId = useId();
  const filesId = useId();

  useEffect(() => {
    const d = new Date(fecha + "T12:00:00");
    const mes = d.toLocaleDateString("es-PE", { month: "long" });
    const año = d.getFullYear();
    Promise.resolve().then(() => {
      setTitulo(`${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`);
    });
  }, [fecha]);

  const [existingMedia, setExistingMedia] = useState<DocumentoResponse[]>(report.multimedia || []);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    availableHitos,
    selectedHitos,
    loadingHitos,
    handleHitoToggle,
  } = useProjectHitos(projectId, report.hitosConsolidados || []);

  const handleRemoveExistingMedia = (mediaId: string) => {
    setDeletedMediaIds((prev) => [...prev, mediaId]);
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        report.id,
        {
          tituloPeriodo: titulo.trim(),
          descripcion: comentarios.trim(),
          fecha,
          hitosConsolidados: selectedHitos,
        },
        newFiles,
        deletedMediaIds
      );
    } catch (err) {
      console.error("Error submitting report update:", err);
      setError(err instanceof Error ? err.message : "Error al guardar el reporte.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-arch-gold/30 bg-arch-gold/5 dark:bg-arch-gold/10 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-arch-gold text-[18px]">edit_note</span>
            <span>Editar reporte de obra</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Modifica los campos del reporte
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor={tituloId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Título del reporte *
        </label>
        <input
          id={tituloId}
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Reporte Junio 2026"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition"
        />
      </div>

      <div>
        <label htmlFor={fechaId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Fecha del reporte *
        </label>
        <input
          id={fechaId}
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition"
        />
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-2">
          Hitos Consolidados en este Período
        </p>
        <p className="text-xs text-slate-400 dark:text-white/35 mb-3 leading-relaxed">
          Selecciona los hitos del proyecto que se han completado o consolidado en este periodo de reporte.
        </p>
        <HitosSelector
          loadingHitos={loadingHitos}
          availableHitos={availableHitos}
          selectedHitos={selectedHitos}
          handleHitoToggle={handleHitoToggle}
        />
      </div>

      <div>
        <label htmlFor={comentariosId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Comentarios del residente / supervisor
        </label>
        <textarea
          id={comentariosId}
          rows={4}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Novedades del período, incidencias, observaciones del avance físico..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition resize-none"
        />
      </div>

      {existingMedia.length > 0 && (
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-2">
            Multimedia Existente
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            {existingMedia.map((media) => {
              const isImage = media.tipoMime?.startsWith("image/");
              const iconName = isImage ? "image" : "video_library";
              return (
                <div
                  key={media.id}
                  className="aspect-video w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden relative group"
                >
                  {isImage && media.urlAcceso ? (
                    <img src={media.urlAcceso} alt={media.nombreOriginal} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                      <span className="material-symbols-outlined text-[24px] text-slate-400 dark:text-white/30">{iconName}</span>
                      <span className="text-[9px] text-slate-400 dark:text-white/40 truncate w-full text-center">{media.nombreOriginal}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingMedia(media.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md flex items-center justify-center"
                    title="Eliminar archivo"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor={filesId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Adjuntar nuevas fotos y videos del período
        </label>
        <div className="flex flex-col gap-3">
          <input
            id={filesId}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={(e) => {
              if (e.target.files) {
                const selectedFiles = Array.from(e.target.files);
                const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
                const oversizedFile = selectedFiles.find(f => f.size > MAX_SIZE);
                if (oversizedFile) {
                  setError(`El archivo "${oversizedFile.name}" supera el límite de 10 MB. Por favor, selecciona archivos más pequeños.`);
                  e.target.value = "";
                  setNewFiles([]);
                  return;
                }
                setError(null);
                setNewFiles(selectedFiles);
              }
            }}
            className="w-full text-xs text-slate-500 dark:text-white/40
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-xs file:font-bold
              file:bg-build-main/10 file:text-build-main
              hover:file:bg-build-main/20
              cursor-pointer"
          />
          {newFiles.length > 0 && (
            <div className="text-xs text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <p className="font-semibold mb-1">Nuevos archivos seleccionados:</p>
              <ul className="list-disc pl-4 space-y-1">
                {newFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!titulo.trim() || submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}