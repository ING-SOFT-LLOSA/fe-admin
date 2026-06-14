"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProjectForm from "@/modules/proyectos/components/ProjectForm";
import { deleteProyecto, updateProyecto } from "@/modules/proyectos/services";
import type { ProyectoCreateDTO } from "@/modules/proyectos/types";
import DialogModal from "@/components/ui/DialogModal";

type ProjectDetailViewProps = {
  projectId: string;
};

export default function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ProyectoCreateDTO>({
    nombre: "",
    descripcion: "",
    precertificacionEdgeLeed: false,
    departamento: "",
    distrito: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "danger";
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      try {
        const { apiFetch } = await import("@/lib/api/http");
        const allProjects = await apiFetch<any[]>("/api/proyectos");
        const backendProject = allProjects.find((entry) => entry.id === projectId);

        if (!mounted) return;
        if (!backendProject) {
          setIsLoading(false);
          return;
        }

        setFormValues({
          nombre: backendProject.nombre || "",
          descripcion: backendProject.descripcion || "",
          precertificacionEdgeLeed: backendProject.precertificacionEdgeLeed || false,
          departamento: backendProject.departamento || "",
          distrito: backendProject.distrito || "",
          direccion: backendProject.direccion || "",
          fechaInicio: backendProject.fechaInicio || "",
          fechaFin: backendProject.fechaFin || "",
        });
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const handleFieldChange = (field: keyof ProyectoCreateDTO, value: string | boolean) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  async function handleSave() {
    setIsSaving(true);
    setSuccessMessage("");

    const trimmedValues = {
      ...formValues,
      nombre: formValues.nombre.trim(),
      direccion: formValues.direccion.trim(),
      departamento: formValues.departamento.trim(),
      distrito: formValues.distrito.trim(),
    };

    try {
      await updateProyecto(projectId, trimmedValues);
      setSuccessMessage("Proyecto actualizado correctamente.");
      setFormValues(trimmedValues);
    } catch (error) {
      console.error(error);
      setDialog({
        isOpen: true,
        title: "Error de Guardado",
        message: "Hubo un error al guardar los cambios del proyecto.",
        type: "danger",
        confirmText: "Aceptar",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    setDialog({
      isOpen: true,
      title: "Eliminar Proyecto",
      message: "¿Estás completamente seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer y borrará todas las unidades y etapas asociadas.",
      type: "danger",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
          await deleteProyecto(projectId);
          setDialog({
            isOpen: true,
            title: "Proyecto Eliminado",
            message: "Proyecto eliminado correctamente.",
            type: "success",
            confirmText: "Aceptar",
            onConfirm: () => {
              router.push("/proyectos");
            },
          });
        } catch (error) {
          console.error(error);
          setDialog({
            isOpen: true,
            title: "Error al Eliminar",
            message: "Ocurrió un error al intentar eliminar el proyecto.",
            type: "danger",
            confirmText: "Aceptar",
          });
          setIsDeleting(false);
        }
      },
    });
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="skeleton h-80 w-full" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {successMessage ? (
        <div className="rounded-xl border border-[#1c663b]/20 bg-[#d6f0e0] px-4 py-3 text-sm font-bold text-[#1c663b]">
          {successMessage}
        </div>
      ) : null}

      <ProjectForm
        values={formValues}
        onChange={handleFieldChange}
        onSubmit={handleSave}
        isSaving={isSaving}
      />

      <section className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-red-700 dark:text-red-400">Zona de peligro</h2>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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

      <DialogModal
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}
