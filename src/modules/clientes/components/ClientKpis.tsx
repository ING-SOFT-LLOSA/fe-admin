// Removed mock import

type ClientKpisProps = {
  assignments: any[];
};

export default function ClientKpis({ assignments }: ClientKpisProps) {
  const activeCount = assignments.filter((a) => a.status === "Vigente").length;
  const projectNames = new Set(assignments.filter((a) => a.status === "Vigente").map((a) => a.projectName));
  const expedientCount = activeCount; // 1 expediente por asignación activa

  const kpis = [
    { title: "Propiedades", value: activeCount, icon: "domain" },
    { title: "Expedientes", value: expedientCount, icon: "folder_open" },
    { title: "Proyectos", value: projectNames.size, icon: "apartment" },
    {
      title: "Estado",
      value: activeCount > 0 ? "Activo" : "Sin unidades",
      icon: activeCount > 0 ? "check_circle" : "pending",
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.title}
          className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-build-accent text-[20px]">{kpi.icon}</span>
            <p className="text-[11px] uppercase font-bold text-slate-500 dark:text-white/50 tracking-wider">
              {kpi.title}
            </p>
          </div>
          <p className="text-2xl font-bold text-build-main dark:text-white">{kpi.value}</p>
        </div>
      ))}
    </section>
  );
}