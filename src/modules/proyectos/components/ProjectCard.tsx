import Link from "next/link";
import { formatProjectDate } from "@/modules/proyectos/utils/format";
import type { Proyecto } from "../types/proyecto";

type Props = {
  readonly project: Proyecto;
  readonly clientesCount?: number;
  readonly dptosCount?: number;
  readonly avance?: number;
};

export default function ProjectCard({ project, clientesCount, dptosCount, avance }: Readonly<Props>) {
  const showInicio = !!project.fechaInicio;
  const showLocation = !!(project.distrito || project.departamento);

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="group block rounded-2xl border border-slate-200
            dark:border-white/10 bg-white dark:bg-white/5
            p-5 shadow-sm hover:border-arch-gold
            hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-build-main dark:text-white group-hover:text-arch-gold transition-colors">
            {project.nombre}
          </h3>
          <div className="flex flex-wrap gap-2 items-center mt-1">
            {showLocation && (
              <p className="text-sm text-slate-500 dark:text-white/60">
                {project.distrito || project.departamento}
              </p>
            )}
            {project.precertificacionEdgeLeed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                <span className="material-symbols-outlined text-[12px] font-bold">eco</span>
                <span>LEED / EDGE</span>
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-build-bg dark:bg-white/10 flex items-center justify-center text-build-main dark:text-white">
          <span className="material-symbols-outlined">
            apartment
          </span>
        </div>
      </div>

      {/* Avance Físico de Obra */}
      <div className="mt-4 border-t border-slate-100 dark:border-white/5 pt-4">
        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
          <span className="text-slate-500 uppercase">Avance de Obra</span>
          {avance === undefined ? (
            <div className="h-3.5 w-8 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
          ) : (
            <span className="text-arch-gold font-bold">{avance.toFixed(0)}%</span>
          )}
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-arch-gold h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, avance ?? 0))}%` }}
          />
        </div>
      </div>

      <div className={`mt-4 grid ${showInicio ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
        {showInicio && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase">Inicio</p>
            <p className="font-medium text-xs sm:text-sm">
              {formatProjectDate(new Date(project.fechaInicio))}
            </p>
          </div>
        )}
        <div>
          <p className="text-[11px] text-slate-500 uppercase">Clientes</p>
          {clientesCount === undefined ? (
            <div className="mt-1 h-4 w-10 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
          ) : (
            <p className="font-medium">{clientesCount}</p>
          )}
        </div>
        <div>
          <p className="text-[11px] text-slate-500 uppercase">Dptos.</p>
          {dptosCount === undefined ? (
            <div className="mt-1 h-4 w-10 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
          ) : (
            <p className="font-medium">{dptosCount}</p>
          )}
        </div>
      </div>
    </Link>
  );
}