"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProjectSectionNav from "@/modules/proyectos/components/ProjectSectionNav";
import { formatProjectDate } from "@/modules/proyectos/utils/format";

type ProjectWorkspaceShellProps = {
  projectId: string;
  children: React.ReactNode;
};

type ProjectHeader = {
  id: string;
  name: string;
  district: string;
  direction: string;
  startDate: string;
};

export default function ProjectWorkspaceShell({ projectId, children }: ProjectWorkspaceShellProps) {
  const [project, setProject] = useState<ProjectHeader | null>(null);
  const [unitsCount, setUnitsCount] = useState<number | string>("...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProjectHeader() {
      setIsLoading(true);
      try {
        const { apiFetch } = await import("@/lib/api/http");
        const { fetchActivosPorProyecto } = await import("@/lib/api/proyectos");
        const allProjects = await apiFetch<any[]>("/api/proyectos");
        const backendProject = allProjects.find((entry) => entry.id === projectId);

        if (!mounted) return;

        if (!backendProject) {
          setProject(null);
          return;
        }

        setProject({
          id: backendProject.id,
          name: backendProject.nombre,
          district: backendProject.distrito || "",
          direction: backendProject.direccion || "",
          startDate: backendProject.fechaInicio || backendProject.createdAt || "",
        });

        const activosPage = await fetchActivosPorProyecto(backendProject.id).catch(() => null);
        if (!mounted) return;
        setUnitsCount(activosPage?.totalElements ?? 0);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProjectHeader();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  return (
    <section className="flex flex-col gap-6">
      <Link
        href="/proyectos"
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-500 dark:text-white/60 transition-colors hover:text-build-main dark:text-white"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver a proyectos
      </Link>

      <header className="min-h-[160px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_460px]">
            <div>
              <div className="skeleton h-8 w-52" />
              <div className="mt-5 skeleton h-9 w-72" />
              <div className="mt-4 skeleton h-5 w-80" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="skeleton h-20 w-full" />
              <div className="skeleton h-20 w-full" />
            </div>
          </div>
        ) : !project ? (
          <div className="flex min-h-[108px] items-center">
            <div>
              <div className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                Detalle del proyecto
              </div>
              <h1 className="mt-3 text-[28px] font-bold text-build-main dark:text-white">Proyecto no encontrado</h1>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[108px] gap-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                Detalle del proyecto
              </div>
              <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-build-main dark:text-white">
                {project.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                {project.direction || "Dirección no registrada"} · Inicio {formatProjectDate(project.startDate)}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Distrito", value: project.district || "-" },
                { label: "Unidades", value: String(unitsCount) },
              ].map((item) => (
                <div key={item.label} className="min-h-[84px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-build-main dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <ProjectSectionNav projectId={projectId} />

      {children}
    </section>
  );
}
