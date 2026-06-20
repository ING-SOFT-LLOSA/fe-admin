"use client";

import { useState, useId } from "react";
import type { ChangeEvent } from "react";
import type { ProyectoCreateDTO } from "@/modules/proyectos/types";
import { validateProjectForm } from "@/modules/proyectos/utils/validation";

type ProjectFormProps = {
  readonly values: ProyectoCreateDTO;
  readonly onChange: (field: keyof ProyectoCreateDTO, value: string | boolean) => void;
  readonly onSubmit: () => void;
  readonly isSaving: boolean;
};

const textFields: Array<{
  key: keyof ProyectoCreateDTO;
  label: string;
  type: "text" | "date";
  placeholder?: string;
}> = [
  { key: "nombre", label: "Nombre del proyecto", type: "text", placeholder: "Nombre del proyecto" },
  { key: "departamento", label: "Departamento", type: "text", placeholder: "Ej. Lima" },
  { key: "distrito", label: "Distrito", type: "text", placeholder: "Ej. Miraflores" },
  { key: "direccion", label: "Dirección", type: "text", placeholder: "Dirección completa" },
  { key: "fechaInicio", label: "Fecha de inicio", type: "date" },
  { key: "fechaFin", label: "Fecha de fin estimada", type: "date" },
];

export default function ProjectForm({
  values,
  onChange,
  onSubmit,
  isSaving,
}: Readonly<ProjectFormProps>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const precertificacionEdgeLeedId = useId();

  const handleInputChange =
    (field: keyof ProyectoCreateDTO) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(field, event.target.value);
      
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }

      if ((field === "fechaInicio" || field === "fechaFin") && errors.fechaFin) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.fechaFin;
          return next;
        });
      }
    };

  const handleCheckboxChange =
    (field: keyof ProyectoCreateDTO) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(field, event.target.checked);
    };

  const handleSubmit = () => {
    const validationErrors = validateProjectForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return;
    }
    onSubmit();
  };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-build-main dark:text-white">Información del proyecto</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/60">Actualiza los datos principales del proyecto.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {textFields.map((field) => {
          const hasError = !!errors[field.key];
          return (
            <div key={field.key} className={field.key === "direccion" ? "md:col-span-2" : ""}>
              <label htmlFor={field.key} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                {field.label}
                {["nombre", "direccion", "departamento", "distrito"].includes(field.key) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                id={field.key}
                type={field.type}
                name={field.key}
                value={String(values[field.key])}
                onChange={handleInputChange(field.key)}
                placeholder={field.placeholder}
                className={`w-full rounded-xl border bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none transition-all focus:ring-1 ${
                  hasError 
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20" 
                     : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-build-accent"
                }`}
              />
              {hasError && (
                <p className="mt-1 text-xs font-semibold text-red-500 dark:text-red-400">{errors[field.key]}</p>
              )}
            </div>
          );
        })}
        
        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={values.descripcion}
            onChange={handleInputChange("descripcion")}
            placeholder="Breve descripción del proyecto..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
          <input
            id={precertificacionEdgeLeedId}
            type="checkbox"
            checked={values.precertificacionEdgeLeed}
            onChange={handleCheckboxChange("precertificacionEdgeLeed")}
            className="h-4 w-4 accent-[#023143]"
          />
          <label htmlFor={precertificacionEdgeLeedId} className="cursor-pointer">
            <span className="text-sm font-semibold text-build-main dark:text-white block">Precertificación EDGE / LEED</span>
            <span className="text-[12px] text-slate-500 dark:text-white/60 block">
              Marca esta opción si el proyecto cuenta con certificación sostenible.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-build-main/90 disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

