import { useState } from "react";
import { ProjectFormData } from "@/modules/proyectos/utils/wizard-logic";

interface Props {
  initialData: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export default function GeneralDataForm({ initialData, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (data: ProjectFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.nombre || !data.nombre.trim()) {
      newErrors.nombre = "El nombre del proyecto es obligatorio.";
    } else if (data.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!data.direccion || !data.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria.";
    }

    if (!data.departamento || !data.departamento.trim()) {
      newErrors.departamento = "El departamento es obligatorio.";
    }

    if (!data.distrito || !data.distrito.trim()) {
      newErrors.distrito = "El distrito es obligatorio.";
    }



    if (data.fechaInicio && data.fechaFin) {
      const start = new Date(data.fechaInicio);
      const end = new Date(data.fechaFin);
      if (end < start) {
        newErrors.fechaFin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
      }
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: string | boolean = value;
    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if ((name === "fechaInicio" || name === "fechaFin") && errors.fechaFin) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.fechaFin;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
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

    onSubmit({
      ...formData,
      nombre: formData.nombre.trim(),
      direccion: formData.direccion.trim(),
      departamento: formData.departamento.trim(),
      distrito: formData.distrito.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Nombre del Proyecto <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Edificio Las Terrazas"
            className={`w-full rounded-xl border bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all ${
              errors.nombre 
                ? "border-red-500 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-500/20" 
                : "border-slate-200 dark:border-white/10 focus:border-build-main focus:bg-white"
            }`}
          />
          {errors.nombre && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.nombre}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Dirección <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Av. Principal 123"
            className={`w-full rounded-xl border bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all ${
              errors.direccion 
                ? "border-red-500 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-500/20" 
                : "border-slate-200 dark:border-white/10 focus:border-build-main focus:bg-white"
            }`}
          />
          {errors.direccion && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.direccion}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Departamento <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            placeholder="Lima"
            className={`w-full rounded-xl border bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all ${
              errors.departamento 
                ? "border-red-500 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-500/20" 
                : "border-slate-200 dark:border-white/10 focus:border-build-main focus:bg-white"
            }`}
          />
          {errors.departamento && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.departamento}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Distrito <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="distrito"
            value={formData.distrito}
            onChange={handleChange}
            placeholder="Miraflores"
            className={`w-full rounded-xl border bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all ${
              errors.distrito 
                ? "border-red-500 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-500/20" 
                : "border-slate-200 dark:border-white/10 focus:border-build-main focus:bg-white"
            }`}
          />
          {errors.distrito && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.distrito}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Fecha de Inicio Estimada</label>
          <input 
            type="date" 
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Fecha de Fin Estimada</label>
          <input 
            type="date" 
            name="fechaFin"
            value={formData.fechaFin}
            onChange={handleChange}
            className={`w-full rounded-xl border bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all ${
              errors.fechaFin 
                ? "border-red-500 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-500/20" 
                : "border-slate-200 dark:border-white/10 focus:border-build-main focus:bg-white"
            }`}
          />
          {errors.fechaFin && (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.fechaFin}</p>
          )}
        </div>



        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Descripción del Proyecto</label>
          <textarea 
            name="descripcion"
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Breve descripción comercial del proyecto..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all resize-none"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4">
          <input 
            type="checkbox" 
            id="edgeLeed"
            name="precertificacionEdgeLeed"
            checked={formData.precertificacionEdgeLeed}
            onChange={handleChange}
            className="h-5 w-5 rounded border-slate-300 dark:border-white/20 text-build-main dark:text-white focus:ring-build-main"
          />
          <label htmlFor="edgeLeed" className="text-sm font-semibold text-slate-700 dark:text-white/80 cursor-pointer">
            El proyecto cuenta con Precertificación EDGE / LEED
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
        <button 
          type="button" 
          onClick={onCancel}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="flex items-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-accent transition-colors"
        >
          Siguiente paso
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </form>
  );
}

