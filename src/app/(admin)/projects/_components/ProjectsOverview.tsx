"use client";

import { useEffect, useState } from "react";

import ProjectCard from "./ProjectCard";
import { getMockProjects, type ProjectMock } from "../_data/mock-projects";

export default function ProjectsOverview() {
  const [projects, setProjects] = useState<ProjectMock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProjects(getMockProjects());
      setIsLoading(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main">
              Proyectos
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Visualiza todos los proyectos activos y entra al detalle para editar su informacion.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total proyectos</p>
              <p className="mt-2 text-[24px] font-bold text-build-main">{projects.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado</p>
              <p className="mt-2 text-sm font-bold text-build-accent">Datos mock temporales</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="skeleton mb-3 h-4 w-24" />
                <div className="skeleton mb-4 h-7 w-56" />
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="skeleton h-14 w-full" />
                  <div className="skeleton h-14 w-full" />
                  <div className="skeleton h-14 w-full" />
                </div>
              </div>
            ))
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[32px] text-slate-400">folder_open</span>
              <h2 className="mt-3 text-lg font-bold text-build-main">No hay proyectos disponibles</h2>
              <p className="mt-1 text-sm text-slate-500">Cuando se registren proyectos apareceran aqui.</p>
            </div>
          ) : (
            projects.map((project) => <ProjectCard key={project.slug} project={project} />)
          )}
        </section>
      </section>
    </>
  );
}
