"use client";
import React, { useState, useEffect, useMemo } from "react";
import { fetchUsuarios } from "@/lib/api/users";
import type { Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { ActivoResponseDTO } from "@/lib/api/proyectos";
import {
  fetchCitasCalendario,
  crearCita,
  cancelarCita,
  actualizarCita,
  seleccionarBloqueDisponibilidad,
  forzarSincronizacionManual,
  getGoogleAuthUrl,
  disconnectGoogleCalendar,
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
  rsvpDot?: string;
  rsvpText?: string;
  syncDot?: string;
  syncIcon?: string;
  syncText?: string;
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

function getStartAndEndDateStr(gridCells: CalDay[], currentDate: Date) {
  const firstCell = gridCells[0];
  const lastCell = gridCells.at(-1);
  if (!firstCell || !lastCell) {
    return { startDateStr: "", endDateStr: "" };
  }
  
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
  
  return { startDateStr, endDateStr };
}

function mapCitaToEvent(c: CitaResponse): CalEvent {
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

  let rsvpDot = "bg-slate-400 dark:bg-slate-500";
  let rsvpText = "Pendiente";
  if (c.confirmacionCliente === true) {
    rsvpDot = "bg-emerald-500 dark:bg-emerald-400";
    rsvpText = "Confirmado";
  } else if (c.confirmacionCliente === false) {
    rsvpDot = "bg-rose-500 dark:bg-rose-400";
    rsvpText = "Declinado";
  }

  let syncDot = "";
  let syncIcon = "";
  let syncText = "";
  if (c.clienteUsaGoogle) {
    if (c.estadoSincronizacion === "SINCRONIZADO") {
      syncDot = "bg-emerald-500";
      syncIcon = "check_circle";
      syncText = "Sincronizado con Google Calendar";
    } else if (c.estadoSincronizacion === "PENDIENTE" || c.estadoSincronizacion === "FALLIDO") {
      syncDot = "bg-amber-500";
      syncIcon = "sync_problem";
      syncText = c.estadoSincronizacion === "FALLIDO" ? "Error de sincronización" : "Pendiente de sincronizar";
    }
  }

  return {
    id: c.id,
    label: `${c.titulo || c.tipoEvento}`,
    bg,
    dot,
    rsvpDot,
    rsvpText,
    syncDot,
    syncIcon,
    syncText,
    text: bg.split(" ")[1] || "",
    time: startL,
    client: c.clienteNombre || "Cliente",
    type: c.tipoEvento,
    unit: ""
  };
}

function mapCitasToGrid(citas: CitaResponse[], gridCells: CalDay[], currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  return gridCells.map(cell => {
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
      .map(mapCitaToEvent);

    return {
      ...cell,
      events: dayEvents
    };
  });
}

function getStatusBadgeClass(s: string) {
  if (s === "CONFIRMADA") return "bg-green-100 text-green-800";
  if (s === "CANCELADA") return "bg-red-100 text-red-800";
  if (s === "COMPLETADA") return "bg-slate-200 text-slate-800";
  if (s === "REPROGRAMACION_PENDIENTE") return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800";
}

function getTipoLabel(tipo: string): string {
  if (tipo === "ESTACIONAMIENTO") return "Cochera";
  if (tipo === "DEPOSITO") return "Depósito";
  return "Dpto";
}

function mapExpedienteActivoToUnit(act: ActivoResponseDTO) {
  return {
    id: act.id,
    name: `${getTipoLabel(act.tipo)} ${act.nro}`
  };
}

function mapExpedientesToUnits(exps: UsuarioActivoResponseDTO[] | null | undefined): { id: string; name: string }[] {
  return (exps || []).flatMap((exp) =>
    (exp.activos || []).map(mapExpedienteActivoToUnit)
  );
}

function getCellBgClass(grey?: boolean): string {
  return grey
    ? "bg-slate-50 dark:bg-white/5/50"
    : "cursor-pointer hover:bg-slate-50 dark:bg-white/5 transition-colors";
}

function getSyncIconAnimClass(isSyncing: boolean): string {
  return isSyncing ? "animate-spin" : "";
}

function getSyncButtonText(isSyncing: boolean): string {
  return isSyncing ? "Sincronizando..." : "Sincronizar Google Calendar";
}

function getSaveButtonText(isSaving: boolean, isEdit: boolean): string {
  if (isSaving) return "Guardando...";
  return isEdit ? "Guardar Cambios" : "Guardar y sincronizar calendario";
}

function getBannerTitle(success: boolean): string {
  return success ? "Cita agendada" : "Aviso de sincronización";
}

function getBannerColor(success: boolean): string {
  return success ? "text-[#1c663b]" : "text-[#e65100]";
}

function getModalTitle(isEditing: boolean): string {
  return isEditing ? "Editar Cita" : "Detalle de la Cita";
}

function getSyncIconColor(syncDot?: string): string {
  return syncDot === "bg-emerald-500" ? "text-emerald-500" : "text-amber-500";
}

function getCellDayClass(today?: boolean, grey?: boolean): string {
  if (today) return "w-7 h-7 flex items-center justify-center bg-build-main text-white rounded-full font-bold shadow-sm";
  if (grey) return "text-slate-400 dark:text-white/50";
  return "text-build-main dark:text-white font-bold";
}

function getConnectionDisplay(isConnecting: boolean, justConnected: boolean, field: "icon" | "text"): string {
  if (isConnecting) return field === "icon" ? "more_horiz" : "Conectando...";
  if (justConnected) return field === "icon" ? "check_circle" : "¡Conectado!";
  return field === "icon" ? "calendar_month" : "Conectar Google Calendar";
}

function getConnectionBorderClass(justConnected: boolean): string {
  return justConnected
    ? "border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
    : "border border-arch-gold/30 bg-arch-gold/5 hover:bg-arch-gold/10 text-arch-gold";
}

function getConfirmationText(confirmacion: boolean | null): string {
  if (confirmacion === true) return "Confirmado ✓";
  if (confirmacion === false) return "Declinado ✕";
  return "Sin respuesta";
}



function validateAppointmentForm(clientId: string | null, selectedUnitId: string, eventDate: string, startTime: string, endTime: string): string | null {
  if (!clientId || !selectedUnitId || !eventDate || !startTime || !endTime) {
    return "Por favor completa todos los campos requeridos.";
  }
  const selectedDateTime = new Date(`${eventDate}T${startTime}`);
  if (selectedDateTime < new Date()) {
    return "Error: No puedes agendar citas en fechas/horas pasadas.";
  }
  return null;
}

function useGoogleCalendar(fetchAppointments: () => void) {
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const { url } = await getGoogleAuthUrl();
      const popup = window.open(url, "google-oauth", "width=600,height=700");
      if (!popup) {
        alert("El navegador bloqueó la ventana emergente. Permite popups e intenta de nuevo.");
        setIsConnectingGoogle(false);
        return;
      }
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setIsConnectingGoogle(false);
          setJustConnected(true);
          setTimeout(() => setJustConnected(false), 6000);
        }
      }, 500);
    } catch (err) {
      setIsConnectingGoogle(false);
      alert(err instanceof Error ? err.message : "Error al conectar Google Calendar.");
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm("¿Desconectar Google Calendar?")) return;
    try {
      await disconnectGoogleCalendar();
      alert("Google Calendar desconectado.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al desconectar.");
    }
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

  return { isConnectingGoogle, justConnected, isSyncing, handleConnectGoogle, handleDisconnectGoogle, handleSyncManual };
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
    Promise.resolve().then(() => {
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
          const uList = mapExpedientesToUnits(exps);
          setClientUnits(uList);
          if (uList.length > 0) {
            setSelectedUnitId(uList[0].id);
          }
        })
        .catch(console.error);
    });
  }, [clientId]);

  // Generate grid cells base layout
  const gridCells = useMemo(() => {
    return generateCalendarGrid(currentDate);
  }, [currentDate]);

  // Fetch appointments for current grid
  const fetchAppointments = React.useCallback(() => {
    if (gridCells.length === 0) return;
    
    const { startDateStr, endDateStr } = getStartAndEndDateStr(gridCells, currentDate);
    setLoadingEvents(true);
    
    fetchCitasCalendario(startDateStr, endDateStr)
      .then(citas => {
        setRawCitas(citas);
        const updatedGrid = mapCitasToGrid(citas, gridCells, currentDate);
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
    Promise.resolve().then(() => {
      fetchAppointments();
    });
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
      .then(() => {
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

  const { isConnectingGoogle, justConnected, isSyncing, handleConnectGoogle, handleDisconnectGoogle, handleSyncManual } = useGoogleCalendar(fetchAppointments);

  function saveEvent(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setWarningMsg("");

    const validationError = validateAppointmentForm(clientId, selectedUnitId, eventDate, startTime, endTime);
    if (validationError) {
      setErrorMsg(validationError);
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
      clienteUsaGoogle: true,
    })
      .then(() => {
        setIsSaving(false);
        setSuccessMsg("Cita agendada y notificada exitosamente al correo/calendario del cliente.");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">Agenda y Citas</h2>
          <p className="text-base text-slate-600 dark:text-white/70 mt-2">Programa reuniones, firmas, entregas y eventos importantes con clientes.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 self-end md:self-auto">
          {/* Google Connect */}
          <button
            onClick={handleConnectGoogle}
            disabled={isConnectingGoogle}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 ${getConnectionBorderClass(justConnected)}`}
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">
              {getConnectionDisplay(isConnectingGoogle, justConnected, "icon")}
            </span>
            <span className="truncate">{getConnectionDisplay(isConnectingGoogle, justConnected, "text")}</span>
          </button>

          {/* Disconnect */}
          <button
            onClick={handleDisconnectGoogle}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-2 py-2.5 text-xs font-semibold shadow-sm transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">link_off</span>
            <span className="truncate">Desconectar</span>
          </button>

          {/* Sync */}
          <button
            onClick={handleSyncManual}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold shadow-sm transition-all text-build-main hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <span className={`material-symbols-outlined text-[16px] shrink-0 ${getSyncIconAnimClass(isSyncing)}`}>
              sync
            </span>
            <span className="truncate">{getSyncButtonText(isSyncing)}</span>
          </button>

          {/* New Appointment */}
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-build-main px-2 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-build-main/90"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">event_available</span>
            <span className="truncate">Nueva cita</span>
          </button>
        </div>
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
              <button 
                type="button"
                key={`${cell.grey ? 'g' : 'm'}-${cell.day}-${idx}`} 
                onClick={() => handleCellClick(cell)}
                className={`min-h-[120px] border-b border-r border-slate-200 dark:border-white/10 p-2 flex flex-col gap-1 ${getCellBgClass(cell.grey)}`}
              >
                <span className={`text-sm pl-1 mb-1 ${getCellDayClass(cell.today, cell.grey)}`}>
                  {cell.day}
                </span>
                {cell.events.map((ev) => (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(ev.id);
                    }}
                    className={`w-full text-left ${ev.bg} rounded px-2 py-1.5 flex flex-col gap-0.5 shadow-sm border border-build-main/5 hover:scale-[1.02] transition-transform cursor-pointer`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ev.rsvpDot}`} title={`Confirmación: ${ev.rsvpText}`} />
                      <span className="text-[11px] font-bold truncate">{ev.label}</span>
                      {ev.syncIcon && (
                        <span className={`material-symbols-outlined text-[12px] ml-auto shrink-0 ${getSyncIconColor(ev.syncDot)}`} title={ev.syncText}>
                          {ev.syncIcon}
                        </span>
                      )}
                    </div>
                    {ev.time && <span className="text-[9px] font-semibold opacity-75 pl-3">{ev.time}</span>}
                  </button>
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[18px] font-bold text-build-main dark:text-white mb-4">Próximos Eventos</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-white/40">No hay eventos próximos en este período.</p>
            ) : (
              upcomingEvents.map(ev => (
                <button 
                  type="button"
                  key={ev.id} 
                  onClick={() => handleEventClick(ev.id)}
                  className="mb-4 last:mb-0 pb-3 border-b border-slate-100 last:border-b-0 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13px] font-bold text-build-main dark:text-white truncate hover:underline">{ev.label}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ev.syncIcon && (
                          <span className={`material-symbols-outlined text-[14px] ${getSyncIconColor(ev.syncDot)}`} title={ev.syncText}>
                            {ev.syncIcon}
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full shrink-0 ${ev.rsvpDot}`} title={`Confirmación: ${ev.rsvpText}`} />
                      </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-white/60 mt-0.5">Cliente: {ev.client}</p>
                  <p className="text-[12px] text-slate-500 dark:text-white/60 flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> {ev.time || "Sin hora"} - {ev.type}
                  </p>
                </button>
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
                    <span className="material-symbols-outlined text-arch-gold">edit_calendar</span> Agendar cita
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
                    <label htmlFor="agenda-client-select" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Cliente *</label>
                    <select
                      id="agenda-client-select"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre} {c.apellidos}</option>)}
                    </select>
                  </div>

                  {clientId && (
                    <div className="mb-4">
                      <label htmlFor="agenda-unit-select" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Unidad vinculada *</label>
                      <select
                        id="agenda-unit-select"
                        value={selectedUnitId}
                        onChange={e => setSelectedUnitId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
                      >
                        <option value="">-- Seleccionar Unidad --</option>
                        {clientUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="agenda-event-type" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Tipo de Evento *</label>
                    <select
                      id="agenda-event-type"
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
                    >
                      {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label htmlFor="agenda-event-date" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Día Protocolar *</label>
                      <input id="agenda-event-date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
                    </div>
                    <div>
                      <label htmlFor="agenda-start-time" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Inicio *</label>
                      <input id="agenda-start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
                    </div>
                    <div>
                      <label htmlFor="agenda-end-time" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Fin *</label>
                      <input id="agenda-end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="agenda-location" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Lugar / Ubicación</label>
                    <input id="agenda-location" type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
                  </div>
                </div>

                <div className="px-6 py-4 flex justify-end gap-3 bg-white dark:bg-[#111] border-t border-slate-200 dark:border-white/10">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 hover:text-build-main dark:text-white transition-colors rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-sm">
                    {getSaveButtonText(isSaving, false)}
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
                <h3 className={`text-[18px] font-bold mb-2 ${getBannerColor(!!successMsg)}`}>
                  {getBannerTitle(!!successMsg)}
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
                <span className="material-symbols-outlined text-arch-gold">info</span> 
                {getModalTitle(isEditing)}
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
                    <label htmlFor="edit-title" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Título</label>
                    <input 
                      id="edit-title"
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-description" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Descripción</label>
                    <textarea 
                      id="edit-description" 
                      value={editDesc} 
                      onChange={e => setEditDesc(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 h-20 resize-none" 
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-location" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Ubicación</label>
                    <input 
                      id="edit-location"
                      type="text" 
                      value={editLocation} 
                      onChange={e => setEditLocation(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="edit-date" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Fecha</label>
                      <input 
                        id="edit-date"
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" 
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-start-time" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Inicio</label>
                      <input 
                        id="edit-start-time"
                        type="time" 
                        value={editStartTime} 
                        onChange={e => setEditStartTime(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" 
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-end-time" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Hora Fin</label>
                      <input 
                        id="edit-end-time"
                        type="time" 
                        value={editEndTime} 
                        onChange={e => setEditEndTime(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-estado" className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase mb-1">Estado Cita</label>
                      <select 
                        id="edit-estado"
                        value={editEstado} 
                        onChange={e => setEditEstado(e.target.value as "PROGRAMADA" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "REPROGRAMACION_PENDIENTE")} 
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-build-main dark:text-white focus:outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
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
                          className="w-4 h-4 accent-arch-gold" 
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(selectedCita.estadoCita)}`}>
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
                        {getConfirmationText(selectedCita.confirmacionCliente)}
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
                      <label htmlFor="cancel-reason" className="block text-[11px] font-bold text-red-500 uppercase">Motivo de cancelación *</label>
                      <div className="flex gap-2">
                        <input 
                          id="cancel-reason"
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
                    {getSaveButtonText(isSaving, true)}
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