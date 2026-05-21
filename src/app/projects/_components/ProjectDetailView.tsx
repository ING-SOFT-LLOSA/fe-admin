"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminLayout from "@/components/AdminLayout";

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
    const timer = window.setTimeout(() => {
      const currentProject = getProjectBySlug(projectId);
      setProject(currentProject);
      if (currentProject) {
        setFormValues(getProjectFormValues(currentProject));
      }
      setIsLoading(false);
    }, 500);

    return () => window.clearTimeout(timer);
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
    <AdminLayout>
      <section className="flex flex-col gap-6">
        <div className="flex items-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#023143] transition-colors hover:text-[#001b27]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a proyectos
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e2e2e4] bg-white p-6">
              <div className="skeleton h-7 w-60" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            </div>
            <div className="rounded-xl border border-[#e2e2e4] bg-white p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full md:col-span-2" />
              </div>
            </div>
          </div>
        ) : !project ? (
          <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-white px-6 py-12 text-center">
            <span className="material-symbols-outlined text-[32px] text-[#72787c]">search_off</span>
            <h1 className="mt-3 text-lg font-bold text-[#1a1c1d]">Proyecto no encontrado</h1>
            <p className="mt-1 text-sm text-[#41484c]">
              El identificador solicitado no coincide con los datos mock disponibles.
            </p>
          </div>
        ) : (
          <>
            <header className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-md bg-[#c2e8ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#001e2b]">
                    Detalle del proyecto
                  </div>
                  <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-[#1a1c1d]">
                    {project.name}
                  </h1>
                  <p className="mt-2 text-sm text-[#41484c]">
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
                      className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] px-4 py-3"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1a1c1d]">{item.value}</p>
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
                  className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] px-4 py-4 transition-colors hover:border-[#023143] hover:bg-white"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                    Modulo A
                  </p>
                  <h3 className="mt-2 text-base font-bold text-[#1a1c1d]">Gestion de obra</h3>
                  <p className="mt-1 text-sm text-[#41484c]">
                    Licencias, etapas constructivas y documentos compartidos.
                  </p>
                </Link>
                <Link
                  href={`/projects/${project.slug}/unidades`}
                  className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] px-4 py-4 transition-colors hover:border-[#023143] hover:bg-white"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                    Modulo B
                  </p>
                  <h3 className="mt-2 text-base font-bold text-[#1a1c1d]">Gestion de unidades</h3>
                  <p className="mt-1 text-sm text-[#41484c]">
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
    </AdminLayout>
  );
}
