"use client";

import { useEffect, useState } from "react";

import { crearEtapaProyecto, getAvanceGeneral, getEtapasByProyecto } from "@/lib/api/obra";
import type { EtapaResponseDTO } from "@/lib/api/obra";
import { fetchProyectos } from "@/modules/proyectos/services";
import type { Proyecto } from "@/modules/proyectos/types";

type ConstructionProgressViewProps = {
  projectId: string;
  context?: "project" | "obra";
};



export default function ConstructionProgressView({
  projectId,
  context = "project",
}: ConstructionProgressViewProps) {
  const [project, setProject] = useState<Proyecto | null>(null);
  const [etapas, setEtapas] = useState<EtapaResponseDTO[]>([]);
  const [avance, setAvance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingEtapa, setIsCreatingEtapa] = useState(false);
  const [etapaForm, setEtapaForm] = useState({ nombre: "", descripcion: "", orden: 1 });
  const [etapaSuccess, setEtapaSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      setIsLoading(true);
      setError("");
      try {
        const [projects, progress, etapasRes] = await Promise.all([
          fetchProyectos(),
          getAvanceGeneral(projectId).catch(() => null),
          getEtapasByProyecto(projectId).catch(() => []),
        ]);
        if (!mounted) return;
        setProject(projects.find((entry) => entry.id === projectId) ?? null);
        setAvance(progress?.avanceGlobal ?? 0);
        setEtapas(etapasRes);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la obra.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  async function handleCrearEtapa() {
    if (!etapaForm.nombre.trim()) return;
    setIsCreatingEtapa(true);
    setEtapaSuccess("");
    setError("");
    try {
      await crearEtapaProyecto(projectId, etapaForm);
      setEtapaSuccess(`Etapa "${etapaForm.nombre}" creada correctamente.`);
      setEtapaForm({ nombre: "", descripcion: "", orden: etapaForm.orden + 1 });
      const nuevasEtapas = await getEtapasByProyecto(projectId).catch(() => etapas);
      setEtapas(nuevasEtapas);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear la etapa.");
    } finally {
      setIsCreatingEtapa(false);
    }
  }

  return (
    <section className="space-y-6">
      {context === "obra" ? (
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-build-main dark:text-white">
            Avance de obra · {project?.nombre ?? "Proyecto"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
            Etapas constructivas, hitos, avance, fotos, videos y reportes.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {etapaSuccess ? (
        <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-bold text-green-800 dark:text-green-400">
          {etapaSuccess}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-build-main dark:text-white">Avance global real</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Valor calculado por el backend a partir de hitos registrados.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-3 rounded-full bg-build-accent" style={{ width: `${Math.min(avance, 100)}%` }} />
            </div>
            <span className="text-xl font-bold text-build-main dark:text-white">{avance}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-build-main dark:text-white">Estado</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
            {isLoading ? "Cargando obra..." : project ? "Conectado al backend" : "Proyecto no encontrado"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-[20px] font-bold text-build-main dark:text-white">Crear etapa constructiva</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Registra nuevas etapas en la base de datos real.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Nombre de la etapa
            </label>
            <input
              type="text"
              placeholder="Ej. Saneamiento"
              value={etapaForm.nombre}
              onChange={(event) => setEtapaForm({ ...etapaForm, nombre: event.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Orden
            </label>
            <input
              type="number"
              min={1}
              value={etapaForm.orden}
              onChange={(event) => setEtapaForm({ ...etapaForm, orden: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleCrearEtapa}
            disabled={isCreatingEtapa || !etapaForm.nombre.trim()}
            className="rounded-xl bg-build-main px-4 py-2 text-sm font-bold text-white transition-all hover:bg-build-main/90 disabled:opacity-50"
          >
            {isCreatingEtapa ? "Guardando..." : "Crear etapa"}
          </button>
          <div className="md:col-span-4">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Descripción
            </label>
            <textarea
              rows={3}
              value={etapaForm.descripcion}
              onChange={(event) => setEtapaForm({ ...etapaForm, descripcion: event.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h2 className="text-[20px] font-bold text-build-main dark:text-white">Etapas Constructivas Reales</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
          Obtenidas desde el backend para este proyecto específico.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {etapas.length > 0 ? (
            etapas.map((stage) => (
              <div key={stage.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                <p className="text-sm font-bold text-build-main dark:text-white">{stage.nombre} (Orden: {stage.orden})</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-white/60">{stage.descripcion}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    {stage.estado || "PENDIENTE"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-white/60 italic md:col-span-2 xl:col-span-3">No hay etapas registradas para este proyecto.</p>
          )}
        </div>
      </section>
    </section>
  );
}
