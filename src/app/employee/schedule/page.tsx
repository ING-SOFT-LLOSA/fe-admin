"use client";
import { useState } from "react";
import EmployeeLayout from "@/components/EmployeeLayout";

type EventType = "meeting" | "signature" | "payment" | "construction" | "task";

const events: { id: number; title: string; time: string; type: EventType; client: string; completed?: boolean }[] = [
  { id: 1, title: "Reunión de presentación", time: "10:00 AM - 11:00 AM", type: "meeting", client: "Familia Gómez", completed: false },
  { id: 2, title: "Firma de contrato de separación", time: "12:30 PM - 01:00 PM", type: "signature", client: "Carlos Ruiz", completed: true },
  { id: 3, title: "Vencimiento cuota inicial", time: "Todo el día", type: "payment", client: "Ana Soto" },
  { id: 4, title: "Visita a obra", time: "03:00 PM - 04:30 PM", type: "construction", client: "Luis Vargas" },
  { id: 5, title: "Enviar reporte de avance", time: "05:00 PM", type: "task", client: "Múltiples", completed: false },
];

const typeStyles: Record<EventType, { bg: string; color: string; icon: string }> = {
  meeting: { bg: "#c2e8ff", color: "#001e2b", icon: "groups" },
  signature: { bg: "#E3F2FD", color: "#1565C0", icon: "draw" },
  payment: { bg: "#FFF3E0", color: "#E65100", icon: "payments" },
  construction: { bg: "#e9e0e1", color: "#4b4546", icon: "construction" },
  task: { bg: "#E8F5E9", color: "#2E7D32", icon: "check_circle" },
};

export default function EmployeeSchedulePage() {
  const [eventList, setEventList] = useState(events);

  const toggleTask = (id: number) => {
    setEventList(prev => prev.map(ev => ev.id === id && ev.type !== "payment" && ev.type !== "construction" ? { ...ev, completed: !ev.completed } : ev));
  };

  return (
    <EmployeeLayout>
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Cronograma</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Tu agenda de reuniones, firmas y tareas pendientes.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[17px]">add</span>Agendar Reunión
        </button>
      </div>

      <div className="flex gap-6 mt-4 animate-slide-up delay-100">
        {/* Mini Calendar Side */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[14px] font-bold text-[#1a1c1d]">Octubre 2024</span>
              <div className="flex gap-1">
                <button className="text-[#72787c] hover:text-[#1a1c1d]"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <button className="text-[#72787c] hover:text-[#1a1c1d]"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
              </div>
            </div>
            {/* Simple Grid Placeholder */}
            <div className="grid grid-cols-7 text-center gap-1 mb-2">
              {["D","L","M","M","J","V","S"].map(d => <span key={d} className="text-[10px] font-bold text-[#72787c]">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 31 }).map((_, i) => (
                <button key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${i + 1 === 24 ? "bg-[#023143] text-white" : "text-[#41484c] hover:bg-[#f4f3f5]"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[16px] font-bold text-[#1a1c1d]">Hoy, 24 Oct</span>
            <span className="px-2 py-0.5 bg-[#e2e2e4] text-[#41484c] rounded-full text-[10px] font-bold">{eventList.length} eventos</span>
          </div>

          {eventList.map((ev) => (
            <div key={ev.id} className="card p-4 flex items-center gap-4 group hover:border-[#023143]/20 transition-colors">
              <div className="w-16 text-right shrink-0">
                <p className="text-[12px] font-bold text-[#1a1c1d] leading-tight">{ev.time.split(" - ")[0]}</p>
                {ev.time.split(" - ")[1] && <p className="text-[10px] text-[#72787c]">{ev.time.split(" - ")[1]}</p>}
              </div>
              
              <div className="w-1.5 h-10 rounded-full" style={{ background: typeStyles[ev.type].bg }} />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: typeStyles[ev.type].color }}>{typeStyles[ev.type].icon}</span>
                  <p className={`text-[14px] font-bold ${ev.completed ? "text-[#72787c] line-through" : "text-[#1a1c1d]"}`}>{ev.title}</p>
                </div>
                <p className="text-[12px] text-[#41484c] mt-0.5">Cliente: <span className="font-semibold">{ev.client}</span></p>
              </div>

              {typeof ev.completed === "boolean" && (
                <button
                  onClick={() => toggleTask(ev.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    ev.completed
                      ? "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]"
                      : "border-[#e2e2e4] text-[#72787c] hover:border-[#023143] hover:text-[#023143]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {ev.completed ? "check" : "check_box_outline_blank"}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}
