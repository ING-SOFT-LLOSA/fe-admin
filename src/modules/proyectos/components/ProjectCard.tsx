import Link from "next/link";
import { formatProjectDate } from "@/modules/proyectos/utils/format";
import type { Proyecto } from "../types/proyecto";

type Props = {
  project: Proyecto;
};

export default function ProjectCard({ project }: Props) {
  return (
<Link
href={`/proyectos/${project.id}`}
className="group block rounded-2xl border border-slate-200
            dark:border-white/10 bg-white dark:bg-white/5
            p-5 shadow-sm hover:border-build-accent
            hover:shadow-md transition-all"
>

<div className="flex items-center justify-between">
  <div>
    <h3 className="text-lg font-bold  text-slate-500">
      {project.nombre}
    </h3>

    <p className="text-sm text-slate-500">
      {project.distrito || project.departamento}
    </p>
  </div>

  <div className="w-10 h-10 rounded-xl bg-build-bg flex items-center justify-center">
    <span className="material-symbols-outlined">
      apartment
    </span>
  </div>
</div>

<div className="mt-4 grid grid-cols-3 gap-3">
  <div>
    <p className="text-[11px] text-slate-500 uppercase">Inicio</p>
    <p className="font-medium">
      {project.fechaInicio
        ? formatProjectDate(new Date(project.fechaInicio))
        : "-"}
    </p>
  </div>

  <div>
    <p className="text-[11px] text-slate-500 uppercase">Clientes</p>
    <p className="font-medium">85</p>
  </div>

  <div>
    <p className="text-[11px] text-slate-500 uppercase">Dptos.</p>
    <p className="font-medium">120</p>
  </div>
</div>

<div className="mt-4 text-right text-sm font-semibold text-build-accent">
  Ver detalles →
</div>
</Link>
  );
}