"use client";
 
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Proyecto } from "@/modules/proyectos/types";
import { uploadDocument } from "@/lib/api/documents";
import {
  fetchReportesProyecto,
  createReporte,
  deleteReporte,
  type ReporteResponse,
  type ReporteCreatePayload
} from "@/lib/api/reportes";
import { getEtapasByProyecto, type HitoResponseDTO } from "@/lib/api/obra";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type ObraTabReportesProps = {
  projectId: string;
  avance: number;
  project: Proyecto | null;
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
  const [error, setError] = useState<string | null>(null);
 
  const canEdit = perfil?.rol === "ADMIN" || perfil?.funciones?.includes("OBRA_EDITAR");
 
  const loadReports = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const pageRes = await fetchReportesProyecto(projectId, 0, 100);
      setReports(pageRes.content || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err instanceof Error ? err.message : "Error al cargar reportes.");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadReports();
  }, [projectId]);
 
  const handleCreateReport = async (payload: ReporteCreatePayload, files: File[]) => {
    const report = await createReporte(payload);
    if (files && files.length > 0) {
      let failedUploads = 0;
      let lastErrorMessage = "";
      for (const file of files) {
        const tipo: "FOTO_OBRA" | "VIDEO_OBRA" = file.type.startsWith("image/") ? "FOTO_OBRA" : "VIDEO_OBRA";
        try {
          await uploadDocument(report.id, file, tipo);
        } catch (err) {
          console.error("Error uploading file to report:", err);
          failedUploads++;
          lastErrorMessage = err instanceof Error ? err.message : String(err);
        }
      }
      if (failedUploads > 0) {
        alert(`Se creó el reporte, pero falló la subida de ${failedUploads} archivo(s).\nError del servidor: ${lastErrorMessage}`);
      }
    }
    setShowForm(false);
    await loadReports();
  };
 
  const handleDeleteReport = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte de avance?")) return;
    try {
      await deleteReporte(id);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar el reporte.");
    }
  };
 
  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
 
  const totalPublicados = reports.length;
  const totalBorradores = 0;
 
  // If a report is selected, show detail view
  if (selectedReport) {
    return (
      <ReporteDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        onDelete={() => handleDeleteReport(selectedReport.id)}
        canDelete={canEdit}
      />
    );
  }
 
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
 
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMini icon="description"  label="Total reportes" value={String(reports.length)} />
        <KpiMini icon="check_circle" label="Publicados"     value={String(totalPublicados)} accent="text-emerald-500" />
        <KpiMini icon="edit_note"    label="Borradores"     value={String(totalBorradores)} accent="text-amber-500"   />
        <KpiMini icon="construction" label="Avance actual"  value={`${avance}%`}            accent="text-build-accent" />
      </div>
 
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
          projectName={project?.nombre}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateReport}
        />
      )}
 
      {/* Reports list */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-build-main dark:text-white">Reportes de avance</h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            {sorted.length} reporte{sorted.length !== 1 ? "s" : ""} encontrado{sorted.length !== 1 ? "s" : ""}
            {project ? ` · ${project.nombre}` : ""}
          </p>
        </div>
 
        {loading && reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-5 h-5 text-build-accent mr-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm text-slate-500 dark:text-white/40 font-medium">Cargando reportes...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-6 py-14 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
              content_paste_off
            </span>
            <p className="text-sm font-semibold text-slate-400 dark:text-white/40">No hay reportes registrados</p>
            <p className="text-xs text-slate-300 dark:text-white/20">
              Sube un reporte para comenzar a documentar el avance del proyecto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {sorted.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                onView={() => setSelectedReport(report)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── Report Row ───────────────────────────────────────────────────────────────
 
function ReportRow({ report, onView }: { report: ReporteResponse; onView: () => void }) {
  const badge = ESTADO_BADGE.publicado;
  const hasMedia = (report.multimedia?.length ?? 0) > 0;
 
  return (
    <div
      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
      onClick={onView}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-build-main dark:text-white text-[20px]">article</span>
      </div>
 
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-build-main dark:text-white truncate">{report.tituloPeriodo}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            {new Date(report.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">person</span>
            Supervisor
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">construction</span>
            {report.porcentajeAvance}%
          </span>
          {report.hitosConsolidados && report.hitosConsolidados.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">layers</span>
              {report.hitosConsolidados.length} hitos consolidados
            </span>
          )}
          {hasMedia && (
            <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">photo_library</span>
              Multimedia
            </span>
          )}
        </div>
      </div>
 
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
        {badge.label}
      </span>
 
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          title="Ver detalle"
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
        </button>
      </div>
    </div>
  );
}
 
// ─── Report Detail ────────────────────────────────────────────────────────────
 
function ReporteDetail({
  report,
  onBack,
  onDelete,
  canDelete
}: {
  report: ReporteResponse;
  onBack: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
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
            className="inline-flex items-center gap-1 text-sm font-semibold text-build-accent hover:text-build-main dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a reportes
          </button>
          
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Eliminar reporte
            </button>
          )}
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
 
      {/* Avance general */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-build-main dark:text-white mb-4">Avance general del proyecto</h3>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-3 rounded-full bg-build-accent transition-all"
              style={{ width: `${Math.min(report.porcentajeAvance, 100)}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-build-main dark:text-white w-16 text-right">
            {report.porcentajeAvance}%
          </span>
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
              {report.hitosConsolidados.map((hito, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 font-semibold">
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
            Comentarios del residente / supervisor
          </h3>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.descripcion}</p>
        </div>
      )}
 
      {/* Multimedia */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-build-main dark:text-white mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/40">photo_library</span>
          Fotos y videos del período
        </h3>
        <p className="text-xs text-slate-400 dark:text-white/40 mb-5">
          Evidencias multimedia adjuntadas a este reporte.
        </p>
 
        {hasMedia ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {report.multimedia.map((media) => {
              const isImage = media.tipoMime?.startsWith("image/");
              return (
                <div
                  key={media.id}
                  onClick={() => media.urlAcceso && window.open(media.urlAcceso, "_blank")}
                  className="aspect-video rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer overflow-hidden relative group"
                >
                  {isImage && media.urlAcceso ? (
                    <img src={media.urlAcceso} alt={media.nombreOriginal} className="object-cover w-full h-full" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[28px] text-slate-400 dark:text-white/30">
                        {isImage ? "image" : "video_library"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 px-2 truncate max-w-full">
                        {media.nombreOriginal}
                      </span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[24px]">download</span>
                  </div>
                </div>
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
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onSubmit: (payload: ReporteCreatePayload, files: File[]) => Promise<void>;
};
 
function NuevoReporteForm({ projectId, projectName, onClose, onSubmit }: NuevoReporteFormProps) {
  const [titulo,      setTitulo]      = useState("");
  const [comentarios, setComentarios] = useState("");
  const [files,       setFiles]       = useState<File[]>([]);
  
  const [availableHitos, setAvailableHitos] = useState<HitoResponseDTO[]>([]);
  const [selectedHitos, setSelectedHitos] = useState<string[]>([]);
  const [loadingHitos, setLoadingHitos] = useState(false);
 
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    if (!projectId) return;
    setLoadingHitos(true);
    getEtapasByProyecto(projectId)
      .then((etapas) => {
        const hitos = etapas.map((e) => ({
          id: e.id,
          titulo: e.nombre,
          orden: e.orden,
          tipo: "OBRA",
          estado: e.estado,
          fechaCompletado: null,
        }));
        setAvailableHitos(hitos);
      })
      .catch((err) => {
        console.error("Error loading project hitos:", err);
      })
      .finally(() => setLoadingHitos(false));
  }, [projectId]);
 
  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        uuidProyecto: projectId,
        tituloPeriodo: titulo.trim(),
        descripcion: comentarios.trim(),
        fecha: new Date().toISOString().split("T")[0],
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
    <div className="rounded-xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-build-accent text-[18px]">note_add</span>
            Nuevo reporte de obra
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            {projectName ? `Proyecto: ${projectName}` : "Completa los campos del reporte"}
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
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Título del reporte *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Reporte Junio 2026"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
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
        
        {loadingHitos ? (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-400 dark:text-white/40">
            <svg className="animate-spin w-4 h-4 text-build-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Cargando hitos del proyecto...</span>
          </div>
        ) : availableHitos.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-white/30 italic py-2 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">
            No hay hitos registrados para este proyecto.
          </p>
        ) : (
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
                    onChange={() => {
                      if (isChecked) {
                        setSelectedHitos(selectedHitos.filter((x) => x !== h.titulo));
                      } else {
                        setSelectedHitos([...selectedHitos, h.titulo]);
                      }
                    }}
                    className="rounded text-build-accent border-slate-300 dark:border-white/10 focus:ring-build-accent focus:ring-1 bg-white dark:bg-transparent"
                  />
                  <span className="font-semibold">{h.titulo}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    h.estado === "COMPLETADO" 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                      : h.estado === "EN_PROGRESO" 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                      : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40"
                  }`}>
                    {h.estado}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
 
      {/* Comentarios */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Comentarios del residente / supervisor
        </label>
        <textarea
          rows={4}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Novedades del período, incidencias, observaciones del avance físico..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition resize-none"
        />
      </div>

      {/* Fotos y Videos selector */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Adjuntar fotos y videos del período (Se intentará subir al backend)
        </label>
        <div className="flex flex-col gap-3">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              if (e.target.files) {
                setFiles(Array.from(e.target.files));
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
                {files.map((file, idx) => (
                  <li key={idx} className="truncate">
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
}: {
  icon: string; label: string; value: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-build-accent text-[20px]">{icon}</span>
      </div>  
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">{label}</p>
        <p className={`text-xl font-bold tracking-tight ${accent}`}>{value}</p>
      </div>
    </div>
  );
}