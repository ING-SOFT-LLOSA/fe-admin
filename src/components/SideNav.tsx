"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

/* Explicit types — badge is optional ────────────────── */
type NavItem = {
  href: string;
  icon: string;
  label: string;
  requiredFuncs?: string[];
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    items: [
      { href: "/projects", icon: "architecture", label: "Gestión de proyectos", requiredFuncs: ["PROY_VER"] },
      { href: "/clientes", icon: "group", label: "Clientes y Asignaciones", requiredFuncs: ["PROY_VER"] },
      { href: "/finanzas", icon: "payments", label: "Pagos y Cronogramas", requiredFuncs: ["PAGOS_VER"] },
      { href: "/agenda", icon: "calendar_today", label: "Agenda y Citas" }, // Público para empleados
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/configuracion", icon: "settings", label: "Gestión de Empleados", requiredFuncs: ["USER_GESTIONAR", "ROL_GESTIONAR"] },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, perfil } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login-empresa");
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-50 h-full w-72 flex-col border-r border-slate-200 bg-build-bg px-6 py-8 shadow-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Brand */}
      <div className="mb-10 flex justify-center px-2">
        <svg width="160" viewBox="0 0 260 130" fill="currentColor" className="text-build-main" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="22" height="86" rx="2" />
          <rect x="30" y="16" width="22" height="70" rx="2" />
          <rect x="0" y="87" width="52" height="5" rx="1" />
          <text x="60" y="88" fontSize="72" fontWeight="800" fontFamily="Outfit, Arial, sans-serif" letterSpacing="-3" fill="currentColor">osa</text>
          <text x="1" y="118" fontSize="13" fontWeight="600" fontFamily="Outfit, Arial, sans-serif" letterSpacing="5.5" fill="currentColor" opacity="0.9">EDIFICACIONES</text>
        </svg>
      </div>

      {/* Nav */}
      <ul className="flex-grow space-y-2">
        {groups.map(({ label, items }, i) => {
          const visibleItems = items.filter(
            (item) =>
              !item.requiredFuncs ||
              item.requiredFuncs.some((func) => perfil?.funciones?.includes(func))
          );

          if (visibleItems.length === 0) return null;

          return (
            <li key={label ?? `group-${i}`}>
              {label && (
                <p className="px-4 mb-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              )}
              <ul className="space-y-1">
                {visibleItems.map(({ href, icon, label: lbl }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-200 ${
                          active
                            ? 'border-l-4 border-build-accent bg-white text-build-main shadow-sm'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={active ? { fontVariationSettings: "'FILL' 1", color: '#c49e5d' } : {}}
                        >
                          {icon}
                        </span>
                        <span>{lbl}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      {/* User profile + logout */}
      {/* Bottom CTA */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-build-main px-4 py-3 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-build-accent"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
