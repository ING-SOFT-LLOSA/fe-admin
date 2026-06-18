import Link from "next/link";
import { ClienteAssignment } from "@/types/user";

type ClientPropertiesProps = {
  assignments: ClienteAssignment[];
  onUnlink: (assignment: ClienteAssignment) => void;
};


function getUnitIcon(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("cochera") || lower.includes("estacionamiento") || lower.includes("e-")) return "directions_car";
  if (lower.includes("depósito") || lower.includes("deposito") || lower.includes("d-")) return "inventory_2";
  return "apartment";
}

export default function ClientProperties({ assignments, onUnlink }: ClientPropertiesProps) {
  const active = assignments.filter((a) => a.status === "Vigente");

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-arch-gold">domain</span>
        Propiedades
      </h3>

      {active.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">home_work</span>
          <p className="text-sm">No tiene propiedades vinculadas activas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Group by project */}
          {Array.from(new Set(active.map((a) => a.projectName))).map((project) => {
            const units = active.filter((a) => a.projectName === project);
            return (
              <div key={project} className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-arch-gold text-[18px]">location_city</span>
                  <h4 className="text-xs font-bold text-build-main dark:text-white uppercase tracking-wide">{project}</h4>
                </div>

                <div className="space-y-2">
                  {units.map((unit) => (
                    <div
                      key={unit.unitId}
                      className="flex items-center justify-between bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg p-3 hover:border-build-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-build-bg dark:bg-white/10 flex items-center justify-center text-build-main dark:text-white">
                          <span className="material-symbols-outlined text-[16px]">{getUnitIcon(unit.unitLabel)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-build-main dark:text-white">{unit.unitLabel}</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/50">{unit.financing}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUnlink(unit)}
                          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors px-2 py-1 rounded-md"
                        >
                          Desvincular
                        </button>
                        <Link
                          href={`/proyectos`}
                          className="text-xs font-semibold text-arch-gold hover:text-build-main dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          Ver propiedad
                        </Link>
                        <Link
                          href={`/clientes/${unit.unitId}/expediente`}
                          className="text-xs font-semibold text-build-main dark:text-white hover:bg-build-bg dark:hover:bg-white/10 transition-colors px-2 py-1 rounded-md"
                        >
                          Ver expediente →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}