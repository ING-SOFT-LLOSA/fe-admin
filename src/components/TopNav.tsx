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
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const label = crumbs[segment] ?? segment;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-[#0d0b0c]/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-build-main dark:text-white tracking-tight">Backoffice</span>
          <span className="text-build-accent dark:text-build-accent/80">/</span>
          <span className="text-[13px] font-semibold text-build-main dark:text-white/80">{label}</span>
        </div>

        {/* Center: search */}
        <div className="flex-1 max-w-sm mx-8">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-build-accent text-[17px]">search</span>
            <input
              type="text"
              placeholder="Buscar cualquier cosa..."
              className="w-full bg-white dark:bg-white/5 border border-transparent dark:border-white/10 hover:border-build-accent dark:hover:border-build-accent focus:border-build-main dark:focus:border-build-accent focus:bg-white dark:focus:bg-slate-800 rounded-lg pl-9 pr-12 py-2 text-[13px] text-build-main dark:text-white placeholder:text-build-accent outline-none transition-all duration-200"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-build-main dark:text-white/70 font-semibold bg-build-accent/20 px-1.5 py-0.5 rounded">Ctrl K</kbd>
          </div>
        </div>

        {/* Right: actions + avatar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="relative p-2 rounded-lg text-build-accent hover:text-build-main dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-build-main dark:bg-white rounded-full ring-2 ring-build-bg dark:ring-slate-900 animate-pulse-soft" />
          </button>
          <button className="p-2 rounded-lg text-build-accent hover:text-build-main dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
          <div className="w-px h-5 bg-build-accent mx-1" />
          <div className="flex items-center gap-2 pl-1 cursor-pointer group">
            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-build-accent group-hover:border-build-main dark:group-hover:border-white transition-colors">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQCxfrU0eUzvhEwSM5jiDBDTDs8OlnbNicpfojqEXMvPlgUWxYx6kZncBR3is4w_OcsIPB5JeJ0U3MuS8tPRp5rDqMhKE-Nw3LESpFtluKqGB38mMNUfncBHAqi8twEUCc1NeZ1ttVPvO0MTuURHoQvDa8ZdVTw_Rcarcv1mjiJ_JAH8Em2ygMmGSf3GBaCaKQAzVBAPm7o6XpT7Qxpzh24qOtJt_dykIni7yyxUOvvWkrE0i8hGvceYrFupC1AzGhDN347MZkgYr"
                alt="Admin"
                className="w-full h-full object-cover"
              />
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
