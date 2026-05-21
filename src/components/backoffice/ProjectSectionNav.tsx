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
    <div className="rounded-xl border border-[#e2e2e4] bg-white p-2 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
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
                  ? "bg-[#023143] text-white"
                  : "text-[#41484c] hover:bg-[#f4f3f5] hover:text-[#1a1c1d]"
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
