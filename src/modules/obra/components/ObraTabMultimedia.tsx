"use client";

import { useState } from "react";

type MediaTab = "fotos" | "videos" | "galerias";

const MEDIA_TABS: { id: MediaTab; label: string; icon: string }[] = [
  { id: "fotos",    label: "Fotos",    icon: "photo_library" },
  { id: "videos",   label: "Videos",   icon: "videocam"      },
  { id: "galerias", label: "Galerías", icon: "collections"   },
];

type ObraTabMultimediaProps = {
  projectId: string;
};

export default function ObraTabMultimedia({ projectId: _projectId }: ObraTabMultimediaProps) {
  const [tab, setTab] = useState<MediaTab>("fotos");

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {MEDIA_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === t.id
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

      {tab === "fotos"    && <MediaGrid type="foto" />}
      {tab === "videos"   && <MediaGrid type="video" />}
      {tab === "galerias" && <GaleriasPanel />}
    </div>
  );
}

// ── Media grid (fotos / videos) ───────────────────────────────────────────────

function MediaGrid({ type }: { type: "foto" | "video" }) {
  const label = type === "foto" ? "foto" : "video";
  const icon  = type === "foto" ? "add_photo_alternate" : "video_call";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white capitalize">
            {type === "foto" ? "Fotografías" : "Videos"} de obra
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Registro visual del avance en campo.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
          Subir {label}
        </button>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-16 flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
          {type === "foto" ? "image" : "movie"}
        </span>
        <p className="text-sm font-semibold text-slate-400 dark:text-white/40">
          No hay {type === "foto" ? "fotos" : "videos"} registrados
        </p>
        <p className="text-xs text-slate-300 dark:text-white/20">
          Sube archivos para documentar el avance visual de la obra.
        </p>
      </div>
    </div>
  );
}

// ── Galleries panel ───────────────────────────────────────────────────────────

function GaleriasPanel() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-build-main dark:text-white">Galerías</h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Agrupaciones temáticas de multimedia.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-build-main text-white rounded-lg text-xs font-bold hover:bg-build-main/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
          Nueva galería
        </button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-16 flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/20">
          collections
        </span>
        <p className="text-sm font-semibold text-slate-400 dark:text-white/40">
          No hay galerías creadas
        </p>
        <p className="text-xs text-slate-300 dark:text-white/20">
          Crea una galería para agrupar fotos y videos por etapa o fecha.
        </p>
      </div>
    </div>
  );
}