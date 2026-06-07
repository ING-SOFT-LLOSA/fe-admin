"use client";

import { useState } from "react";

import type { Proyecto } from "@/modules/proyectos/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportePeriodo = "mensuales" | "trimestrales" | "historicos";

type AvancePiso = {
  piso: string;
  descripcion: string;
  avance: number;
};

type Reporte = {
  id: string;
  titulo: string;
  periodo: string;
  fechaEmision: string;
  estado: "borrador" | "publicado" | "archivado";
  avanceAlMomento: number;
  autor: string;
  comentarios?: string;
  avancePorPiso?: AvancePiso[];
  fotos?: string[];
  videos?: string[];
};

type ObraTabReportesProps = {
  projectId: string;
  avance: number;
  project: Proyecto | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODO_TABS: { id: ReportePeriodo; label: string; icon: string }[] = [
  { id: "mensuales",    label: "Mensuales",    icon: "calendar_month" },
  { id: "trimestrales", label: "Trimestrales", icon: "date_range"     },
  { id: "historicos",   label: "Históricos",   icon: "history"        },
];

const ESTADO_BADGE: Record<Reporte["estado"], { label: string; cls: string }> = {
  borrador:  { label: "Borrador",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
  publicado: { label: "Publicado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  archivado: { label: "Archivado", cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"              },
};

// Seed demo data — replace with real API calls when backend exposes reports
const SEED_REPORTS: Reporte[] = [
  {
    id: "RPT-001",
    titulo: "Reporte Mensual — Mayo 2026",
    periodo: "Mayo 2026",
    fechaEmision: "2026-06-01",
    estado: "publicado",
    avanceAlMomento: 68,
    autor: "Ing. García",
    comentarios: "Se completó el casco del piso 4. Se detectaron retrasos en la entrega de carpintería metálica para pisos 2 y 3.",
    avancePorPiso: [
      { piso: "Piso 1", descripcion: "Acabados secos",    avance: 100 },
      { piso: "Piso 2", descripcion: "Acabados húmedos",  avance: 85  },
      { piso: "Piso 3", descripcion: "Instalaciones",     avance: 70  },
      { piso: "Piso 4", descripcion: "Casco completado",  avance: 55  },
      { piso: "Piso 5", descripcion: "En estructura",     avance: 30  },
    ],
  },
  {
    id: "RPT-002",
    titulo: "Reporte Mensual — Abril 2026",
    periodo: "Abril 2026",
    fechaEmision: "2026-05-02",
    estado: "publicado",
    avanceAlMomento: 54,
    autor: "Ing. García",
    comentarios: "Avance según lo programado. Sin incidencias relevantes.",
    avancePorPiso: [
      { piso: "Piso 1", descripcion: "Acabados secos",   avance: 90 },
      { piso: "Piso 2", descripcion: "Acabados húmedos", avance: 65 },
      { piso: "Piso 3", descripcion: "Instalaciones",    avance: 40 },
    ],
  },
  {
    id: "RPT-003",
    titulo: "Reporte Mensual — Junio 2026",
    periodo: "Junio 2026",
    fechaEmision: "2026-06-04",
    estado: "borrador",
    avanceAlMomento: 72,
    autor: "Ing. López",
    comentarios: "",
    avancePorPiso: [],
  },
  {
    id: "RPT-T01",
    titulo: "Reporte Trimestral — Q1 2026",
    periodo: "Ene – Mar 2026",
    fechaEmision: "2026-04-05",
    estado: "publicado",
    avanceAlMomento: 38,
    autor: "Gerencia Técnica",
  },
  {
    id: "RPT-T02",
    titulo: "Reporte Trimestral — Q2 2026",
    periodo: "Abr – Jun 2026",
    fechaEmision: "2026-06-04",
    estado: "borrador",
    avanceAlMomento: 72,
    autor: "Gerencia Técnica",
  },
  {
    id: "RPT-H01",
    titulo: "Informe de Inicio de Proyecto",
    periodo: "Histórico",
    fechaEmision: "2025-11-15",
    estado: "archivado",
    avanceAlMomento: 0,
    autor: "Dir. Proyectos",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ObraTabReportes({ projectId: _projectId, avance, project }: ObraTabReportesProps) {
  const [periodo,        setPeriodo]        = useState<ReportePeriodo>("mensuales");
  const [showForm,       setShowForm]       = useState(false);
  const [selectedReport, setSelectedReport] = useState<Reporte | null>(null);

  const filtered = SEED_REPORTS.filter((r) => {
    if (periodo === "mensuales")    return r.id.startsWith("RPT-0");
    if (periodo === "trimestrales") return r.id.startsWith("RPT-T");
    return r.id.startsWith("RPT-H");
  });

  const totalPublicados = SEED_REPORTS.filter((r) => r.estado === "publicado").length;
  const totalBorradores = SEED_REPORTS.filter((r) => r.estado === "borrador").length;

  // If a report is selected, show detail view
  if (selectedReport) {
    return (
      <ReporteDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMini icon="description"  label="Total reportes" value={String(SEED_REPORTS.length)} />
        <KpiMini icon="check_circle" label="Publicados"     value={String(totalPublicados)} accent="text-emerald-500" />
        <KpiMini icon="edit_note"    label="Borradores"     value={String(totalBorradores)} accent="text-amber-500"   />
        <KpiMini icon="construction" label="Avance actual"  value={`${avance}%`}            accent="text-build-accent" />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {PERIODO_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriodo(t.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${periodo === t.id
                  ? "bg-build-main text-white"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10"
                }
              `}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">{showForm ? "close" : "upload_file"}</span>
          {showForm ? "Cancelar" : "Nuevo reporte"}
        </button>
      </div>

      {/* New report form */}
      {showForm && (
        <NuevoReporteForm
          projectName={project?.nombre}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Reports list */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-build-main dark:text-white">
            Reportes — {PERIODO_TABS.find((t) => t.id === periodo)?.label}
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            {filtered.length} reporte{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            {project ? ` · ${project.nombre}` : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
              content_paste_off
            </span>
            <p className="text-sm font-semibold text-slate-400 dark:text-white/40">No hay reportes de este tipo</p>
            <p className="text-xs text-slate-300 dark:text-white/20">
              Sube un reporte para comenzar a documentar el avance del proyecto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.map((report) => (
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

function ReportRow({ report, onView }: { report: Reporte; onView: () => void }) {
  const badge = ESTADO_BADGE[report.estado];
  const hasMedia = (report.fotos?.length ?? 0) + (report.videos?.length ?? 0) > 0;

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
      onClick={onView}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-build-main dark:text-white text-[20px]">article</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-build-main dark:text-white truncate">{report.titulo}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            {new Date(report.fechaEmision).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">person</span>
            {report.autor}
          </span>
          <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">construction</span>
            {report.avanceAlMomento}%
          </span>
          {report.avancePorPiso && report.avancePorPiso.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">layers</span>
              {report.avancePorPiso.length} pisos
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
        <button
          type="button"
          title="Descargar"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
        </button>
      </div>
    </div>
  );
}

// ─── Report Detail ────────────────────────────────────────────────────────────

function ReporteDetail({ report, onBack }: { report: Reporte; onBack: () => void }) {
  const badge = ESTADO_BADGE[report.estado];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-build-accent hover:text-build-main dark:hover:text-white mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a reportes
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-build-main dark:text-white">{report.titulo}</h2>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">
              {report.autor} · {new Date(report.fechaEmision).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
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
              style={{ width: `${Math.min(report.avanceAlMomento, 100)}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-build-main dark:text-white w-16 text-right">
            {report.avanceAlMomento}%
          </span>
        </div>
      </div>

      {/* Avance por piso */}
      {report.avancePorPiso && report.avancePorPiso.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-sm font-bold text-build-main dark:text-white">Avance por piso / unidad</h3>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              Estado de avance desglosado al momento del reporte.
            </p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
              <tr>
                {["Piso / Unidad", "Descripción", "Avance"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {report.avancePorPiso.map((row) => (
                <tr key={row.piso} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-sm font-bold text-build-main dark:text-white">{row.piso}</td>
                  <td className="px-5 py-3 text-sm text-slate-500 dark:text-white/50">{row.descripcion}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-build-accent transition-all"
                          style={{ width: `${Math.min(row.avance, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-build-main dark:text-white w-10">{row.avance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comentarios */}
      {report.comentarios && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-build-main dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/40">comment</span>
            Comentarios del residente / supervisor
          </h3>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.comentarios}</p>
        </div>
      )}

      {/* Multimedia */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-build-main dark:text-white mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/40">photo_library</span>
          Fotos y videos del mes
        </h3>
        <p className="text-xs text-slate-400 dark:text-white/40 mb-5">
          Archivos multimedia asociados a este reporte.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Foto slots */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`foto-${i}`}
              className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px] text-slate-200 dark:text-white/20">
                add_photo_alternate
              </span>
              <span className="text-xs text-slate-300 dark:text-white/20">Subir foto</span>
            </div>
          ))}
          {/* Video slot */}
          <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[28px] text-slate-200 dark:text-white/20">video_call</span>
            <span className="text-xs text-slate-300 dark:text-white/20">Subir video</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Report Form ──────────────────────────────────────────────────────────

function NuevoReporteForm({ projectName, onClose }: { projectName?: string; onClose: () => void }) {
  const [titulo,      setTitulo]      = useState("");
  const [tipo,        setTipo]        = useState("mensual");
  const [comentarios, setComentarios] = useState("");
  const [pisos, setPisos] = useState<AvancePiso[]>([
    { piso: "Piso 1", descripcion: "", avance: 0 },
  ]);

  function addPiso() {
    setPisos((prev) => [...prev, { piso: `Piso ${prev.length + 1}`, descripcion: "", avance: 0 }]);
  }

  function removePiso(index: number) {
    setPisos((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePiso(index: number, field: keyof AvancePiso, value: string | number) {
    setPisos((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

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

      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
            Título del reporte *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Reporte Mensual — Junio 2026"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          >
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="historico">Histórico</option>
          </select>
        </div>
      </div>

      {/* Avance por piso */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50">
              Avance por piso / unidad
            </p>
            <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">
              Detalla el estado de cada piso al momento del reporte.
            </p>
          </div>
          <button
            type="button"
            onClick={addPiso}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-build-main dark:text-white hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Agregar piso
          </button>
        </div>

        <div className="space-y-2">
          {pisos.map((piso, index) => (
            <div key={index} className="grid grid-cols-[1fr_2fr_120px_36px] gap-2 items-center">
              <input
                type="text"
                value={piso.piso}
                onChange={(e) => updatePiso(index, "piso", e.target.value)}
                placeholder="Piso 1"
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent transition"
              />
              <input
                type="text"
                value={piso.descripcion}
                onChange={(e) => updatePiso(index, "descripcion", e.target.value)}
                placeholder="Ej. Acabados secos en progreso"
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent transition"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={piso.avance}
                  onChange={(e) => updatePiso(index, "avance", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-build-main dark:text-white outline-none focus:border-build-accent transition"
                />
                <span className="text-xs text-slate-400 dark:text-white/40 shrink-0">%</span>
              </div>
              <button
                type="button"
                onClick={() => removePiso(index)}
                disabled={pisos.length === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comentarios */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Comentarios del residente / supervisor
        </label>
        <textarea
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Novedades del mes, incidencias, observaciones..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition resize-none"
        />
      </div>

      {/* Multimedia */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-3">
          Fotos y videos del mes
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-6 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[28px] text-slate-300 dark:text-white/20">add_photo_alternate</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-white/40">Subir fotos</span>
            <span className="text-[11px] text-slate-300 dark:text-white/20">JPG, PNG, WEBP</span>
            <input type="file" className="hidden" accept="image/*" multiple />
          </label>
          <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-6 flex flex-col items-center justify-center gap-2 text-center hover:border-build-accent hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[28px] text-slate-300 dark:text-white/20">video_call</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-white/40">Subir videos</span>
            <span className="text-[11px] text-slate-300 dark:text-white/20">MP4, MOV, AVI</span>
            <input type="file" className="hidden" accept="video/*" multiple />
          </label>
        </div>
      </div>

      {/* File attachment */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
          Archivo del reporte (opcional)
        </label>
        <label className="cursor-pointer flex items-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 px-4 py-3 hover:border-build-accent hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-[22px]">attach_file</span>
          <span className="text-sm text-slate-400 dark:text-white/40">Adjuntar PDF o Word</span>
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/50 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!titulo.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">publish</span>
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