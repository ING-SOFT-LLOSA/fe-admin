"use client";
import EmployeeLayout from "@/components/EmployeeLayout";

const kpis = [
  { label: "Clientes Asignados", val: 34, icon: "group", bg: "#c2e8ff", ic: "#001e2b" },
  { label: "Contratos Pendientes", val: 5, icon: "pending_actions", bg: "#ffdad6", ic: "#93000a" },
  { label: "Reuniones de Hoy", val: 2, icon: "event", bg: "#e9e0e1", ic: "#4b4546" },
  { label: "Seguimientos Vencidos", val: 4, icon: "warning", bg: "#ffdcbf", ic: "#2d1600" },
  { label: "Avances por Enviar", val: 7, icon: "photo_library", bg: "#d1fae5", ic: "#065f46" },
];

const nextActions = [
  { id: 1, text: "Llamar a cliente Carlos Ruiz (Sin seguimiento > 7 días)", type: "call", icon: "call", color: "#1565C0", bg: "#E3F2FD" },
  { id: 2, text: "Revisar contrato de separación - Dpto 402 Torre A", type: "document", icon: "description", color: "#E65100", bg: "#FFF3E0" },
  { id: 3, text: "Agendar firma con familia Gómez", type: "event", icon: "edit_calendar", color: "#023143", bg: "#c2e8ff" },
  { id: 4, text: "Subir avance de obra - Los Pinos Lote 12", type: "upload", icon: "upload", color: "#2E7D32", bg: "#E8F5E9" },
  { id: 5, text: "Confirmar recepción de documentos DNI/RUC - Ana Soto", type: "check", icon: "fact_check", color: "#4b4546", bg: "#e2e2e4" },
];

export default function EmployeeDashboardPage() {
  return (
    <EmployeeLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <p className="text-[12px] font-semibold text-[#72787c] uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <h2 className="text-[30px] font-bold tracking-tight text-[#1a1c1d]">Mi Dashboard</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Resumen de tus tareas y clientes asignados para hoy.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[17px]">add</span>Nuevo Seguimiento
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4 mt-2">
        {kpis.map((k, i) => (
          <div key={k.label} className={`card p-5 animate-slide-up delay-${i * 50}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <span className="material-symbols-outlined text-[17px]" style={{ color: k.ic }}>{k.icon}</span>
              </div>
            </div>
            <div className="text-[26px] font-bold text-[#1a1c1d] leading-none mb-1">
              {k.val}
            </div>
            <p className="text-[11px] text-[#72787c] font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Mis Próximas Acciones ── */}
      <div className="mt-4 card p-6 animate-slide-up delay-300">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1c1d]">Mis Próximas Acciones</h3>
            <p className="text-[12px] text-[#72787c] mt-0.5">Tareas prioritarias que requieren tu atención</p>
          </div>
          <span className="text-[11px] font-semibold text-[#72787c]">{nextActions.length} pendientes</span>
        </div>
        
        <div className="space-y-3">
          {nextActions.map((action) => (
            <div key={action.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#e2e2e4] hover:bg-[#f9f9fb] transition-colors group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: action.bg }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: action.color }}>{action.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#1a1c1d]">{action.text}</p>
              </div>
              <button className="px-4 py-1.5 border border-[#e2e2e4] text-[#41484c] text-[12px] font-semibold rounded-lg hover:bg-white transition-colors">
                Resolver
              </button>
            </div>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}
