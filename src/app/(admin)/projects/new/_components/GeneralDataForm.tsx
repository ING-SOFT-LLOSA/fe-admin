import { useState } from "react";
import { ProjectFormData } from "../_utils/wizard-logic";

interface Props {
  initialData: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export default function GeneralDataForm({ initialData, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Nombre del Proyecto <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="nombre"
            required
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Edificio Las Terrazas"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Dirección <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="direccion"
            required
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Av. Principal 123"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Departamento <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="departamento"
            required
            value={formData.departamento}
            onChange={handleChange}
            placeholder="Lima"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Distrito <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="distrito"
            required
            value={formData.distrito}
            onChange={handleChange}
            placeholder="Miraflores"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Fecha de Inicio Estimada</label>
          <input 
            type="date" 
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Fecha de Fin Estimada</label>
          <input 
            type="date" 
            name="fechaFin"
            value={formData.fechaFin}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Link Recorrido Virtual 3D</label>
          <input 
            type="url" 
            name="linkRecorridoVirtual"
            value={formData.linkRecorridoVirtual}
            onChange={handleChange}
            placeholder="https://my.matterport.com/show/?m=..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Descripción del Proyecto</label>
          <textarea 
            name="descripcion"
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Breve descripción comercial del proyecto..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-build-main focus:bg-white transition-all resize-none"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 p-4">
          <input 
            type="checkbox" 
            id="edgeLeed"
            name="precertificacionEdgeLeed"
            checked={formData.precertificacionEdgeLeed}
            onChange={handleChange}
            className="h-5 w-5 rounded border-slate-300 text-build-main focus:ring-build-main"
          />
          <label htmlFor="edgeLeed" className="text-sm font-semibold text-slate-700 cursor-pointer">
            El proyecto cuenta con Precertificación EDGE / LEED
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
