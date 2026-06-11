"use client";

import { useEffect, useState } from "react";

import { getAvanceGeneral, getEtapasByProyecto, getAvancesActivo } from "@/lib/api/obra";
import type { EtapaResponseDTO } from "@/lib/api/obra";
import { fetchActivosPorProyecto } from "@/lib/api/proyectos";
import { fetchProyectos } from "@/modules/proyectos/services";
import type { Proyecto } from "@/modules/proyectos/types";

import ObraTabTimeline      from "./ObraTabTimeline";
import ObraTabHitos         from "./ObraTabHitos";
import ObraTabReportes      from "./ObraTabReportes";
import ObraTabDocumentacion from "./ObraTabDocumentacion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "hitos" | "reportes" | "documentacion";

type ConstructionProgressViewProps = {
  projectId: string;
  context?: "project" | "obra";
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "hitos",         label: "Hitos",         icon: "flag"        },
  { id: "reportes",      label: "Reportes",      icon: "bar_chart"   },
  { id: "documentacion", label: "Documentación", icon: "folder_open" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConstructionProgressView({
  projectId,
  context = "project",
}: ConstructionProgressViewProps) {
  const [project,   setProject]   = useState<Proyecto | null>(null);
  const [etapas,    setEtapas]    = useState<EtapaResponseDTO[]>([]);
  const [avance,    setAvance]    = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("hitos");

  // Helper to fetch floor-level hitos and correct master stages status dynamically
  async function fetchAndCorrectEtapas(projectId: string, rawEtapas: EtapaResponseDTO[]): Promise<EtapaResponseDTO[]> {
    try {
      const assetsPage = await fetchActivosPorProyecto(projectId).catch(() => ({ content: [] }));
      const assets = assetsPage?.content || [];
      
      // Group assets by unique floor (pisoId)
      const uniqueFloorsMap = new Map<number, string>();
      assets.forEach((a) => {
        if (a.pisoId && !uniqueFloorsMap.has(a.pisoId)) {
          uniqueFloorsMap.set(a.pisoId, a.id);
        }
      });

      const proxyAssetIds = Array.from(uniqueFloorsMap.values());
      if (proxyAssetIds.length === 0) {
        return rawEtapas;
      }

      const allFloorAvances = await Promise.all(
        proxyAssetIds.map((id) => getAvancesActivo(id).catch(() => []))
      );

      return rawEtapas.map((etapa) => {
        const floorStates = allFloorAvances.map((floorAvances) => {
          const matchingAvance = floorAvances.find((fa) => fa.hitoOrden === etapa.orden);
          return matchingAvance?.estado || "PENDIENTE";
        });

        let computedEstado = etapa.estado;
        if (floorStates.length > 0) {
          const allCompleted = floorStates.every((st) => st === "COMPLETADO");
          const anyCompleted = floorStates.some((st) => st === "COMPLETADO");
          if (allCompleted) {
            computedEstado = "COMPLETADO";
          } else if (anyCompleted) {
            computedEstado = "EN_PROGRESO";
          } else {
            computedEstado = "PENDIENTE";
          }
        }

        return {
          ...etapa,
          estado: computedEstado,
        };
      });
    } catch (err) {
      console.error("Error correcting stages:", err);
      return rawEtapas;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [projects, progress, etapasRes] = await Promise.all([
          fetchProyectos(),
          getAvanceGeneral(projectId).catch(() => null),
          getEtapasByProyecto(projectId).catch(() => []),
        ]);
        if (!mounted) return;
        setProject(projects.find((p) => p.id === projectId) ?? null);
        setAvance(progress?.avanceGlobal ?? 0);

        // Correct stages status using the floor data to workaround backend caching/state issue
        const corrected = await fetchAndCorrectEtapas(projectId, etapasRes);
        if (!mounted) return;
        setEtapas(corrected);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudo cargar la obra.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => { mounted = false; };
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-500 dark:text-white/50">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-medium">Cargando obra...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {context === "obra" && (
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
            Avance de obra
            {project && <span className="ml-2 text-build-accent"> · {project.nombre}</span>}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Etapas constructivas, hitos, reportes y documentación técnica.
          </p>
        </div>
      )}

      {/* Timeline Horizontal Global */}
      <ObraTabTimeline projectId={projectId} etapas={etapas} />

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-build-accent text-build-accent"
                : "border-transparent text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white"
              }
            `}
          >
            <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "hitos" && (
          <ObraTabHitos
            projectId={projectId}
            etapas={etapas}
            onRefresh={async () => {
              const updated = await getEtapasByProyecto(projectId).catch(() => etapas);
              const corrected = await fetchAndCorrectEtapas(projectId, updated);
              setEtapas(corrected);
            }}
          />
        )}
        {activeTab === "reportes" && (
          <ObraTabReportes projectId={projectId} avance={avance} project={project} />
        )}
        {activeTab === "documentacion" && (
          <ObraTabDocumentacion projectId={projectId} />
        )}
      </div>
    </section>
  );
}