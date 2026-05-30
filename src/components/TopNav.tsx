"use client";
import { usePathname } from "next/navigation";

const crumbs: Record<string, string> = {
  projects: "Gestión de proyectos",
  proyectos: "Gestión de proyectos",
  clientes: "Clientes y Asignaciones",
  finanzas: "Pagos y Cronogramas",
  legal: "Expedientes Legales",
  agenda: "Agenda y Citas",
  progress: "Avances Multimedia",
  configuracion: "Gestión de Empleados",
};

export default function TopNav() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const label = crumbs[segment] ?? segment;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-8">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-build-main tracking-tight">Backoffice</span>
        <span className="text-build-accent">/</span>
        <span className="text-[13px] font-semibold text-build-main">{label}</span>
      </div>

      {/* Center: search */}
      <div className="flex-1 max-w-sm mx-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-build-accent text-[17px]">search</span>
          <input
            type="text"
            placeholder="Buscar cualquier cosa..."
            className="w-full bg-white border border-transparent hover:border-build-accent focus:border-build-main focus:bg-white rounded-lg pl-9 pr-12 py-2 text-[13px] text-build-main placeholder:text-build-accent outline-none transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-build-main font-semibold bg-build-accent/20 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-build-accent hover:text-build-main hover:bg-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-build-main rounded-full ring-2 ring-build-bg animate-pulse-soft" />
        </button>
        <button className="p-2 rounded-lg text-build-accent hover:text-build-main hover:bg-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
        </button>
        <div className="w-px h-5 bg-build-accent mx-1" />
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-build-accent group-hover:border-build-main transition-colors">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQCxfrU0eUzvhEwSM5jiDBDTDs8OlnbNicpfojqEXMvPlgUWxYx6kZncBR3is4w_OcsIPB5JeJ0U3MuS8tPRp5rDqMhKE-Nw3LESpFtluKqGB38mMNUfncBHAqi8twEUCc1NeZ1ttVPvO0MTuURHoQvDa8ZdVTw_Rcarcv1mjiJ_JAH8Em2ygMmGSf3GBaCaKQAzVBAPm7o6XpT7Qxpzh24qOtJt_dykIni7yyxUOvvWkrE0i8hGvceYrFupC1AzGhDN347MZkgYr"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:block">
            <p className="text-[12px] font-semibold text-build-main leading-none">Admin</p>
            <p className="text-[10px] text-build-accent mt-0.5">Admin Global</p>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
