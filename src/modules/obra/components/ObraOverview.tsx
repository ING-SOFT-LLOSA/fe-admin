"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchProyectos } from "@/modules/proyectos/services";
import { getAvanceGeneral } from "@/lib/api/obra";
import type { Proyecto } from "@/modules/proyectos/types";

type ProjectProgressRow = Proyecto & {
  porcentajeAvance?: number;
};

function barColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-400";
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
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los proyectos.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProjects();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-build-main dark:text-white md:text-3xl">
            Avance de Obra
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
            Seguimiento constructivo por proyecto, etapas, hitos y evidencia visual.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o dirección..."
            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 pl-9 pr-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              {["Proyecto", "Ubicación", "Avance", "Acción"].map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                  Cargando avances...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                  {search ? "Ningún proyecto coincide con la búsqueda." : "No hay proyectos registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((project) => {
                const pct = project.porcentajeAvance ?? 0;
                return (
                  <tr
                    key={project.id}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                    onClick={() => { window.location.href = `/obra/${project.id}`; }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-build-main dark:text-white group-hover:text-arch-gold dark:group-hover:text-arch-gold transition-colors">
                          {project.nombre}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-white/20 group-hover:text-arch-gold dark:group-hover:text-arch-gold transition-colors">
                          arrow_forward
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-white/70">
                      {project.direccion || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className={`h-2 rounded-full ${barColor(pct)} transition-all`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-600 dark:text-emerald-400" : pct >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/obra/${project.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-build-main px-3 py-2 text-xs font-bold text-white hover:bg-build-main/90 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">engineering</span>
                        Abrir obra
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}