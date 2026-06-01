"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "", label: "Resumen" },
  { href: "/obra", label: "Obra" },
  { href: "/unidades", label: "Unidades" },
];

type ProjectSectionNavProps = {
  projectId: string;
};

export default function ProjectSectionNav({ projectId }: ProjectSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const href = `/projects/${projectId}${section.href}`;
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? "bg-build-main text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-build-main"
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
