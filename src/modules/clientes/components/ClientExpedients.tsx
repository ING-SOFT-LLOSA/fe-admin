import Link from "next/link";
import { ClienteAssignment } from "@/types/user";

type ClientExpedientsProps = {
  assignments: ClienteAssignment[];
};

export default function ClientExpedients({ assignments }: ClientExpedientsProps) {
  const active = assignments.filter((a) => a.status === "Vigente");

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-arch-gold">folder_open</span>
        Expedientes
      </h3>

      {active.length === 0 ? (
        <div className="text-center py-6 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
          <p className="text-sm">Sin expedientes activos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((item) => (
            <div
              key={item.unitId}
              className="flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:border-build-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-build-bg dark:bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-build-main dark:text-white text-[20px]">description</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-build-main dark:text-white">
                    EXP-{String(item.unitId).slice(-3).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {item.unitLabel} · {item.projectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded text-[10px] font-bold uppercase hidden sm:inline-flex">
                  Contrato firmado
                </span>
                <Link
                  href={`/clientes/${item.clientId}/expediente`}
                  className="text-xs font-semibold text-build-main dark:text-white hover:bg-build-bg dark:hover:bg-white/10 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  Abrir
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}