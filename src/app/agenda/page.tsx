"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type CalEvent = {
  id: string;
  label: string;
  bg: string;
  text: string;
  dot?: string;
  icon?: string;
  time?: string;
  client?: string;
  type?: string;
  unit?: string;
};

type CalDay = {
  day: number;
  grey?: boolean;
  today?: boolean;
  events: CalEvent[];
};

const INITIAL_CAL_DAYS: CalDay[] = [
  { day: 30, grey: true, events: [] }, { day: 1, events: [] },
  { day: 2, events: [{ id: "ee1", label: "Reunión Cliente - Torres", bg: "bg-[#c2e8ff]", dot: "bg-[#001e2b]", text: "text-[#001e2b]", time: "09:00", client: "Torres", type: "General" }] },
  { day: 3, events: [] },
  { day: 4, events: [{ id: "ee2", label: "Firma: Miraflores 402", bg: "bg-[#e9e0e1]", dot: "bg-[#1e1b1c]", text: "text-[#1e1b1c]", time: "14:30", client: "Miraflores", type: "Firma" }] },
  { day: 5, grey: true, events: [] }, { day: 6, grey: true, events: [] },
  { day: 7, events: [{ id: "ee3", label: "Inicio Proyecto: Torre Q", bg: "bg-[#ffdcbf]", dot: "bg-[#2d1600]", text: "text-[#2d1600]" }] },
  {
    day: 8, today: true, events: [
      { id: "ee4", label: "Entrega Doc - Municipalidad", bg: "bg-[#eeeeef]", icon: "description", text: "text-[#41484c]", time: "09:00", type: "Admin" },
      { id: "ee5", label: "Revisión Interna", bg: "bg-[#c2e8ff]", dot: "bg-[#001e2b]", text: "text-[#001e2b]", time: "14:30", type: "Revisión" }
    ]
  },
  { day: 9, events: [] }, { day: 10, events: [] }, { day: 11, events: [] },
  { day: 12, grey: true, events: [] }, { day: 13, grey: true, events: [] },
  { day: 14, events: [] }, { day: 15, events: [] }, { day: 16, events: [] }, { day: 17, events: [] }, { day: 18, events: [] },
  { day: 19, grey: true, events: [] }, { day: 20, grey: true, events: [] },
];

const EVENT_TYPES = [
  "Recepción de departamento",
  "Entrega de llaves",
  "Revisión de observaciones",
  "Firma de Contrato",
  "Visita Técnica",
  "Reunión General"
];

const CLIENTS_MOCK = [
  { id: "C001", name: "Carlos Mendoza", unit: "Torre Aviana - 1402" },
  { id: "C002", name: "Maria Rojas", unit: "Parque Sur - 501" },
  { id: "C003", name: "Luis Fernandez", unit: "Lumiere - 204" },
];

export default function SchedulePage() {
  const [calDays, setCalDays] = useState<CalDay[]>(INITIAL_CAL_DAYS);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [clientId, setClientId] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("Oficina Principal");
  const [errorMsg, setErrorMsg] = useState("");

  // UX State
  const [simulateGoogleFail, setSimulateGoogleFail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const selectedClient = CLIENTS_MOCK.find(c => c.id === clientId);

  function resetForm() {
    setClientId("");
    setEventType(EVENT_TYPES[0]);
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setLocation("Oficina Principal");
    setErrorMsg("");
  }

  function handleOpenModal() {
    resetForm();
    setSuccessMsg("");
    setWarningMsg("");
    setModalOpen(true);
  }

  function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setWarningMsg("");

    if (!clientId || !eventDate || !startTime || !endTime) {
      setErrorMsg("Por favor completa todos los campos requeridos.");
      return;
    }

    // Validate past dates
    const selectedDateTime = new Date(`${eventDate}T${startTime}`);
    if (selectedDateTime < new Date()) {
      setErrorMsg("Error: No puedes agendar citas en fechas/horas pasadas.");
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);

      const newEvent: CalEvent = {
        id: `EV_${Date.now()}`,
        label: `${eventType} - ${selectedClient?.name}`,
        bg: "bg-[#c2e8ff]",
        dot: "bg-[#001e2b]",
        text: "text-[#001e2b]",
        time: startTime,
        client: selectedClient?.name,
        type: eventType,
        unit: selectedClient?.unit
      };

      // Find the day mapped to local grid (for demo, just push it to the actual day number)
      // Since it's a mock grid, find by day number
      const dayNum = parseInt(eventDate.split("-")[2], 10);

      let updatedCalendar = false;
      const newGrid = calDays.map(cd => {
        if (cd.day === dayNum && !cd.grey) {
          updatedCalendar = true;
          return { ...cd, events: [...cd.events, newEvent] };
        }
        return cd;
      });

      // If day is outside the visible grid simply set state (it won't render but that's fine for mock)
      setCalDays(newGrid);

      if (simulateGoogleFail) {
        setWarningMsg("Cita guardada en el portal. La sincronización con Google Calendar experimentó un retraso y se reintentará en breve mediante un Worker.");
      } else {
        setSuccessMsg("Cita agendada y notificada exitosamente al correo/calendario del cliente.");
      }

      setTimeout(() => {
        setModalOpen(false);
      }, 3500);

    }, 2000);
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#001b27]">Agendamiento y Citas</h2>
          <p className="text-base text-[#41484c] mt-2">Centraliza tu calendario y formaliza reuniones operativas y entregas. (Integrado con Google Calendar)</p>
        </div>
        <button onClick={handleOpenModal} className="bg-[#023143] text-white text-[13px] font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#001b27] transition-all shadow-md">
          <span className="material-symbols-outlined text-[18px]">event_available</span>Nueva Cita
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Side */}
        <div className="lg:col-span-9 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_20px_rgba(2,49,67,0.05)] overflow-hidden flex flex-col min-h-[600px] animate-fade-in">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#f9f9fb]">
            <div className="flex items-center gap-4">
              <h3 className="text-[20px] font-bold text-[#1a1c1d] capitalize">{new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
              <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-0.5">
                <button className="p-1 rounded hover:bg-[#e2e2e4] text-[#72787c] transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <button className="px-3 py-1 text-[12px] font-bold text-[#1a1c1d] hover:bg-[#e2e2e4] rounded transition-colors">Hoy</button>
                <button className="p-1 rounded hover:bg-[#e2e2e4] text-[#72787c] transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
              </div>
            </div>
            <div className="flex bg-white border border-[#E5E7EB] rounded-lg p-0.5">
              <button className="px-4 py-1.5 text-[12px] font-bold bg-[#f4f3f5] text-[#1a1c1d] rounded-md transition-all shadow-sm">Mes</button>
              <button className="px-4 py-1.5 text-[12px] font-bold text-[#72787c] hover:text-[#1a1c1d] rounded-md transition-all">Semana</button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-7 border-l border-[#E5E7EB]">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
              <div key={d} className="py-3 text-center border-r border-b border-[#E5E7EB] bg-[#f9f9fb]">
                <span className="text-[11px] font-bold text-[#72787c] uppercase tracking-wider">{d}</span>
              </div>
            ))}
            {calDays.map((cell, idx) => (
              <div key={idx} className={`min-h-[120px] border-b border-r border-[#E5E7EB] p-2 flex flex-col gap-1 ${cell.grey ? "bg-[#f4f3f5]/50" : "cursor-pointer hover:bg-[#f9f9fb] transition-colors"}`}>
                <span className={`text-sm pl-1 mb-1 ${cell.today ? "w-7 h-7 flex items-center justify-center bg-[#023143] text-white rounded-full font-bold shadow-sm" : cell.grey ? "text-[#72787c]" : "text-[#1a1c1d] font-bold"}`}>
                  {cell.day}
                </span>
                {cell.events.map((ev, i) => (
                  <div key={i} className={`${ev.bg} rounded px-2 py-1.5 flex items-center gap-1.5 shadow-sm border border-[#001e2b]/5`}>
                    {ev.icon
                      ? <span className={`material-symbols-outlined text-[14px] ${ev.text}`}>{ev.icon}</span>
                      : <span className={`w-1.5 h-1.5 rounded-full ${ev.dot}`} />
                    }
                    <span className={`text-[11px] font-bold truncate ${ev.text}`}>{ev.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_4px_20px_rgba(2,49,67,0.05)]">
            <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
              <h3 className="text-[18px] font-bold text-[#1a1c1d]">Simulaciones UX</h3>
              <span className="material-symbols-outlined text-[#72787c]">science</span>
            </div>

            <label className="flex items-start gap-3 p-3 bg-[#f9f9fb] rounded-lg border border-[#E5E7EB] cursor-pointer hover:bg-[#e5f5ff] transition-colors">
              <div className="pt-0.5">
                <input type="checkbox" className="w-4 h-4 accent-[#023143]" checked={simulateGoogleFail} onChange={e => setSimulateGoogleFail(e.target.checked)} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#001b27] leading-tight">Forzar Error API Google</p>
                <p className="text-[11px] text-[#41484c] mt-1 pr-2">Simula un Timeout o caída de red con la API de Google, forzando al portal a encolar la tarea como fallback (CU012 Flujo Alternativo).</p>
              </div>
            </label>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_4px_20px_rgba(2,49,67,0.05)]">
            <h3 className="text-[18px] font-bold text-[#1a1c1d] mb-4">Próximos Eventos</h3>
            {calDays.filter(d => !d.grey).flatMap(d => d.events).slice(0, 3).map(ev => (
              <div key={ev.id} className="mb-4 last:mb-0">
                <h4 className="text-[13px] font-bold text-[#001b27] truncate">{ev.label}</h4>
                <p className="text-[12px] text-[#41484c] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">schedule</span> {ev.time || "Sin hora"} - {ev.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={saveEvent} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative overflow-hidden">

            {!successMsg && !warningMsg && (
              <>
                <div className="px-6 py-5 border-b border-[#E5E7EB] bg-[#f9f9fb] flex justify-between items-center">
                  <h2 className="text-[20px] font-bold text-[#1a1c1d] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#023143]">edit_calendar</span> Agendar Cita
                  </h2>
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="text-[#72787c] hover:text-[#ba1a1a]">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex gap-2 text-[#ba1a1a]">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <p className="text-[12px] font-bold leading-tight">{errorMsg}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Cliente y Unidad *</label>
                    <select
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#023143]"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {CLIENTS_MOCK.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Tipo de Evento *</label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#023143]"
                    >
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Día Protocolar *</label>
                      <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Hora Inicio *</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Hora Fin *</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Lugar / Ubicación</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
                  </div>
                </div>

                <div className="px-6 py-4 flex justify-end gap-3 bg-[#f9f9fb] border-t border-[#E5E7EB]">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="px-5 py-2 text-[13px] font-bold text-[#41484c] hover:bg-[#e2e2e4] rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#023143] text-white rounded-lg text-[13px] font-bold hover:bg-[#001b27] transition-all flex items-center gap-2 shadow-sm">
                    {isSaving ? "Guardando..." : "Agendar y Sincronizar"}
                  </button>
                </div>
              </>
            )}

            {/* Status Covers */}
            {(successMsg || warningMsg) && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                {successMsg ? (
                  <span className="material-symbols-outlined text-[64px] text-[#27a85e] mb-4">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[64px] text-[#e65100] mb-4">sync_problem</span>
                )}
                <h3 className={`text-[18px] font-bold mb-2 ${successMsg ? "text-[#1c663b]" : "text-[#e65100]"}`}>
                  {successMsg ? "¡Agendado Exitosamente!" : "Aviso de Sincronización"}
                </h3>
                <p className="text-[14px] text-[#41484c]">{successMsg || warningMsg}</p>
              </div>
            )}
          </form>
        </div>
      )}

    </AdminLayout>
  );
}
