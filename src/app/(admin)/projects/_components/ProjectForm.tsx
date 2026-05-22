"use client";

import type { ChangeEvent } from "react";

import type { ProjectFormValues } from "../_data/mock-projects";

type ProjectFormProps = {
  values: ProjectFormValues;
  onChange: (field: keyof ProjectFormValues, value: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
};

const fields: Array<{
  key: keyof ProjectFormValues;
  label: string;
  type: "text" | "date";
  placeholder?: string;
}> = [
  { key: "name", label: "Nombre del proyecto", type: "text", placeholder: "Nombre del proyecto" },
  { key: "district", label: "Distrito", type: "text", placeholder: "Distrito" },
  { key: "direction", label: "Direccion", type: "text", placeholder: "Direccion completa" },
  { key: "date_init", label: "Fecha de inicio", type: "date" },
];

export default function ProjectForm({
  values,
  onChange,
  onSubmit,
  isSaving,
}: ProjectFormProps) {
  const handleInputChange =
    (field: keyof ProjectFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(field, event.target.value);
    };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-build-main">Informacion del proyecto</h2>
        <p className="mt-1 text-sm text-slate-500">Actualiza los datos principales del proyecto.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className={field.key === "direction" ? "md:col-span-2" : ""}>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {field.label}
            </span>
            <input
              type={field.type}
              value={values[field.key]}
              onChange={handleInputChange(field.key)}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-build-main outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </label>
        ))}
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
