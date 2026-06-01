"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProjectForm from "./ProjectForm";
import TowerList from "./TowerList";
import {
  formatProjectDate,
  type ProjectMock,
} from "@/modules/proyectos/data/mock-projects";
import { updateProyecto, getAvanceGeneral, deleteProyecto } from "@/modules/proyectos/services";
import type { ProyectoCreateDTO } from "@/modules/proyectos/types";
import { useRouter } from "next/navigation";

type ProjectDetailViewProps = {
  projectId: string;
};

export default function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectMock | null>(null);
  const [formValues, setFormValues] = useState<ProyectoCreateDTO>({
    nombre: "",
    descripcion: "",
    precertificacionEdgeLeed: false,
    linkRecorridoVirtual: "",
    departamento: "",
    distrito: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [unitsCount, setUnitsCount] = useState<number | string>("...");
  const [avanceGlobal, setAvanceGlobal] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      try {
        const { apiFetch } = await import("@/lib/api/http");
        const { fetchActivosPorProyecto } = await import("@/lib/api/proyectos");
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
          
          try {
            const activosPage = await fetchActivosPorProyecto(backendProject.id);
            setUnitsCount(activosPage.totalElements);
            
            const avance = await getAvanceGeneral(backendProject.id);
            setAvanceGlobal(avance.avanceGlobal);
          } catch(e) {
            setUnitsCount(0);
            setAvanceGlobal(0);
          }

          setProject(mappedProject);
          setFormValues({
            nombre: backendProject.nombre || "",
            descripcion: backendProject.descripcion || "",
            precertificacionEdgeLeed: backendProject.precertificacionEdgeLeed || false,
            linkRecorridoVirtual: backendProject.linkRecorridoVirtual || "",
            departamento: backendProject.departamento || "",
            distrito: backendProject.distrito || "",
            direccion: backendProject.direccion || "",
            fechaInicio: backendProject.fechaInicio ? backendProject.fechaInicio : "",
            fechaFin: backendProject.fechaFin ? backendProject.fechaFin : "",
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

  const handleFieldChange = (field: keyof ProyectoCreateDTO, value: string | boolean) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    setSuccessMessage("");

    try {
      await updateProyecto(projectId, formValues);
      setSuccessMessage("¡Proyecto actualizado correctamente!");
      
      // Update local state mock to reflect changes in the header
      setProject(prev => prev ? {
        ...prev,
        name: formValues.nombre,
        district: formValues.distrito,
        direction: formValues.direccion,
      } : null);
    } catch(e) {
      console.error(e);
      alert("Hubo un error al guardar los cambios del proyecto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás completamente seguro de que deseas ELIMINAR este proyecto? Esta acción no se puede deshacer y borrará todas las unidades y etapas asociadas.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteProyecto(projectId);
      alert("Proyecto eliminado correctamente.");
      router.push("/projects");
    } catch(e) {
      console.error(e);
      alert("Ocurrió un error al intentar eliminar el proyecto.");
      setIsDeleting(false);
    }
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

                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { label: "Avance", value: `${avanceGlobal}%` },
                    { label: "Distrito", value: project.district },
                    { label: "Torres", value: "Pendiente API" },
                    { label: "Unidades", value: String(unitsCount) },
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

            <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm mt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-red-700">Zona de peligro</h2>
                  <p className="mt-1 text-sm text-red-600">
                    Eliminar este proyecto borrará permanentemente todas las unidades, etapas y avances. Esta acción no se puede deshacer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar proyecto"}
                </button>
              </div>
            </section>

            <TowerList projectId={projectId} />
          </>
        )}
      </section>
    </>
  );
}
