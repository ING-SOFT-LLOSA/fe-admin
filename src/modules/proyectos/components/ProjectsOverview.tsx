"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import { apiFetch } from "@/lib/api/http";

type ProyectoResponse = {
  id: string;
  nombre: string;
  distrito: string;
  direccion: string;
  fechaInicio: string;
  createdAt: string;
};

export default function ProjectsOverview() {
  const [projects, setProjects] = useState<ProyectoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const data = await apiFetch<ProyectoResponse[]>("/api/proyectos");
        if (mounted) {
          setProjects(data || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">
              Proyectos
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-white/70">
              Visualiza todos los proyectos activos y entra al detalle para editar su informacion.
            </p>
            <div className="mt-4">
              <Link href="/proyectos/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-accent transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Crear Nuevo Proyecto
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Total proyectos</p>
              <p className="mt-2 text-[24px] font-bold text-build-main dark:text-white">{projects.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Estado</p>
              <p className="mt-2 text-sm font-bold text-green-600">Conectado al Backend</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm"
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
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[32px] text-slate-400 dark:text-white/50">folder_open</span>
              <h2 className="mt-3 text-lg font-bold text-build-main dark:text-white">No hay proyectos disponibles</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/60">Cuando se registren proyectos aparecerán aquí.</p>
            </div>
          ) : (
            projects.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
        </section>
      </section>
    </>
  );
}
