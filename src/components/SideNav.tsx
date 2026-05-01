"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* Explicit types — badge is optional ────────────────── */
type NavItem = {
  href: string;
  icon: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Administración",
    items: [
      { href: "/employees",   icon: "badge",          label: "Empleados"  },
      { href: "/permissions", icon: "lock_person",    label: "Permisos"},
      { href: "/settings",    icon: "settings",       label: "Configuración"   },
    ],
  },
  {
    label: "Principal",
    items: [
      { href: "/admin/dashboard",   icon: "dashboard",      label: "Dashboard"  },
      { href: "/clients",     icon: "group",          label: "Clientes"    },
      { href: "/properties",  icon: "domain",         label: "Propiedades" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/projects",    icon: "architecture",   label: "Proyectos"   },
      { href: "/schedule",    icon: "calendar_today", label: "Cronograma"   },
      { href: "/progress",    icon: "photo_library",  label: "Avances de Obra"   },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-40 bg-[#023143] flex flex-col border-r border-white/8 shadow-2xl">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[20px] fill">domain</span>
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white leading-tight tracking-tight">Llosa Edificaciones</h1>
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-widest mt-0.5">Admin. Corporativo</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ href, icon, label: lbl }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? "bg-white/12 text-white border-l-[3px] border-white pl-[9px]"
                        : "text-white/60 hover:text-white hover:bg-white/6 border-l-[3px] border-transparent pl-[9px]"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[19px] transition-all ${active ? "fill" : "group-hover:scale-110"}`}>
                      {icon}
                    </span>
                    <span className="flex-1">{lbl}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/8 space-y-1">
        {/* Profile row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#c2e8ff]/20 border border-white/20 overflow-hidden shrink-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQCxfrU0eUzvhEwSM5jiDBDTDs8OlnbNicpfojqEXMvPlgUWxYx6kZncBR3is4w_OcsIPB5JeJ0U3MuS8tPRp5rDqMhKE-Nw3LESpFtluKqGB38mMNUfncBHAqi8twEUCc1NeZ1ttVPvO0MTuURHoQvDa8ZdVTw_Rcarcv1mjiJ_JAH8Em2ygMmGSf3GBaCaKQAzVBAPm7o6XpT7Qxpzh24qOtJt_dykIni7yyxUOvvWkrE0i8hGvceYrFupC1AzGhDN347MZkgYr"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">Usuario Admin</p>
            <p className="text-[10px] text-white/40 truncate">Admin Global</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-[#ffdad6] hover:bg-[#ba1a1a]/15 transition-all duration-150 group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
            logout
          </span>
          <span className="text-[13px] font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
