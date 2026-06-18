// Removed mock import

type ClientGeneralStatusProps = {
  assignments: any[];
};

export default function ClientGeneralStatus({ assignments }: ClientGeneralStatusProps) {
  const active = assignments.filter((a) => a.status === "Vigente");

  if (active.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-arch-gold">info</span>
          Estado General
        </h3>
        <div className="text-center py-6 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
          <span className="material-symbols-outlined text-3xl mb-2 opacity-50">info</span>
          <p className="text-sm">El cliente no tiene unidades asignadas actualmente.</p>
        </div>
      </section>
    );
  }

  // Show a summary of the first (or "principal") assignment
  const principal = active[0];

  const statusItems = [
    { label: "Proyecto", value: principal.projectName, icon: "location_city" },
    { label: "Unidad Principal", value: principal.unitLabel, icon: "apartment" },
    { label: "Financiamiento", value: principal.financing, icon: "account_balance" },
    { label: "Fase Comercial", value: "Contrato Firmado", icon: "description" },
    { label: "Estado Legal", value: "Minuta en revisión", icon: "gavel" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-arch-gold">info</span>
        Estado General
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
          >
            <div className="w-8 h-8 rounded-lg bg-build-bg dark:bg-white/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-build-main dark:text-white text-[16px]">
                {item.icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-build-main dark:text-white mt-0.5 truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {active.length > 1 && (
        <p className="text-xs text-slate-400 dark:text-white/40 mt-4">
          Mostrando resumen de la unidad principal. El cliente tiene {active.length} propiedades activas.
        </p>
      )}
    </section>
  );
}