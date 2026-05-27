import { useState } from "react";
import { InventoryConfig } from "../_utils/wizard-logic";

interface Props {
  initialData: InventoryConfig;
  onBack: () => void;
  onSubmit: (data: InventoryConfig) => void;
}

export default function InventoryConfigurator({ initialData, onBack, onSubmit }: Props) {
  const [config, setConfig] = useState<InventoryConfig>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  // Calculate totals for preview
  const totalPisos = config.numTorres * config.pisosPorTorre;
  const totalDepas = totalPisos * config.depasPorPiso;
  const totalCocheras = totalPisos * config.cocherasPorPiso;
  const totalDepositos = totalPisos * config.depositosPorPiso;
  const totalUnidades = totalDepas + totalCocheras + totalDepositos;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 text-sm text-blue-800">
        <span className="font-bold flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Generador de Inventario Masivo
        </span>
        <p>Configura la estructura promedio del edificio. El sistema generará automáticamente todos los pisos y unidades (departamentos, cocheras, depósitos). Podrás editar los nombres, áreas y precios específicos de cada unidad más adelante.</p>
      </div>

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        
        {/* Estructura Principal */}
        <div className="space-y-5">
          <h3 className="font-bold text-build-main border-b border-slate-100 pb-2">Estructura Principal</h3>
          
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700">Número de Torres</label>
            <input 
              type="number" 
              name="numTorres"
              min="1"
              value={config.numTorres}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700">Pisos por Torre</label>
            <input 
              type="number" 
              name="pisosPorTorre"
              min="1"
              value={config.pisosPorTorre}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>
        </div>

        {/* Unidades por Piso */}
        <div className="space-y-5">
          <h3 className="font-bold text-build-main border-b border-slate-100 pb-2">Unidades (Promedio por piso)</h3>
          
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">apartment</span>
              Dptos. por piso
            </label>
            <input 
              type="number" 
              name="depasPorPiso"
              min="0"
              value={config.depasPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">directions_car</span>
              Cocheras por piso
            </label>
            <input 
              type="number" 
              name="cocherasPorPiso"
              min="0"
              value={config.cocherasPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">inventory_2</span>
              Depósitos por piso
            </label>
            <input 
              type="number" 
              name="depositosPorPiso"
              min="0"
              value={config.depositosPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>
        </div>
      </div>

      {/* Resumen de Generación */}
      <div className="mt-8 rounded-2xl bg-slate-50 p-6 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Resumen de Generación</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[32px] font-bold text-build-main leading-none">{config.numTorres}</p>
            <p className="text-xs font-semibold text-slate-500 mt-2 uppercase">Torres</p>
          </div>
          <div>
            <p className="text-[32px] font-bold text-build-main leading-none">{totalPisos}</p>
            <p className="text-xs font-semibold text-slate-500 mt-2 uppercase">Pisos Totales</p>
          </div>
          <div>
            <p className="text-[32px] font-bold text-build-main leading-none">{totalDepas}</p>
            <p className="text-xs font-semibold text-slate-500 mt-2 uppercase">Departamentos</p>
          </div>
          <div>
            <p className="text-[32px] font-bold text-build-accent leading-none">{totalUnidades}</p>
            <p className="text-xs font-bold text-build-main mt-2 uppercase">Unidades Totales</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onBack}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </button>
        <button 
          type="submit" 
          disabled={totalUnidades === 0}
          className="flex items-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Generar y Guardar Proyecto
        </button>
      </div>
    </form>
  );
}
