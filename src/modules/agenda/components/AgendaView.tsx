"use client";
import React, { useState, useEffect, useMemo } from "react";
import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";
import {
  fetchCitasCalendario,
  crearCita,
  cancelarCita,
  actualizarCita,
  seleccionarBloqueDisponibilidad,
  forzarSincronizacionManual,
  type CitaResponse,
} from "@/lib/api/agenda";

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

const EVENT_TYPES = [
  { value: "CONFIRMACION_FECHA_ENTREGA", label: "Confirmación de fecha de entrega" },
  { value: "ENTREGA_LLAVES",              label: "Entrega de llaves" },
  { value: "REVISION_OBSERVACIONES",      label: "Revisión de observaciones" },
  { value: "FIRMA_MINUTA",                label: "Firma de Minuta" },
  { value: "FIRMA_ESCRITURA",             label: "Firma de Escritura" },
  { value: "INSPECCION_OBRA",             label: "Inspección de obra" },
  { value: "JUNTA_PROPIETARIOS",          label: "Junta de propietarios" },
  { value: "OTRO",                        label: "Otro" }
];

function generateCalendarGrid(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday is 6 in 0-indexed Mon-Sun grid

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const grid: CalDay[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    grid.push({
      day: prevMonthTotalDays - i,
      grey: true,
      events: []
    });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  for (let day = 1; day <= totalDays; day++) {
    grid.push({
      day,
      today: isCurrentMonth && today.getDate() === day,
      events: []
    });
  }

  const remainingCells = (grid.length % 7 === 0) ? 0 : 7 - (grid.length % 7);
  for (let day = 1; day <= remainingCells; day++) {
    grid.push({
      day,
      grey: true,
      events: []
    });
  }

  return grid;
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calDays, setCalDays] = useState<CalDay[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<Usuario[]>([]);
  const [clientUnits, setClientUnits] = useState<{ id: string; name: string }[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Form State
  const [clientId, setClientId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0].value);
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

  // Detailed view & edit states
  const [rawCitas, setRawCitas] = useState<CitaResponse[]>([]);
  const [selectedCita, setSelectedCita] = useState<CitaResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Edit fields state
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editEstado, setEditEstado] = useState<"PROGRAMADA" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "REPROGRAMACION_PENDIENTE">("PROGRAMADA");
  const [editPermiteReprog, setEditPermiteReprog] = useState(false);

  const selectedClient = clients.find(c => String(c.id) === clientId);

  // Load clients
  useEffect(() => {
    fetchUsuarios()
      .then((users) => {
        setClients(users.filter(u => u.tipoUsuario === "CLIENTE"));
      })
      .catch(console.error);
  }, []);

  // Load client units when selected client changes
  useEffect(() => {
    if (!clientId) {
      setClientUnits([]);
      setSelectedUnitId("");
      return;
    }
    setClientUnits([]);
    setSelectedUnitId("");
    
    import("@/lib/api/users")
      .then(m => m.fetchExpedientesPorUsuario(Number(clientId)))
      .then(exps => {
        const uList = (exps || []).flatMap(exp => 
          (exp.activos || []).map(act => ({
            id: act.id,
            name: `${act.tipo === "ESTACIONAMIENTO" ? "Cochera" : act.tipo === "DEPOSITO" ? "Depósito" : "Dpto"} ${act.nro}`
          }))
        );
        setClientUnits(uList);
        if (uList.length > 0) {
          setSelectedUnitId(uList[0].id);
        }
      })
      .catch(console.error);
  }, [clientId]);

  // Generate grid cells base layout
  const gridCells = useMemo(() => {
    return generateCalendarGrid(currentDate);
  }, [currentDate]);

  // Fetch appointments for current grid
  const fetchAppointments = React.useCallback(() => {
    if (gridCells.length === 0) return;
    
    const firstCell = gridCells[0];
    const lastCell = gridCells[gridCells.length - 1];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startYear = year;
    let startMonth = month;
    if (firstCell.grey && firstCell.day > 15) {
      startMonth = month - 1;
      if (startMonth < 0) {
        startMonth = 11;
        startYear = year - 1;
      }
    }
    const startDateStr = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-${String(firstCell.day).padStart(2, "0")}T00:00:00`;

    let endYear = year;
    let endMonth = month;
    if (lastCell.grey && lastCell.day < 15) {
      endMonth = month + 1;
      if (endMonth > 11) {
        endMonth = 0;
        endYear = year + 1;
      }
    }
    const endDateStr = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-${String(lastCell.day).padStart(2, "0")}T23:59:59`;

    setLoadingEvents(true);
    
    fetchCitasCalendario(startDateStr, endDateStr)
      .then(citas => {
        setRawCitas(citas);
        const updatedGrid = gridCells.map(cell => {
          let cellYear = year;
          let cellMonth = month;
          if (cell.grey) {
            if (cell.day > 15) {
              cellMonth = month - 1;
              if (cellMonth < 0) { cellMonth = 11; cellYear = year - 1; }
            } else {
              cellMonth = month + 1;
              if (cellMonth > 11) { cellMonth = 0; cellYear = year + 1; }
            }
          }
          const cellDateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;

          const dayEvents = citas
            .filter(c => c.fechaInicio.startsWith(cellDateStr))
            .map(c => {
              const startL = c.fechaInicio.split("T")[1]?.slice(0, 5) || "";
              
              let bg = "bg-[#c2e8ff] text-[#001e2b]";
              let dot = "bg-[#001e2b]";
              if (c.estadoCita === "CANCELADA") {
                bg = "bg-[#ffdad6] text-[#ba1a1a]";
                dot = "bg-[#ba1a1a]";
              } else if (c.estadoCita === "CONFIRMADA") {
                bg = "bg-[#e8f5e9] text-[#2e7d32]";
                dot = "bg-[#2e7d32]";
              } else if (c.estadoCita === "COMPLETADA") {
                bg = "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/60";
                dot = "bg-slate-500";
              } else if (c.estadoCita === "REPROGRAMACION_PENDIENTE") {
                bg = "bg-[#ffe0b2] text-[#e65100]";
                dot = "bg-[#e65100]";
              }

              return {
                id: c.id,
                label: `${c.titulo || c.tipoEvento}`,
                bg,
                dot,
                text: bg.split(" ")[1] || "",
                time: startL,
                client: c.clienteNombre || "Cliente",
                type: c.tipoEvento,
                unit: ""
              };
            });

          return {
            ...cell,
            events: dayEvents
          };
        });
        
        setCalDays(updatedGrid);
      })
      .catch(err => {
        console.error("Error fetching calendar appointments:", err);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, [gridCells, currentDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Next/prev month handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  function resetForm() {
    setClientId("");
    setSelectedUnitId("");
    setEventType(EVENT_TYPES[0].value);
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

  function handleCellClick(cell: CalDay) {
    if (cell.grey) return;
    handleOpenModal();
    const cellYear = currentDate.getFullYear();
    const cellMonth = currentDate.getMonth();
    const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    setEventDate(dateStr);
  }

  const handleEventClick = (id: string) => {
    const cita = rawCitas.find(c => c.id === id);
    if (cita) {
      setSelectedCita(cita);
      setModalError("");
      setShowCancelForm(false);
      setMotivoCancelacion("");
      setDetailModalOpen(true);
    }
  };

  const handleStartEdit = () => {
    if (!selectedCita) return;
    setEditTitle(selectedCita.titulo);
    setEditDesc(selectedCita.descripcion);
    setEditLocation(selectedCita.ubicacion);
    
    const startStr = selectedCita.fechaInicio;
    const endStr = selectedCita.fechaFin;
    
    const [startDatePart, startTimePart] = startStr.split("T");
    const [, endTimePart] = endStr.split("T");
    
    setEditDate(startDatePart || "");
    setEditStartTime(startTimePart?.slice(0, 5) || "");
    setEditEndTime(endTimePart?.slice(0, 5) || "");
    setEditEstado(selectedCita.estadoCita);
    setEditPermiteReprog(selectedCita.permiteReprogramacion);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCita) return;
    if (!editTitle.trim() || !editDate || !editStartTime || !editEndTime) {
      setModalError("Por favor completa los campos requeridos.");
      return;
    }
    
    setIsSaving(true);
    setModalError("");
    const startStr = `${editDate}T${editStartTime}:00`;
    const endStr = `${editDate}T${editEndTime}:00`;
    
    actualizarCita(selectedCita.id, {
      titulo: editTitle,
      descripcion: editDesc,
      ubicacion: editLocation,
      fechaInicio: startStr,
      fechaFin: endStr,
      estadoCita: editEstado,
      permiteReprogramacion: editPermiteReprog
    })
      .then((updated) => {
        setIsSaving(false);
        setIsEditing(false);
        setDetailModalOpen(false);
        fetchAppointments();
      })
      .catch(err => {
        setIsSaving(false);
        setModalError(err instanceof Error ? err.message : "Error al actualizar la cita.");
      });
  };

  const handleConfirmCancel = () => {
    if (!selectedCita || !motivoCancelacion.trim()) return;
    setIsSaving(true);
    setModalError("");
    
    cancelarCita(selectedCita.id, motivoCancelacion)
      .then(() => {
        setIsSaving(false);
        setShowCancelForm(false);
        setDetailModalOpen(false);
        fetchAppointments();
      })
      .catch(err => {
        setIsSaving(false);
        setModalError(err instanceof Error ? err.message : "Error al cancelar la cita.");
      });
  };

  const handleConfirmBlock = (bloqueId: number) => {
    if (!selectedCita) return;
    setIsSaving(true);
    setModalError("");
    
    seleccionarBloqueDisponibilidad(selectedCita.id, bloqueId)
      .then(() => {
        setIsSaving(false);
        setDetailModalOpen(false);
        fetchAppointments();
      })
      .catch(err => {
        setIsSaving(false);
        setModalError(err instanceof Error ? err.message : "Error al confirmar la fecha propuesta.");
      });
  };

  const handleSyncManual = () => {
    setIsSyncing(true);
    forzarSincronizacionManual()
      .then((res) => {
        setIsSyncing(false);
        alert(res.mensaje || "Sincronización forzada correctamente.");
        fetchAppointments();
      })
      .catch(err => {
        setIsSyncing(false);
        alert(err instanceof Error ? err.message : "Error al sincronizar.");
      });
  };

  function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setWarningMsg("");

    if (!clientId || !selectedUnitId || !eventDate || !startTime || !endTime) {
      setErrorMsg("Por favor completa todos los campos requeridos.");
      return;
    }

    const selectedDateTime = new Date(`${eventDate}T${startTime}`);
    if (selectedDateTime < new Date()) {
      setErrorMsg("Error: No puedes agendar citas en fechas/horas pasadas.");
      return;
    }

    setIsSaving(true);
    const startDateTimeStr = `${eventDate}T${startTime}:00`;
    const endDateTimeStr = `${eventDate}T${endTime}:00`;

    const eventLabel = EVENT_TYPES.find(e => e.value === eventType)?.label || eventType;
    crearCita({
      clienteId: Number(clientId),
      activoId: selectedUnitId,
      tipoEvento: eventType,
      titulo: `${eventLabel} - ${selectedClient?.nombre || ""} ${selectedClient?.apellidos || ""}`,
      descripcion: `Cita sobre unidad inmobiliaria`,
      ubicacion: location,
      fechaInicio: startDateTimeStr,
      fechaFin: endDateTimeStr,
      permiteReprogramacion: true,
      clienteUsaGoogle: !simulateGoogleFail,
      
      // Positional fallbacks
      arg0: Number(clientId),
      arg1: selectedUnitId,
      arg2: eventType,
      arg3: `${eventLabel} - ${selectedClient?.nombre || ""} ${selectedClient?.apellidos || ""}`,
      arg4: `Cita sobre unidad inmobiliaria`,
      arg5: location,
      arg6: startDateTimeStr,
      arg7: endDateTimeStr,
      arg8: true,
      arg9: !simulateGoogleFail
    })
      .then(() => {
        setIsSaving(false);
        if (simulateGoogleFail) {
          setWarningMsg("Cita guardada en el portal. La sincronización con Google Calendar experimentó un retraso y se reintentará en breve.");
        } else {
          setSuccessMsg("Cita agendada y notificada exitosamente al correo/calendario del cliente.");
        }
        setTimeout(() => {
          setModalOpen(false);
          fetchAppointments();
        }, 3000);
      })
      .catch(err => {
        setIsSaving(false);
        setErrorMsg(err instanceof Error ? err.message : "Error al guardar la cita.");
      });
  }

  // Get next 3 upcoming events
  const upcomingEvents = useMemo(() => {
    return calDays
      .filter(d => !d.grey)
      .flatMap(d => d.events)
      .slice(0, 3);
  }, [calDays]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">Agenda y Citas</h2>
          <p className="text-base text-slate-600 dark:text-white/70 mt-2">Programa reuniones, firmas, entregas y eventos importantes con clientes.</p>
        </div>
        <button onClick={handleOpenModal} className="bg-build-main text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-build-main/90 transition-all shadow-sm">
          <span className="material-symbols-outlined text-[18px]">event_available</span>Nueva cita
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Side */}
        <div className="lg:col-span-9 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-white/5">
            <div className="flex items-center gap-4">
              <h3 className="text-[20px] font-bold text-build-main dark:text-white capitalize">
                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button onClick={handleGoToday} className="px-3 py-1 text-[12px] font-bold text-build-main dark:text-white hover:bg-slate-50 dark:bg-white/5 rounded transition-colors">Hoy</button>
                <button onClick={handleNextMonth} className="p-1 rounded hover:bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
            {loadingEvents && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <svg className="animate-spin h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Actualizando...
              </span>
            )}
          </div>

          <div className="flex-1 grid grid-cols-7 border-l border-slate-200 dark:border-white/10">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
              <div key={d} className="py-3 text-center border-r border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">{d}</span>
              </div>
            ))}
            {calDays.map((cell, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCellClick(cell)}
                className={`min-h-[120px] border-b border-r border-slate-200 dark:border-white/10 p-2 flex flex-col gap-1 ${cell.grey ? "bg-slate-50 dark:bg-white/5/50" : "cursor-pointer hover:bg-slate-50 dark:bg-white/5 transition-colors"}`}
              >
                <span className={`text-sm pl-1 mb-1 ${cell.today ? "w-7 h-7 flex items-center justify-center bg-build-main text-white rounded-full font-bold shadow-sm" : cell.grey ? "text-slate-400 dark:text-white/50" : "text-build-main dark:text-white font-bold"}`}>
                  {cell.day}
                </span>
                {cell.events.map((ev, i) => (
                  <div 
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(ev.id);
                    }}
                    className={`${ev.bg} rounded px-2 py-1.5 flex flex-col gap-0.5 shadow-sm border border-build-main/5 hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ev.dot}`} />
                      <span className="text-[11px] font-bold truncate">{ev.label}</span>
                    </div>
                    {ev.time && <span className="text-[9px] font-semibold opacity-75 pl-3">{ev.time}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
              <h3 className="text-[18px] font-bold text-build-main dark:text-white">Google Calendar Sinc</h3>
              <span className="material-symbols-outlined text-slate-500 dark:text-white/60">science</span>
            </div>

            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-100 dark:bg-white/10 transition-colors">
              <div className="pt-0.5">
                <input type="checkbox" className="w-4 h-4 accent-build-accent" checked={simulateGoogleFail} onChange={e => setSimulateGoogleFail(e.target.checked)} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-build-main dark:text-white leading-tight">Simular fallo de Google Calendar</p>
                <p className="text-[11px] text-slate-500 dark:text-white/60 mt-1 pr-2">Si ocurre un fallo, la cita se guardará solo localmente y se notificará el reintento.</p>
              </div>
            </label>

            <button
              onClick={handleSyncManual}
              disabled={isSyncing}
              className="w-full mt-4 bg-build-main hover:bg-build-main/90 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              {isSyncing ? "Sincronizando..." : "Forzar Sincronización Manual"}
            </button>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[18px] font-bold text-build-main dark:text-white mb-4">Próximos Eventos</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-white/40">No hay eventos próximos en este período.</p>
            ) : (
              upcomingEvents.map(ev => (
                <div key={ev.id} className="mb-4 last:mb-0 pb-3 border-b border-slate-100 last:border-b-0 dark:border-white/5">
                  <h4 className="text-[13px] font-bold text-build-main dark:text-white truncate">{ev.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-white/60 mt-0.5">Cliente: {ev.client}</p>
                  <p className="text-[12px] text-slate-500 dark:text-white/60 flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> {ev.time || "Sin hora"} - {ev.type}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={saveEvent} className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative overflow-hidden">

            {!successMsg && !warningMsg && (
              <>
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] flex justify-between items-center">
                  <h2 className="text-[20px] font-bold text-build-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-build-accent">edit_calendar</span> Agendar cita
                  </h2>
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="text-slate-400 dark:text-white/50 hover:text-[#ba1a1a]">
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
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Cliente *</label>
                    <select
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre} {c.apellidos}</option>)}
                    </select>
                  </div>

                  {clientId && (
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Unidad vinculada *</label>
                      <select
                        value={selectedUnitId}
                        onChange={e => setSelectedUnitId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                      >
                        <option value="">-- Seleccionar Unidad --</option>
                        {clientUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Tipo de Evento *</label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    >
                      {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Día Protocolar *</label>
                      <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Inicio *</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Fin *</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Lugar / Ubicación</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
                  </div>
                </div>

                <div className="px-6 py-4 flex justify-end gap-3 bg-white dark:bg-[#111] border-t border-slate-200 dark:border-white/10">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 hover:text-build-main dark:text-white transition-colors rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-sm">
                    {isSaving ? "Guardando..." : "Guardar y sincronizar calendario"}
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
                  {successMsg ? "Cita agendada" : "Aviso de sincronización"}
                </h3>
                <p className="text-[14px] text-[#41484c] dark:text-white/70">{successMsg || warningMsg}</p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Cita Detail & Edit Modal */}
      {detailModalOpen && selectedCita && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] flex justify-between items-center">
              <h2 className="text-[20px] font-bold text-build-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-build-accent">info</span> 
                {isEditing ? "Editar Cita" : "Detalle de la Cita"}
              </h2>
              <button 
                type="button" 
                onClick={() => { setDetailModalOpen(false); setIsEditing(false); }} 
                className="text-slate-400 dark:text-white/50 hover:text-[#ba1a1a]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              {modalError && (
                <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex gap-2 text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <p className="text-[12px] font-bold leading-tight">{modalError}</p>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Título</label>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Descripción</label>
                    <textarea 
                      value={editDesc} 
                      onChange={e => setEditDesc(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent h-20 resize-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Ubicación</label>
                    <input 
                      type="text" 
                      value={editLocation} 
                      onChange={e => setEditLocation(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Fecha</label>
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Inicio</label>
                      <input 
                        type="time" 
                        value={editStartTime} 
                        onChange={e => setEditStartTime(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Fin</label>
                      <input 
                        type="time" 
                        value={editEndTime} 
                        onChange={e => setEditEndTime(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Estado Cita</label>
                      <select 
                        value={editEstado} 
                        onChange={e => setEditEstado(e.target.value as any)} 
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-build-accent"
                      >
                        <option value="PROGRAMADA">PROGRAMADA</option>
                        <option value="CONFIRMADA">CONFIRMADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                        <option value="COMPLETADA">COMPLETADA</option>
                        <option value="REPROGRAMACION_PENDIENTE">REPROGRAMACION_PENDIENTE</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editPermiteReprog} 
                          onChange={e => setEditPermiteReprog(e.target.checked)} 
                          className="w-4 h-4 accent-build-accent" 
                        />
                        <span className="text-[12px] font-semibold text-slate-600 dark:text-white/70">Permite Reprogramación</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-bold text-build-main dark:text-white">{selectedCita.titulo}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedCita.estadoCita === "CONFIRMADA" ? "bg-green-100 text-green-800" :
                        selectedCita.estadoCita === "CANCELADA" ? "bg-red-100 text-red-800" :
                        selectedCita.estadoCita === "COMPLETADA" ? "bg-slate-200 text-slate-800" :
                        selectedCita.estadoCita === "REPROGRAMACION_PENDIENTE" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {selectedCita.estadoCita}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-white/60">{selectedCita.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Cliente:</span>
                      <span className="text-build-main dark:text-white font-bold">{selectedCita.clienteNombre}</span>
                      <span className="block text-[10px] text-slate-400">{selectedCita.clienteEmail}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Unidad Inmobiliaria:</span>
                      <span className="text-build-main dark:text-white font-bold">Dpto/Cochera {selectedCita.activoNro}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Fecha y Hora:</span>
                      <span className="text-build-main dark:text-white font-bold">
                        {new Date(selectedCita.fechaInicio).toLocaleDateString("es-PE")}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {new Date(selectedCita.fechaInicio).toLocaleTimeString("es-PE", {hour: "2-digit", minute: "2-digit"})} - {new Date(selectedCita.fechaFin).toLocaleTimeString("es-PE", {hour: "2-digit", minute: "2-digit"})}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Ubicación / Link:</span>
                      <span className="text-build-main dark:text-white font-bold truncate block">{selectedCita.ubicacion || "Sin ubicación"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Google Calendar Sync:</span>
                      <span className="text-build-main dark:text-white font-bold">{selectedCita.estadoSincronizacion}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">Confirmación del Cliente:</span>
                      <span className="text-build-main dark:text-white font-bold">
                        {selectedCita.confirmacionCliente === true ? "Confirmado ✓" : selectedCita.confirmacionCliente === false ? "Declinado ✕" : "Sin respuesta"}
                      </span>
                    </div>
                  </div>

                  {selectedCita.estadoCita === "REPROGRAMACION_PENDIENTE" && selectedCita.disponibilidades && selectedCita.disponibilidades.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="block text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-2">Bloques propuestos por el cliente</span>
                      <div className="space-y-2">
                        {selectedCita.disponibilidades.map(disp => (
                          <div key={disp.id} className="flex items-center justify-between p-2.5 rounded-lg border border-orange-100 dark:border-orange-950/20 bg-orange-50/50 dark:bg-orange-950/10">
                            <div className="text-xs">
                              <span className="font-bold text-build-main dark:text-white">{new Date(disp.bloqueInicio).toLocaleDateString("es-PE")}</span>
                              <span className="block text-[10px] text-slate-500">
                                {new Date(disp.bloqueInicio).toLocaleTimeString("es-PE", {hour: "2-digit", minute: "2-digit"})} - {new Date(disp.bloqueFin).toLocaleTimeString("es-PE", {hour: "2-digit", minute: "2-digit"})}
                              </span>
                            </div>
                            <button
                              onClick={() => handleConfirmBlock(disp.id)}
                              disabled={isSaving}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showCancelForm && (
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                      <label className="block text-[11px] font-bold text-red-500 uppercase">Motivo de cancelación *</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ej. Cambio de horario solicitado" 
                          value={motivoCancelacion}
                          onChange={e => setMotivoCancelacion(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-red-200 rounded-xl text-xs bg-white dark:bg-white/5 focus:outline-none"
                        />
                        <button
                          onClick={handleConfirmCancel}
                          disabled={isSaving || !motivoCancelacion.trim()}
                          className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-red-600 disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-between bg-white dark:bg-[#111] border-t border-slate-200 dark:border-white/10 shrink-0">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="px-5 py-2 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 rounded-xl"
                  >
                    Volver
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveEdit} 
                    disabled={isSaving}
                    className="px-6 py-2 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    {selectedCita.estadoCita !== "CANCELADA" && selectedCita.estadoCita !== "COMPLETADA" && (
                      <button 
                        type="button" 
                        onClick={() => setShowCancelForm(v => !v)} 
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all"
                      >
                        Cancelar Cita
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedCita.estadoCita !== "CANCELADA" && selectedCita.estadoCita !== "COMPLETADA" && (
                      <button 
                        type="button" 
                        onClick={handleStartEdit} 
                        className="px-4 py-2 bg-build-main text-white hover:bg-build-main/90 rounded-xl text-xs font-bold transition-all"
                      >
                        Editar
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setDetailModalOpen(false)} 
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
