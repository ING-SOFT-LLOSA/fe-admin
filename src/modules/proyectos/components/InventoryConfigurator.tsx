import { useState } from "react";
import type { InventoryConfig } from "@/modules/proyectos/utils/wizard-logic";

type InventoryConfiguratorProps = {
  initialData: InventoryConfig;
  onBack: () => void;
  onSubmit: (data: InventoryConfig) => void;
};

export default function InventoryConfigurator({
  initialData,
  onBack,
  onSubmit,
}: InventoryConfiguratorProps) {
  const [config, setConfig] = useState<InventoryConfig>(initialData);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setConfig((current) => ({
      ...current,
      [name]: Math.max(0, parseInt(value, 10) || 0),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(config);
  };

  const totalPisos = config.numTorres * config.pisosPorTorre;
  const totalDepas = totalPisos * config.depasPorPiso;
  const totalCocheras = totalPisos * config.cocherasPorPiso;
  const totalDepositos = totalPisos * config.depositosPorPiso;
  const totalUnidades = totalDepas + totalCocheras + totalDepositos;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 text-sm text-blue-800">
        <span className="mb-2 flex items-center gap-2 font-bold">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Previsualización de inventario
        </span>
        <p>
          Esta configuración solo sirve para estimar el volumen del proyecto. La creación automática
          de torres, pisos y unidades está desactivada hasta que el backend autorice el endpoint de
          estructura física.
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <div className="space-y-5">
          <h3 className="border-b border-slate-100 dark:border-white/5 pb-2 font-bold text-build-main dark:text-white">
            Estructura principal
          </h3>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Número de torres</label>
            <input
              type="number"
              name="numTorres"
              min="1"
              value={config.numTorres}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Pisos por torre</label>
            <input
              type="number"
              name="pisosPorTorre"
              min="1"
              value={config.pisosPorTorre}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="border-b border-slate-100 dark:border-white/5 pb-2 font-bold text-build-main dark:text-white">
            Unidades promedio por piso
          </h3>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/50">apartment</span>
              Dptos. por piso
            </label>
            <input
              type="number"
              name="depasPorPiso"
              min="0"
              value={config.depasPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/50">directions_car</span>
              Cocheras por piso
            </label>
            <input
              type="number"
              name="cocherasPorPiso"
              min="0"
              value={config.cocherasPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/50">inventory_2</span>
              Depósitos por piso
            </label>
            <input
              type="number"
              name="depositosPorPiso"
              min="0"
              value={config.depositosPorPiso}
              onChange={handleChange}
              className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-center text-sm outline-none focus:border-build-main"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6">
        <h4 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-white/60">
          Resumen estimado
        </h4>

        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <div>
            <p className="text-[32px] font-bold leading-none text-build-main dark:text-white">{config.numTorres}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-white/60">Torres</p>
          </div>
          <div>
            <p className="text-[32px] font-bold leading-none text-build-main dark:text-white">{totalPisos}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-white/60">Pisos totales</p>
          </div>
          <div>
            <p className="text-[32px] font-bold leading-none text-build-main dark:text-white">{totalDepas}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-white/60">Departamentos</p>
          </div>
          <div>
            <p className="text-[32px] font-bold leading-none text-build-accent">{totalUnidades}</p>
            <p className="mt-2 text-xs font-bold uppercase text-build-main dark:text-white">Unidades totales</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-white/70 transition-colors hover:bg-slate-100 dark:bg-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-build-accent"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Crear proyecto
        </button>
      </div>
    </form>
  );
}
