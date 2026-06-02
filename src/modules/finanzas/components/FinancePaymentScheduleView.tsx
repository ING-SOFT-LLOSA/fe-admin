"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchActivosPorProyecto } from "@/modules/inventario/services";
import type { ActivoResponseDTO } from "@/modules/inventario/types";
import { fetchProyectos } from "@/modules/proyectos/services";
import type { Proyecto } from "@/modules/proyectos/types";

type FinancePaymentScheduleViewProps = {
  initialProjectId?: string | null;
};

export default function FinancePaymentScheduleView({
  initialProjectId = null,
}: FinancePaymentScheduleViewProps) {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [units, setUnits] = useState<ActivoResponseDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? "");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProjects() {
      setIsLoading(true);
      setError("");
      try {
        const rows = await fetchProyectos();
        if (!mounted) return;
        setProjects(rows);
        setSelectedProjectId((current) => current || initialProjectId || rows[0]?.id || "");
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los proyectos.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProjects();
    return () => {
      mounted = false;
    };
  }, [initialProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setUnits([]);
      return;
    }

    let mounted = true;
    async function loadUnits() {
      setError("");
      try {
        const page = await fetchActivosPorProyecto(selectedProjectId);
        if (!mounted) return;
        setUnits(page.content ?? []);
        setSelectedUnitId((current) => current || page.content?.[0]?.id || "");
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las unidades.");
        }
      }
    }

    void loadUnits();
    return () => {
      mounted = false;
    };
  }, [selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0] ?? null;
  const commercialValue = useMemo(
    () => units.reduce((total, unit) => total + (unit.precio || 0), 0),
    [units],
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">
          Pagos y Cronogramas
        </h2>
        <p className="mt-2 text-base text-slate-600 dark:text-white/70">
          Cronogramas, cuotas, mora, vouchers, estado de cuenta y recaudación.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_220px]">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Proyecto
            </label>
            <select
              value={selectedProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                setSelectedUnitId("");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Unidad
            </label>
            <select
              value={selectedUnit?.id ?? ""}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.nro} · {unit.estadoComercial}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Unidades</p>
            <p className="mt-2 text-sm font-semibold text-build-main dark:text-white">{units.length}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Valor comercial</p>
            <p className="mt-2 text-sm font-semibold text-build-main dark:text-white">
              S/ {commercialValue.toLocaleString("es-PE")}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-12 text-center">
        <h2 className="text-lg font-bold text-build-main dark:text-white">
          {isLoading ? "Cargando información financiera..." : "Cronogramas pendientes de integración"}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/60">
          {selectedProject
            ? `Proyecto seleccionado: ${selectedProject.nombre}${selectedUnit ? `, unidad ${selectedUnit.nro}` : ""}.`
            : "Selecciona un proyecto para preparar la vista financiera."}{" "}
          El frontend ya no usa cronogramas mock de `localStorage`; falta exponer endpoints de cuotas,
          vouchers, mora y estados de cuenta para completar este módulo con datos reales.
        </p>
      </section>
    </section>
  );
}
