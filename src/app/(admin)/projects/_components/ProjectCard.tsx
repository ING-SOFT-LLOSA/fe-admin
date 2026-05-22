import Link from "next/link";

import type { ProjectMock } from "../_data/mock-projects";
import { formatProjectDate, getProjectStats } from "../_data/mock-projects";

type ProjectCardProps = {
  project: ProjectMock;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const { towersCount } = getProjectStats(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-build-accent group"
    >
      <article>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Proyecto
              </span>
              <span className="text-[12px] font-semibold text-slate-500">
                Inicio {formatProjectDate(project.date_init)}
              </span>
            </div>

            <div>
              <h2 className="text-[20px] font-bold text-build-main group-hover:text-build-accent transition-colors">
                {project.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{project.district}</p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Direccion</p>
                <p className="mt-1">{project.direction}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Torres</p>
                <p className="mt-1">{towersCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">UUID</p>
                <p className="mt-1 truncate">{project.uuid_proyecto}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <div className="inline-flex items-center gap-2 rounded-xl bg-build-main px-4 py-2 text-sm font-bold text-white transition-all shadow-sm group-hover:bg-build-accent">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Mas detalles
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
