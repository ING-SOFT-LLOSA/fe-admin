"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

/* Explicit types; badge is optional. */
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
      { href: "/proyectos", icon: "architecture", label: "Proyectos e Inventario", requiredFuncs: ["PROY_VER"] },
      { href: "/clientes", icon: "group", label: "Clientes y Asignaciones", requiredFuncs: ["PROY_VER"] },
      { href: "/obra", icon: "engineering", label: "Avance de Obra", requiredFuncs: ["OBRA_VER", "PROY_VER"] },
      { href: "/legal", icon: "balance", label: "Gestión Legal", requiredFuncs: ["PROY_VER"] },
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
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-50 h-full w-72 flex-col border-r border-white/10 bg-build-main px-6 py-8 shadow-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Brand */}
      <div className="mb-12 flex justify-center">
        <img
          src="/logo_llosa.png"
          alt="Llosa Edificaciones"
          className="h-30 w-auto object-contain brightness-0 invert"
        />
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
                <p className="px-4 mb-2 mt-4 text-[10px] font-bold text-build-bg/40 uppercase tracking-widest">{label}</p>
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
                            ? 'border-l-4 border-arch-gold bg-white/10 text-build-bg shadow-sm'
                            : 'text-build-bg/70 hover:bg-white/10 hover:text-build-bg'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={active ? { fontVariationSettings: "'FILL' 1", color: '#CEBD93' } : {}}
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

      {/* Bottom CTA */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-[13px] font-bold text-build-bg shadow-sm transition-colors hover:bg-white/20"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
