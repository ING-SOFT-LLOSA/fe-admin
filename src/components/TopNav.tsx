"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const crumbs: Record<string, string> = {
  projects:      "Proyectos e Inventario",
  proyectos:     "Proyectos e Inventario",
  clientes:      "Clientes y Asignaciones",
  obra:          "Avance de Obra",
  finanzas:      "Pagos y Cronogramas",
  legal:         "Gestión Legal",
  agenda:        "Agenda y Citas",
  progress:      "Avances Multimedia",
  configuracion: "Gestión de Empleados",
  dashboard:     "Mi Dashboard",
  clients:       "Mis Clientes",
  contracts:     "Mis Contratos",
  schedule:      "Cronograma",
  tracking:      "Seguimiento",
  employee:      "Portal Empleado",
};

/** Returns a friendly role label from tipoUsuario / rol */
function getRoleLabel(tipoUsuario: string | undefined, rol: string | null | undefined): string {
  if (rol === "ADMIN") return "Admin Global";
  if (tipoUsuario === "GERENTE") return "Gerente";
  if (tipoUsuario === "EMPLEADO") return "Empleado";
  if (tipoUsuario === "ADMIN") return "Administrador";
  return tipoUsuario ?? "Usuario";
}

export default function TopNav() {
  const pathname = usePathname();
  const { perfil } = useAuth();

  // Derive breadcrumb from the first two meaningful segments.
  // e.g. /employee/dashboard → "Portal Empleado / Mi Dashboard"
  const segments = pathname.split("/").filter(Boolean);
  const first  = segments[0] ?? "dashboard";
  const second = segments[1];

  const rootLabel  = crumbs[first]  ?? first;
  const childLabel = second ? (crumbs[second] ?? null) : null;

  const displayName = perfil?.nombre?.trim() || "Usuario";
  const roleLabel   = getRoleLabel(perfil?.tipoUsuario, perfil?.rol);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-[#0d0b0c]/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-6 md:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-bold text-build-main dark:text-white tracking-tight shrink-0">
            {first === "employee" ? "Portal Empleado" : "Backoffice"}
          </span>
          <span className="text-build-accent dark:text-build-accent/70 shrink-0">/</span>
          <span className="text-[13px] font-medium text-build-accent dark:text-white/60 truncate">
            {childLabel ?? rootLabel}
          </span>
        </nav>

        {/* Right: avatar + user info */}
        <div className="flex items-center gap-2 pl-2 shrink-0">
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0">
            <span className="material-symbols-outlined text-[18px] text-build-accent dark:text-white/50">
              person
            </span>
          </div>

          {/* Name + role — hidden on small screens */}
          <div className="hidden sm:block leading-none">
            <p className="text-[12px] font-semibold text-build-main dark:text-white leading-none">
              {displayName}
            </p>
            <p className="text-[10px] text-build-accent dark:text-white/40 mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
