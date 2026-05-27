"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProjectForm from "./ProjectForm";
import TowerList from "./TowerList";
import {
  formatProjectDate,
  getProjectBySlug,
  getProjectFormValues,
  getProjectStats,
  type ProjectFormValues,
  type ProjectMock,
} from "../_data/mock-projects";

type ProjectDetailViewProps = {
  projectId: string;
};

export default function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const [project, setProject] = useState<ProjectMock | null>(null);
  const [formValues, setFormValues] = useState<ProjectFormValues>({
    name: "",
    district: "",
    direction: "",
    date_init: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      try {
        const { apiFetch } = await import("@/lib/api/http");
        const allProjects = await apiFetch<any[]>("/api/proyectos");
        const backendProject = allProjects.find(p => p.id === projectId);
        
        if (mounted && backendProject) {
          const mappedProject: ProjectMock = {
            slug: backendProject.id,
            uuid_proyecto: backendProject.id,
            name: backendProject.nombre,
            district: backendProject.distrito || "",
            direction: backendProject.direccion || "",
            date_init: new Date(backendProject.fechaInicio || backendProject.createdAt),
            created_at: new Date(backendProject.createdAt) as any,
            towers: [] // backend does not return towers yet
          };
          
          setProject(mappedProject);
          setFormValues({
            name: mappedProject.name,
            district: mappedProject.district,
            direction: mappedProject.direction,
            date_init: backendProject.fechaInicio ? backendProject.fechaInicio : "",
          });
          setIsLoading(false);
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const handleFieldChange = (field: keyof ProjectFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (!project) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");

    window.setTimeout(() => {
      const updatedProject: ProjectMock = {
        ...project,
        name: formValues.name,
        district: formValues.district,
        direction: formValues.direction,
        date_init: new Date(formValues.date_init),
      };

      setProject(updatedProject);
      setIsSaving(false);
      setSuccessMessage("Los cambios se guardaron localmente en esta vista mock.");
    }, 800);
  };

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-build-main"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a proyectos
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="skeleton h-7 w-60" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full md:col-span-2" />
              </div>
            </div>
          </div>
        ) : !project ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="material-symbols-outlined text-[32px] text-slate-400">search_off</span>
            <h1 className="mt-3 text-lg font-bold text-build-main">Proyecto no encontrado</h1>
            <p className="mt-1 text-sm text-slate-500">
              El identificador solicitado no coincide con los datos mock disponibles.
            </p>
          </div>
        ) : (
          <>
            <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Detalle del proyecto
                  </div>
                  <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-build-main">
                    {project.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Fecha de inicio: {formatProjectDate(project.date_init)}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Distrito", value: project.district },
                    { label: "Torres", value: String(getProjectStats(project).towersCount) },
                    { label: "Unidades", value: String(getProjectStats(project).unitsCount) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-build-main">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {successMessage ? (
                <div className="mt-5 rounded-xl border border-[#1c663b]/20 bg-[#d6f0e0] px-4 py-3 text-sm font-bold text-[#1c663b]">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <Link
                  href={`/projects/${project.slug}/obra`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-build-accent hover:shadow-sm"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Modulo A
                  </p>
                  <h3 className="mt-2 text-base font-bold text-build-main">Gestion de obra</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Licencias, etapas constructivas y documentos compartidos.
                  </p>
                </Link>
                <Link
                  href={`/projects/${project.slug}/unidades`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-build-accent hover:shadow-sm"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Modulo B
                  </p>
                  <h3 className="mt-2 text-base font-bold text-build-main">Gestion de unidades</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Unidades, cliente asignado y pipeline de compra.
                  </p>
                </Link>
              </div>
            </header>

            <ProjectForm
              values={formValues}
              onChange={handleFieldChange}
              onSubmit={handleSave}
              isSaving={isSaving}
            />

            <TowerList towers={project.towers} />
          </>
        )}
      </section>
    </>
  );
}
