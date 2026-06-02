"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "", label: "Resumen" },
  { href: "/unidades", label: "Inventario" },
];

type ProjectSectionNavProps = {
  projectId: string;
};

export default function ProjectSectionNav({ projectId }: ProjectSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const href = `/proyectos/${projectId}${section.href}`;
          const active = section.href === "" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? "bg-build-main text-white"
                  : "text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:bg-white/10 hover:text-build-main dark:text-white"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
