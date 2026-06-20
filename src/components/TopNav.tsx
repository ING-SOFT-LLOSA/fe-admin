"use client";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const crumbs: Record<string, string> = {
  projects: "Proyectos e Inventario",
  proyectos: "Proyectos e Inventario",
  clientes: "Clientes y Asignaciones",
  obra: "Avance de Obra",
  finanzas: "Pagos y Cronogramas",
  legal: "Gestión Legal",
  agenda: "Agenda y Citas",
  progress: "Avances Multimedia",
  configuracion: "Gestión de Empleados",
};

export default function TopNav() {
  const pathname = usePathname();
  const segment = pathname.split("/").find(Boolean) ?? "dashboard";
  const label = crumbs[segment] ?? segment;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-[#0d0b0c]/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-build-main dark:text-white tracking-tight">Backoffice</span>
          <span className="text-build-accent dark:text-build-accent/80">/</span>
          <span className="text-[13px] font-semibold text-build-main dark:text-white/80">{label}</span>
        </div>



        {/* Right: actions + avatar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-px h-5 bg-build-accent/30 mx-1" />
          <div className="flex items-center gap-2 pl-1 cursor-pointer group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-build-accent/50 group-hover:border-build-main dark:group-hover:border-white transition-colors bg-slate-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-[16px] text-build-accent group-hover:text-build-main dark:group-hover:text-white">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] font-semibold text-build-main dark:text-white leading-none">Admin</p>
              <p className="text-[10px] text-build-accent mt-0.5">Admin Global</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
