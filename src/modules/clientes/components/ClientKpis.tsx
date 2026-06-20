import { ClienteAssignment } from "@/types/user";

type ClientKpisProps = {
  readonly assignments: readonly ClienteAssignment[];
};

export default function ClientKpis({ assignments }: Readonly<ClientKpisProps>) {
  const activeCount = assignments.filter((a) => a.status === "Vigente").length;
  const projectNames = new Set(assignments.filter((a) => a.status === "Vigente").map((a) => a.projectName));

  const kpis = [
    { title: "Propiedades", value: activeCount, icon: "domain" },
    { title: "Proyectos", value: projectNames.size, icon: "apartment" },
    {
      title: "Estado",
      value: activeCount > 0 ? "Activo" : "Sin unidades",
      icon: activeCount > 0 ? "check_circle" : "pending",
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.title}
          className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-arch-gold text-[20px]">{kpi.icon}</span>
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