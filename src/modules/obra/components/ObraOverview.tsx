"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProyectos, getAvanceGeneral } from "@/modules/proyectos/services";
import type { Proyecto } from "@/modules/proyectos/types";

type ProjectProgressRow = Proyecto & {
  avanceGlobal?: number;
};

export default function ObraOverview() {
  const [projects, setProjects] = useState<ProjectProgressRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
              return { ...project, avanceGlobal: progress.avanceGlobal };
            } catch {
              return { ...project, avanceGlobal: 0 };
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
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-build-main md:text-3xl">
            Avance de Obra
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Seguimiento constructivo por proyecto, etapas, hitos y evidencia visual.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Proyecto", "Ubicación", "Avance", "Acción"].map((header) => (
                <th key={header} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                  Cargando avances...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                  No hay proyectos registrados.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-bold text-build-main">{project.nombre}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{project.direccion || "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-build-accent"
                          style={{ width: `${Math.min(project.avanceGlobal ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-build-main">{project.avanceGlobal ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/projects/${project.id}/obra`}
                      className="inline-flex items-center gap-2 rounded-lg bg-build-main px-3 py-2 text-xs font-bold text-white hover:bg-build-main/90"
                    >
                      <span className="material-symbols-outlined text-[16px]">engineering</span>
                      Abrir obra
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

