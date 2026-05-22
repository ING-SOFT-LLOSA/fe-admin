import type { Tower } from "@/app/types/project";

type TowerListProps = {
  towers: Tower[];
};

export default function TowerList({ towers }: TowerListProps) {
  if (towers.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-[#c1c7cc] bg-white p-6 text-center">
        <p className="text-sm font-medium text-[#72787c]">Este proyecto aun no tiene torres registradas.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-[#1a1c1d]">Torres del proyecto</h2>
        <p className="mt-1 text-sm text-[#41484c]">Resumen simple de pisos y unidades por torre.</p>
      </div>

      <div className="space-y-3">
        {towers.map((tower) => (
          <div
            key={tower.id}
            className="grid gap-4 rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] p-4 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr]"
          >
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#72787c]">Torre</p>
              <h3 className="mt-1 text-base font-bold text-[#1a1c1d]">{tower.name}</h3>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#72787c]">Pisos</p>
              <p className="mt-1 text-sm text-[#41484c]">{tower.floors}</p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#72787c]">Unidades</p>
              <p className="mt-1 text-sm text-[#41484c]">{tower.units.length}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
