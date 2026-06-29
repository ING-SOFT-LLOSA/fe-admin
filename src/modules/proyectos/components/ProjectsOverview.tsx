"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import { apiFetch } from "@/lib/api/http";
import { fetchProyectos } from "@/lib/api/proyectos";
import { Proyecto } from "../types/proyecto";

async function fetchProjectDetails(projectId: string) {
  try {
    const [assetsPage, progressData] = await Promise.all([
      apiFetch<{ content?: { tipo: string }[] }>(`/api/activos/proyecto/${projectId}?size=9999`),
      apiFetch<{ porcentajeAvance?: number }>(`/api/proyectos/${projectId}/avance-general`).catch(() => null),
    ]);
    const content = assetsPage?.content || [];
    const dptosCount = content.filter((a) => a.tipo === "DEPARTAMENTO").length;
    return {
      dptosCount,
      porcentajeAvance: progressData?.porcentajeAvance ?? 0,
    };
  } catch (err) {
    console.error(`Error loading details for project ${projectId}:`, err);
    return {
      dptosCount: 0,
      porcentajeAvance: 0,
    };
  }
}

// ─── Skeleton card shown during loading ───────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
      <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
      <div className="grid gap-3 md:grid-cols-3">
        {["s1", "s2", "s3"].map((key) => (
          <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

interface ContractOverview {
  activos?: { proyectoNombre: string }[];
  clientes?: { id: number }[];
}

const getClientCountForProject = (projectName: string, allContracts: ContractOverview[]) => {
  const projectClients = new Set<number>();
  for (const c of allContracts) {
    const hasAssetInProject = c.activos?.some((a) => a.proyectoNombre === projectName);
    if (hasAssetInProject) {
      c.clientes?.forEach((client) => projectClients.add(client.id));
    }
  }
  return projectClients.size;
};

export default function ProjectsOverview() {

  const [projects, setProjects]   = useState<Proyecto[]>([]);
  const [contracts, setContracts] = useState<ContractOverview[] | null>(null);
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
        const projData = await fetchProyectos();

        if (!mounted) return;

        setProjects(projData || []);
        setIsLoading(false); // Renderiza los proyectos inmediatamente

        // 1. Cargar contratos en segundo plano de forma no bloqueante
        apiFetch<unknown>("/api/expedientes?unpaginated=true")
          .then((contractsData) => {
            if (!mounted) return;
            const list = (Array.isArray(contractsData)
              ? contractsData
              : ((contractsData as { content?: unknown[] })?.content || [])) as ContractOverview[];
            setContracts(list);
          })
          .catch((err) => console.error("Error loading contracts for stats:", err));

        // 2. Cargar detalles (Dptos y avance) por proyecto de forma diferida y paralela
        if (projData && projData.length > 0) {
          projData.forEach((p) => {
            fetchProjectDetails(p.id)
              .then((details) => {
                if (!mounted) return;
                setDptosCountMap((prev) => ({ ...prev, [p.id]: details.dptosCount }));
                setAvanceMap((prev) => ({ ...prev, [p.id]: details.porcentajeAvance }));
              })
              .catch((err) => console.error(`Error loading details for project ${p.id}:`, err));
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los proyectos.");
          setIsLoading(false);
        }
      }
    }
    void loadData();
    return () => { mounted = false; };
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────────
const filtered = useMemo(() => {
  return projects.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
}, [projects, search]);
  const hasFilters = !!search;


  const mainContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {["s1", "s2", "s3"].map((key) => <SkeletonCard key={key} />)}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
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
              className="mt-4 text-xs font-semibold text-arch-gold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => {
          const dptosCount = dptosCountMap[project.id];
          const clientesCount = contracts !== null ? getClientCountForProject(project.nombre, contracts) : undefined;
          const avance = avanceMap[project.id];

          return (
            <ProjectCard
              key={project.id}
              project={project}
              clientesCount={clientesCount}
              dptosCount={dptosCount}
              avance={avance}
            />
          );
        })}
      </div>
    );
  }, [isLoading, filtered, hasFilters, dptosCountMap, contracts, avanceMap]);

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
          <span>Nuevo proyecto</span>
        </Link>
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
            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-3 py-2 text-xs text-build-main dark:text-white outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 transition"
          />
        </div>


        {hasFilters && (
          <button
            onClick={() => {setSearch("");}}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            <span>Limpiar</span>
          </button>
        )}

        {!isLoading && (
          <span className="ml-auto text-xs text-slate-400 dark:text-white/30 tabular-nums">
            {filtered.length} proyecto{filtered.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* ── Grid/Content ── */}
      {mainContent}
    </section>
  );
}