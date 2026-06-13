"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import { apiFetch } from "@/lib/api/http";
import { Proyecto } from "../types/proyecto";

// ─── Skeleton card shown during loading ───────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
      <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsOverview() {
  const [projects, setProjects]   = useState<Proyecto[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [dptosCountMap, setDptosCountMap] = useState<Record<string, number>>({});
  const [avanceMap, setAvanceMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const [projData, contractsData] = await Promise.all([
          apiFetch<Proyecto[]>("/api/proyectos"),
          apiFetch<any>("/api/expedientes?unpaginated=true").catch(() => []),
        ]);

        if (!mounted) return;

        setProjects(projData || []);
        const list = Array.isArray(contractsData)
          ? contractsData
          : (contractsData?.content || []);
        setContracts(list);

        // Fetch assets and physical progress for each project in parallel
        const assetsMap: Record<string, number> = {};
        const progressMap: Record<string, number> = {};
        if (projData && projData.length > 0) {
          await Promise.all(
            projData.map(async (p) => {
              try {
                const [assetsPage, progressData] = await Promise.all([
                  apiFetch<any>(`/api/activos/proyecto/${p.id}?size=9999`),
                  apiFetch<any>(`/api/proyectos/${p.id}/avance-general`).catch(() => null),
                ]);
                const content = assetsPage?.content || [];
                const dptosCount = content.filter((a: any) => a.tipo === "DEPARTAMENTO").length;
                assetsMap[p.id] = dptosCount;
                progressMap[p.id] = progressData?.porcentajeAvance ?? 0;
              } catch (err) {
                console.error(`Error loading details for project ${p.id}:`, err);
                assetsMap[p.id] = 0;
                progressMap[p.id] = 0;
              }
            })
          );
        }
        if (mounted) {
          setDptosCountMap(assetsMap);
          setAvanceMap(progressMap);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudieron cargar los proyectos.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadData();
    return () => { mounted = false; };
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     projects.length,
    activos:   projects.filter((p) => (p as any).estado === "ACTIVO" || (p as any).activo !== false).length,
    enObra:    projects.filter((p) => (p as any).estado === "EN_CONSTRUCCION").length,
    entregados:projects.filter((p) => (p as any).estado === "ENTREGADO").length,
  }), [projects]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
const filtered = useMemo(() => {
  return projects.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
}, [projects, search]);
  const hasFilters = !!search;

  return (
    <section className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-build-main dark:text-white md:text-3xl">
            Proyectos
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Proyectos activos — entra al detalle para editar información.
          </p>
        </div>
        <Link
          href="/proyectos/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-build-main px-4 py-2.5 text-sm font-semibold text-white hover:bg-build-main/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo proyecto
        </Link>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",      value: stats.total,      color: "text-build-main dark:text-white" },
          { label: "Activos",    value: stats.activos,    color: "text-emerald-600 dark:text-emerald-400" },
          { label: "En obra",    value: stats.enObra,     color: "text-amber-600 dark:text-amber-400" },
          { label: "Entregados", value: stats.entregados, color: "text-slate-500 dark:text-white/50" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-white/50 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>
              {isLoading
                ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                : value
              }
            </p>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400 dark:text-white/30 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar proyecto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-3 py-2 text-xs text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>


        {hasFilters && (
          <button
            onClick={() => {setSearch("");}}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Limpiar
          </button>
        )}

        {!isLoading && (
          <span className="ml-auto text-xs text-slate-400 dark:text-white/30 tabular-nums">
            {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-14 text-center">
          <span className="material-symbols-outlined text-[32px] text-slate-400 dark:text-white/40">
            {hasFilters ? "search_off" : "folder_open"}
          </span>
          <h2 className="mt-3 text-base font-semibold text-build-main dark:text-white">
            {hasFilters ? "Sin resultados" : "No hay proyectos"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
            {hasFilters
              ? "Ningún proyecto coincide con los filtros aplicados."
              : "Cuando se registren proyectos aparecerán aquí."}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); }}
              className="mt-4 text-xs font-semibold text-build-accent hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const dptosCount = dptosCountMap[project.id] ?? 0;
            const projectClients = new Set<number>();
            contracts.forEach((c) => {
              const hasAssetInProject = c.activos?.some((a: any) => a.proyectoNombre === project.nombre);
              if (hasAssetInProject) {
                c.clientes?.forEach((client: any) => {
                  projectClients.add(client.id);
                });
              }
            });
            const clientesCount = projectClients.size;

            return (
              <ProjectCard
                key={project.id}
                project={project}
                clientesCount={clientesCount}
                dptosCount={dptosCount}
                avance={avanceMap[project.id] ?? 0}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}