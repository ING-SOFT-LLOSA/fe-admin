"use client";

import { useAuth } from "@/contexts/AuthContext";

const kpis = [
  { label: "Clientes Asignados",     val: 34, icon: "group",          bg: "#c2e8ff", ic: "#001e2b" },
  { label: "Contratos Pendientes",   val: 5,  icon: "pending_actions", bg: "#ffdad6", ic: "#93000a" },
  { label: "Reuniones de Hoy",       val: 2,  icon: "event",           bg: "#e9e0e1", ic: "#4b4546" },
  { label: "Seguimientos Vencidos",  val: 4,  icon: "warning",         bg: "#ffdcbf", ic: "#2d1600" },
  { label: "Avances por Enviar",     val: 7,  icon: "photo_library",   bg: "#d1fae5", ic: "#065f46" },
];

const nextActions = [
  { id: 1, text: "Llamar a cliente Carlos Ruiz (Sin seguimiento > 7 días)",   icon: "call",          color: "#1565C0", bg: "#E3F2FD" },
  { id: 2, text: "Revisar contrato de separación - Dpto 402 Torre A",         icon: "description",   color: "#E65100", bg: "#FFF3E0" },
  { id: 3, text: "Agendar firma con familia Gómez",                           icon: "edit_calendar", color: "#023143", bg: "#c2e8ff" },
  { id: 4, text: "Subir avance de obra - Los Pinos Lote 12",                  icon: "upload",        color: "#2E7D32", bg: "#E8F5E9" },
  { id: 5, text: "Confirmar recepción de documentos DNI/RUC - Ana Soto",      icon: "fact_check",    color: "#4b4546", bg: "#e2e2e4" },
];

export default function EmployeeDashboardPage() {
  const { perfil } = useAuth();

  const firstName = perfil?.nombre?.trim().split(" ")[0] ?? "Empleado";

  return (
    <>
      {/* ── Header ── */}
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
            Hola, {firstName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Resumen de tus tareas y clientes asignados para hoy.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-build-main text-white rounded-lg text-sm font-semibold hover:bg-build-main/80 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Seguimiento
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`card p-5 animate-slide-up delay-${i * 50}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: k.bg }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: k.ic }}>{k.icon}</span>
            </div>
            <p className="text-2xl font-bold text-build-main dark:text-white leading-none mb-1">{k.val}</p>
            <p className="text-xs text-slate-500 dark:text-white/40 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Mis Próximas Acciones ── */}
      <div className="card animate-slide-up delay-300">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-build-main dark:text-white">Mis Próximas Acciones</h3>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              Tareas prioritarias que requieren tu atención
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
            {nextActions.length} pendientes
          </span>
        </div>

        {/* Action rows */}
        <div className="p-5 space-y-2">
          {nextActions.map((action) => (
            <div
              key={action.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: action.bg }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: action.color }}>
                  {action.icon}
                </span>
              </div>
              <p className="flex-1 text-sm text-slate-700 dark:text-white/80 font-medium">{action.text}</p>
              <button className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors shrink-0">
                Resolver
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
