"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchProyectos } from "@/modules/proyectos/services";
import { getAvanceGeneral } from "@/lib/api/obra";
import type { Proyecto } from "@/modules/proyectos/types";

type ProjectProgressRow = Proyecto & {
  porcentajeAvance?: number;
};

function getProgressMeta(pct: number): {
  bar: string;
  glow: string;
  text: string;
  badge: string;
  label: string;
  icon: string;
} {
  if (pct >= 70)
    return {
      bar: "bg-emerald-500",
      glow: "shadow-emerald-400/30",
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      label: "Avanzado",
      icon: "trending_up",
    };
  if (pct >= 30)
    return {
      bar: "bg-amber-500",
      glow: "shadow-amber-400/30",
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      label: "En proceso",
      icon: "construction",
    };
  return {
    bar: "bg-red-400",
    glow: "shadow-red-400/20",
    text: "text-red-500 dark:text-red-400",
    badge: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    label: "Inicial",
    icon: "pending",
  };
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-slate-100 dark:bg-white/10" />
          <div className="h-3 w-24 rounded bg-slate-100 dark:bg-white/10" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/10" />
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 mb-4" />
      <div className="h-8 w-28 rounded-lg bg-slate-100 dark:bg-white/10" />
    </div>
  );
}

export default function ObraOverview() {
  const [projects, setProjects] = useState<ProjectProgressRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.direccion?.toLowerCase().includes(q),
    );
  }, [search, projects]);

  useEffect(() => {
    let mounted = true;
    async function loadProjects() {
      setIsLoading(true);
      setError("");
      try {
        const rows = await fetchProyectos();
        const withProgress = await Promise.all(
          rows.map(async (project) => {
            try {
              const progress = await getAvanceGeneral(project.id);
              return { ...project, porcentajeAvance: progress.porcentajeAvance };
            } catch {
              return { ...project, porcentajeAvance: 0 };
            }
          }),
        );
        if (mounted) setProjects(withProgress);
      } catch (loadError) {
        if (mounted)
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los proyectos.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadProjects();
    return () => { mounted = false; };
  }, []);


  return (
    <section className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
          Avance de Obra
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
          Seguimiento constructivo por proyecto, etapas, hitos y evidencia visual.
        </p>
      </div>


      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          {error}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-white/30 pointer-events-none">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proyecto por nombre o dirección…"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm text-build-main dark:text-white outline-none transition focus:border-arch-gold focus:ring-2 focus:ring-arch-gold/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-build-main dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* ── Project cards grid ── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-16 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[48px] text-slate-200 dark:text-white/10">domain</span>
          <p className="text-sm font-semibold text-slate-500 dark:text-white/40">
            {search ? "Ningún proyecto coincide con la búsqueda." : "No hay proyectos registrados."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-arch-gold hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const pct  = Math.round(Math.min(project.porcentajeAvance ?? 0, 100));
            const meta = getProgressMeta(pct);

            return (
              <Link
                key={project.id}
                href={`/obra/${project.id}`}
                className="group relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4 overflow-hidden"
              >
                {/* Accent top bar */}
                <div className={`absolute inset-x-0 top-0 h-0.5 ${meta.bar} opacity-60`} />

                {/* Project name + badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-build-main dark:text-white group-hover:text-arch-gold dark:group-hover:text-arch-gold transition-colors truncate">
                      {project.nombre}
                    </h3>
                    {project.direccion && (
                      <p className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-white/40 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {project.direccion}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badge}`}>
                    <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
                    {meta.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Avance general
                    </span>
                    <span className={`text-sm font-bold ${meta.text}`}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* CTA row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-white/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">engineering</span>
                    <span>Ver detalles</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-white/20 group-hover:text-arch-gold dark:group-hover:text-arch-gold group-hover:translate-x-0.5 transition-all duration-200">
                    arrow_forward
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-white/30 text-right">
          {filtered.length} proyecto{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}
        </p>
      )}

    </section>
  );
}
