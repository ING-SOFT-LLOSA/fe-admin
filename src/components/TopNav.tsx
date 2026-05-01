"use client";
import { usePathname } from "next/navigation";

const crumbs: Record<string, string> = {
  dashboard:   "Dashboard",
  clients:     "Clientes",
  properties:  "Propiedades",
  contracts:   "Contratos",
  projects:    "Proyectos",
  schedule:    "Cronograma",
  templates:   "Plantillas",
  tracking:    "Seguimiento y Alertas",
  employees:   "Empleados",
  permissions: "Permisos",
  settings:    "Configuración",
};

export default function TopNav() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const label   = crumbs[segment] ?? segment;

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-8 bg-white/90 backdrop-blur-sm border-b border-[#e2e2e4] shadow-[0_1px_0_rgba(0,0,0,.04)]">
      {/* Left: brand + breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-[#023143] tracking-tight">Backoffice</span>
        <span className="text-[#c1c7cc]">/</span>
        <span className="text-[13px] font-semibold text-[#1a1c1d]">{label}</span>
      </div>

      {/* Center: search */}
      <div className="flex-1 max-w-sm mx-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-[17px]">search</span>
          <input
            type="text"
            placeholder="Buscar cualquier cosa..."
            className="w-full bg-[#f4f3f5] border border-transparent hover:border-[#c1c7cc] focus:border-[#023143] focus:bg-white rounded-lg pl-9 pr-12 py-2 text-[13px] text-[#1a1c1d] placeholder:text-[#72787c] outline-none transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#72787c] font-semibold bg-[#e2e2e4] px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-[#72787c] hover:text-[#023143] hover:bg-[#f4f3f5] transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white animate-pulse-soft" />
        </button>
        <button className="p-2 rounded-lg text-[#72787c] hover:text-[#023143] hover:bg-[#f4f3f5] transition-colors">
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
        </button>
        <div className="w-px h-5 bg-[#e2e2e4] mx-1" />
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#e2e2e4] group-hover:border-[#023143] transition-colors">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQCxfrU0eUzvhEwSM5jiDBDTDs8OlnbNicpfojqEXMvPlgUWxYx6kZncBR3is4w_OcsIPB5JeJ0U3MuS8tPRp5rDqMhKE-Nw3LESpFtluKqGB38mMNUfncBHAqi8twEUCc1NeZ1ttVPvO0MTuURHoQvDa8ZdVTw_Rcarcv1mjiJ_JAH8Em2ygMmGSf3GBaCaKQAzVBAPm7o6XpT7Qxpzh24qOtJt_dykIni7yyxUOvvWkrE0i8hGvceYrFupC1AzGhDN347MZkgYr"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:block">
            <p className="text-[12px] font-semibold text-[#1a1c1d] leading-none">Admin</p>
            <p className="text-[10px] text-[#72787c] mt-0.5">Admin Global</p>
          </div>
        </div>
      </div>
    </header>
  );
}
