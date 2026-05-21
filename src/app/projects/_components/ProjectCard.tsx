import Link from "next/link";

import type { ProjectMock } from "../_data/mock-projects";
import { formatProjectDate, getProjectStats } from "../_data/mock-projects";

type ProjectCardProps = {
  project: ProjectMock;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const { towersCount } = getProjectStats(project);

  return (
    <article className="rounded-xl border border-[#e2e2e4] bg-white p-5 shadow-[0_4px_20px_rgba(2,49,67,0.03)] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(2,49,67,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#c2e8ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#001e2b]">
              Proyecto
            </span>
            <span className="text-[12px] font-semibold text-[#72787c]">
              Inicio {formatProjectDate(project.date_init)}
            </span>
          </div>

          <div>
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">{project.name}</h2>
            <p className="mt-1 text-sm text-[#41484c]">{project.district}</p>
          </div>

          <div className="grid gap-3 text-sm text-[#41484c] md:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">Direccion</p>
              <p className="mt-1">{project.direction}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">Torres</p>
              <p className="mt-1">{towersCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">UUID</p>
              <p className="mt-1 truncate">{project.uuid_proyecto}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#023143] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#001b27]"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Mas detalles
          </Link>
        </div>
      </div>
    </article>
  );
}
