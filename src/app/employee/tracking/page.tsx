"use client";
import EmployeeLayout from "@/components/EmployeeLayout";

const alerts = [
  { id: 1, type: "Cliente sin contacto", client: "Carlos Ruiz", project: "Torre A", priority: "Alta", action: "Llamar ahora", icon: "phone_in_talk", color: "#ba1a1a", bg: "#ffdad6" },
  { id: 2, type: "Contrato pendiente", client: "Familia Gómez", project: "Los Pinos", priority: "Alta", action: "Revisar estado", icon: "assignment_late", color: "#E65100", bg: "#FFF3E0" },
  { id: 3, type: "Documento faltante (DNI)", client: "Ana Soto", project: "Edificio Central", priority: "Media", action: "Solicitar por correo", icon: "folder_open", color: "#1565C0", bg: "#E3F2FD" },
  { id: 4, type: "Avance de obra pendiente", client: "Varios", project: "Torre A", priority: "Media", action: "Subir fotos", icon: "add_a_photo", color: "#2E7D32", bg: "#E8F5E9" },
  { id: 5, type: "Reunión próxima (Mañana)", client: "Luis Vargas", project: "Torre A", priority: "Baja", action: "Preparar documentos", icon: "event", color: "#023143", bg: "#c2e8ff" },
];

export default function EmployeeTrackingPage() {
  return (
    <EmployeeLayout>
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Centro de Seguimiento</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Alertas y notificaciones operativas que requieren tu atención.</p>
        </div>
      </div>

      <div className="mt-4 space-y-4 animate-slide-up delay-100">
        <div className="flex gap-2 mb-2">
          <span className="px-3 py-1 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#ba1a1a]/20 transition-colors">2 Prioridad Alta</span>
          <span className="px-3 py-1 bg-[#f4f3f5] text-[#41484c] rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#e2e2e4] transition-colors">Todas las alertas (5)</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {alerts.map((a) => (
            <div key={a.id} className="card p-4 flex items-center gap-4 group hover:border-[#023143]/20 transition-colors border border-transparent" style={{ borderLeft: `4px solid ${a.color}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: a.color }}>{a.icon}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-[#1a1c1d]">{a.type}</p>
                  <span
                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full"
                    style={{ background: a.bg, color: a.color }}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-[12px] text-[#41484c] mt-0.5">Cliente: <span className="font-semibold text-[#1a1c1d]">{a.client}</span> • Proyecto: <span className="font-medium">{a.project}</span></p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button className="px-4 py-2 bg-white border border-[#e2e2e4] text-[#41484c] text-[12px] font-bold rounded-lg hover:border-[#023143] hover:text-[#023143] transition-colors">
                  {a.action}
                </button>
                <button className="p-2 text-[#72787c] hover:bg-[#f4f3f5] hover:text-[#ba1a1a] rounded-lg transition-colors" title="Descartar alerta">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}
