"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocCategoria = "anteproyecto" | "licencia" | "planos" | "acabados" | "certificacion";

type Documento = {
  id: string;
  nombre: string;
  categoria: DocCategoria;
  version: string;
  fechaCarga: string;
  subidoPor: string;
  tamanio: string;
  tipo: "pdf" | "dwg" | "xlsx" | "docx" | "jpg";
  estado: "vigente" | "reemplazado" | "pendiente_revision";
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

const ESTADO_BADGE: Record<Documento["estado"], { label: string; cls: string }> = {
  vigente:             { label: "Vigente",           cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  reemplazado:         { label: "Reemplazado",       cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"              },
  pendiente_revision:  { label: "Pend. revisión",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
};

const TIPO_ICON: Record<Documento["tipo"], { icon: string; color: string }> = {
  pdf:  { icon: "picture_as_pdf", color: "text-red-500"     },
  dwg:  { icon: "square_foot",    color: "text-blue-500"    },
  xlsx: { icon: "table_chart",    color: "text-green-600"   },
  docx: { icon: "article",        color: "text-blue-600"    },
  jpg:  { icon: "image",          color: "text-purple-500"  },
};

// Demo seed data — will be replaced with real API data
const SEED_DOCS: Documento[] = [
  // Anteproyecto
  {
    id: "DOC-A01",
    nombre: "Anteproyecto Aprobado — Memoria Descriptiva",
    categoria: "anteproyecto",
    version: "v1.0",
    fechaCarga: "2025-08-15",
    subidoPor: "Arq. Sánchez",
    tamanio: "4.2 MB",
    tipo: "pdf",
    estado: "vigente",
  },
  {
    id: "DOC-A02",
    nombre: "Resolución de Aprobación Municipal",
    categoria: "anteproyecto",
    version: "v1.0",
    fechaCarga: "2025-08-20",
    subidoPor: "Arq. Sánchez",
    tamanio: "1.8 MB",
    tipo: "pdf",
    estado: "vigente",
  },
  // Licencia
  {
    id: "DOC-L01",
    nombre: "Licencia de Construcción — Resolución N° 2025-0487",
    categoria: "licencia",
    version: "v1.0",
    fechaCarga: "2025-10-01",
    subidoPor: "Legal",
    tamanio: "2.1 MB",
    tipo: "pdf",
    estado: "vigente",
  },
  {
    id: "DOC-L02",
    nombre: "Conformidad de Obra — Certificado",
    categoria: "licencia",
    version: "v1.0",
    fechaCarga: "2026-05-28",
    subidoPor: "Legal",
    tamanio: "890 KB",
    tipo: "pdf",
    estado: "pendiente_revision",
  },
  // Planos
  {
    id: "DOC-P01",
    nombre: "Plano de Arquitectura — Planta General",
    categoria: "planos",
    version: "v3.2",
    fechaCarga: "2026-03-12",
    subidoPor: "Ing. Torres",
    tamanio: "18.5 MB",
    tipo: "dwg",
    estado: "vigente",
  },
  {
    id: "DOC-P02",
    nombre: "Plano de Estructuras — Cimentación",
    categoria: "planos",
    version: "v2.1",
    fechaCarga: "2026-01-20",
    subidoPor: "Ing. Quispe",
    tamanio: "22.3 MB",
    tipo: "dwg",
    estado: "vigente",
  },
  {
    id: "DOC-P03",
    nombre: "Plano de IIEE — Red General",
    categoria: "planos",
    version: "v1.0",
    fechaCarga: "2025-12-05",
    subidoPor: "Ing. Campos",
    tamanio: "15.1 MB",
    tipo: "dwg",
    estado: "reemplazado",
  },
  {
    id: "DOC-P04",
    nombre: "Plano de IIEE — Red General (Actualizado)",
    categoria: "planos",
    version: "v2.0",
    fechaCarga: "2026-04-18",
    subidoPor: "Ing. Campos",
    tamanio: "16.8 MB",
    tipo: "dwg",
    estado: "vigente",
  },
  {
    id: "DOC-P05",
    nombre: "Plano de IISS — Red Agua y Desagüe",
    categoria: "planos",
    version: "v1.1",
    fechaCarga: "2026-02-10",
    subidoPor: "Ing. Rivera",
    tamanio: "14.7 MB",
    tipo: "dwg",
    estado: "vigente",
  },
  // Acabados
  {
    id: "DOC-AC01",
    nombre: "Cuadro de Acabados — Departamentos Tipo A",
    categoria: "acabados",
    version: "v2.0",
    fechaCarga: "2026-04-01",
    subidoPor: "Arq. Díaz",
    tamanio: "3.4 MB",
    tipo: "xlsx",
    estado: "vigente",
  },
  {
    id: "DOC-AC02",
    nombre: "Cuadro de Acabados — Áreas Comunes",
    categoria: "acabados",
    version: "v1.0",
    fechaCarga: "2026-03-15",
    subidoPor: "Arq. Díaz",
    tamanio: "2.8 MB",
    tipo: "xlsx",
    estado: "vigente",
  },
  // Certificación
  {
    id: "DOC-C01",
    nombre: "Pre-certificación EDGE — Informe Preliminar",
    categoria: "certificacion",
    version: "v1.0",
    fechaCarga: "2026-01-10",
    subidoPor: "Consultoría Green",
    tamanio: "5.6 MB",
    tipo: "pdf",
    estado: "vigente",
  },
  {
    id: "DOC-C02",
    nombre: "Simulación Energética — EDGE App Export",
    categoria: "certificacion",
    version: "v1.0",
    fechaCarga: "2026-01-10",
    subidoPor: "Consultoría Green",
    tamanio: "1.2 MB",
    tipo: "xlsx",
    estado: "vigente",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObraTabDocumentacion({ projectId: _projectId }: ObraTabDocumentacionProps) {
  const [activeCategoria, setActiveCategoria] = useState<DocCategoria | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const filteredDocs = SEED_DOCS.filter((d) => {
    if (activeCategoria && d.categoria !== activeCategoria) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.nombre.toLowerCase().includes(q) ||
        d.subidoPor.toLowerCase().includes(q) ||
        d.tipo.includes(q)
      );
    }
    return true;
  });

  const totalVigentes = SEED_DOCS.filter((d) => d.estado === "vigente").length;
  const totalPendientes = SEED_DOCS.filter((d) => d.estado === "pendiente_revision").length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMini icon="folder_open" label="Total documentos" value={String(SEED_DOCS.length)} />
        <KpiMini icon="verified" label="Vigentes" value={String(totalVigentes)} accent="text-emerald-500" />
        <KpiMini icon="pending" label="Pend. revisión" value={String(totalPendientes)} accent="text-amber-500" />
        <KpiMini icon="category" label="Categorías" value={String(CATEGORIAS.length)} accent="text-blue-500" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          Subir documento
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && <UploadDocPanel onClose={() => setShowUpload(false)} />}

      {/* Category cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CATEGORIAS.map((cat) => {
          const count = SEED_DOCS.filter((d) => d.categoria === cat.id && d.estado === "vigente").length;
          const isActive = activeCategoria === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoria(isActive ? null : cat.id)}
              className={`
                text-left rounded-xl border p-4 transition-all group
                ${isActive
                  ? "border-build-accent bg-build-accent/5 dark:bg-build-accent/10 shadow-sm ring-1 ring-build-accent/30"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-build-accent/50 hover:shadow-sm"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${isActive
                    ? "bg-build-accent/20 text-build-accent"
                    : "bg-build-bg dark:bg-white/10 text-slate-500 dark:text-white/50 group-hover:text-build-accent"
                  }
                `}>
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                </div>
                <span className={`
                  text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${isActive
                    ? "bg-build-accent/20 text-build-accent"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"
                  }
                `}>
                  {count}
                </span>
              </div>
              <p className={`text-xs font-bold leading-tight ${isActive ? "text-build-accent" : "text-build-main dark:text-white"}`}>
                {cat.label}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-white/40 mt-0.5 line-clamp-2">
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Documents table */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-build-main dark:text-white">
              {activeCategoria
                ? CATEGORIAS.find((c) => c.id === activeCategoria)?.label
                : "Todos los documentos"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              {filteredDocs.length} documento{filteredDocs.length !== 1 ? "s" : ""}
              {searchQuery ? ` coinciden con "${searchQuery}"` : ""}
            </p>
          </div>
          {activeCategoria && (
            <button
              type="button"
              onClick={() => setActiveCategoria(null)}
              className="text-xs font-semibold text-build-accent hover:text-build-main dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Limpiar filtro
            </button>
          )}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="px-6 py-14 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
              folder_off
            </span>
            <p className="text-sm font-semibold text-slate-400 dark:text-white/40">
              No se encontraron documentos
            </p>
            <p className="text-xs text-slate-300 dark:text-white/20">
              {searchQuery
                ? "Intenta con otro término de búsqueda."
                : "Sube documentos técnicos para esta categoría."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
              <tr>
                {["Documento", "Categoría", "Versión", "Subido por", "Fecha", "Tamaño", "Estado", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDocs.map((doc) => {
                const tipoInfo = TIPO_ICON[doc.tipo];
                const badge = ESTADO_BADGE[doc.estado];
                const catLabel = CATEGORIAS.find((c) => c.id === doc.categoria)?.label ?? doc.categoria;

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${tipoInfo.color}`}>
                          {tipoInfo.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-build-main dark:text-white truncate max-w-[260px]">
                            {doc.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase">{doc.tipo.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 dark:text-white/50">{catLabel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-build-main dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                        {doc.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-white/50">{doc.subidoPor}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-white/50 whitespace-nowrap">
                      {new Date(doc.fechaCarga).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-white/50">{doc.tamanio}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Ver documento"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          title="Descargar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                        <button
                          type="button"
                          title="Subir nueva versión"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">upload</span>
                        </button>
                        <button
                          type="button"
                          title="Más opciones"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-build-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────

function UploadDocPanel({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre]       = useState("");
  const [categoria, setCategoria] = useState<DocCategoria>("planos");
  const [version, setVersion]     = useState("v1.0");

  return (
    <div className="rounded-xl border border-build-accent/30 bg-build-accent/5 dark:bg-build-accent/10 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-build-accent text-[18px]">upload_file</span>
            Subir documento técnico
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Sube planos, licencias, cuadros de acabados u otros documentos del proyecto.
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

      <div className="grid gap-4 md:grid-cols-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
            Nombre del documento *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Plano de Arquitectura — Planta Nivel 3"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as DocCategoria)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1.5">
            Versión
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1.0"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-4 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500 dark:text-white/50 hover:border-build-accent hover:text-build-accent transition-colors">
          <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
          <span>Seleccionar archivo (.pdf, .dwg, .xlsx, .docx)</span>
          <input type="file" className="hidden" accept=".pdf,.dwg,.xlsx,.docx,.jpg,.png" />
        </label>
        <button
          type="button"
          disabled={!nombre.trim()}
          className="rounded-xl bg-build-main px-6 py-3 text-sm font-bold text-white hover:bg-build-main/90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">publish</span>
          Subir
        </button>
      </div>
    </div>
  );
}

// ─── KPI Mini ─────────────────────────────────────────────────────────────────

function KpiMini({
  icon,
  label,
  value,
  accent = "text-build-main dark:text-white",
}: {
  icon: string;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-build-bg dark:bg-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-build-accent text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">{label}</p>
        <p className={`text-xl font-bold tracking-tight ${accent}`}>{value}</p>
      </div>
    </div>
  );
}
