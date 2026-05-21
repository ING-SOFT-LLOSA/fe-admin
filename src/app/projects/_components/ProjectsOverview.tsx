"use client";

import { useEffect, useState } from "react";

import AdminLayout from "@/components/AdminLayout";

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
    <AdminLayout>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">
              Proyectos
            </h1>
            <p className="mt-2 text-base text-[#41484c]">
              Visualiza todos los proyectos activos y entra al detalle para editar su informacion.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
            <div className="rounded-xl border border-[#e2e2e4] bg-white p-4 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">Total proyectos</p>
              <p className="mt-2 text-[24px] font-bold text-[#1a1c1d]">{projects.length}</p>
            </div>
            <div className="rounded-xl border border-[#e2e2e4] bg-white p-4 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">Estado</p>
              <p className="mt-2 text-sm font-bold text-[#023143]">Datos mock temporales</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[#e2e2e4] bg-white p-5 shadow-[0_4px_20px_rgba(2,49,67,0.03)]"
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
            <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-white px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[32px] text-[#72787c]">folder_open</span>
              <h2 className="mt-3 text-lg font-bold text-[#1a1c1d]">No hay proyectos disponibles</h2>
              <p className="mt-1 text-sm text-[#41484c]">Cuando se registren proyectos apareceran aqui.</p>
            </div>
          ) : (
            projects.map((project) => <ProjectCard key={project.slug} project={project} />)
          )}
        </section>
      </section>
    </AdminLayout>
  );
}
