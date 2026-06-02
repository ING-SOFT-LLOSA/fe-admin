"use client";

import type { ChangeEvent } from "react";
import type { ProyectoCreateDTO } from "@/modules/proyectos/types";

type ProjectFormProps = {
  values: ProyectoCreateDTO;
  onChange: (field: keyof ProyectoCreateDTO, value: string | boolean) => void;
  onSubmit: () => void;
  isSaving: boolean;
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
  { key: "linkRecorridoVirtual", label: "Link recorrido virtual", type: "text", placeholder: "https://..." },
];

export default function ProjectForm({
  values,
  onChange,
  onSubmit,
  isSaving,
}: ProjectFormProps) {
  const handleInputChange =
    (field: keyof ProyectoCreateDTO) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(field, event.target.value);
    };

  const handleCheckboxChange =
    (field: keyof ProyectoCreateDTO) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(field, event.target.checked);
    };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-build-main dark:text-white">Información del proyecto</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/60">Actualiza los datos principales del proyecto.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {textFields.map((field) => (
          <label key={field.key} className={field.key === "direccion" || field.key === "linkRecorridoVirtual" ? "md:col-span-2" : ""}>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              {field.label}
            </span>
            <input
              type={field.type}
              value={String(values[field.key])}
              onChange={handleInputChange(field.key)}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </label>
        ))}
        
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
            Descripción
          </span>
          <textarea
            value={values.descripcion}
            onChange={handleInputChange("descripcion")}
            placeholder="Breve descripción del proyecto..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-build-main dark:text-white outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </label>

        <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.precertificacionEdgeLeed}
            onChange={handleCheckboxChange("precertificacionEdgeLeed")}
            className="h-4 w-4 accent-[#023143]"
          />
          <div>
            <p className="text-sm font-semibold text-build-main dark:text-white">Precertificación EDGE / LEED</p>
            <p className="text-[12px] text-slate-500 dark:text-white/60">
              Marca esta opción si el proyecto cuenta con certificación sostenible.
            </p>
          </div>
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
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
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </section>
  );
}
