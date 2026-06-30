"use client";
import React, { useState, useEffect, useMemo } from "react";
import { fetchUsuarios, fetchExpedientesPorUsuario } from "@/lib/api/users";
import type { Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import {
  fetchCitasCalendario,
  crearCita,
  cancelarCita,
  actualizarCita,
  seleccionarBloqueDisponibilidad,
  type CitaResponse,
} from "@/lib/api/agenda";

// ─── Types ────────────────────────────────────────────────────────────────────

type CalEvent = {
  id: string;
  label: string;
  bg: string;
  dot: string;
  rsvpDot: string;
  rsvpText: string;
  time?: string;
  client?: string;
  type?: string;
  estadoCita: string;
};

type CalDay = {
  day: number;
  grey?: boolean;
  today?: boolean;
  events: CalEvent[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "CONFIRMACION_FECHA_ENTREGA", label: "Confirmación de fecha de entrega" },
  { value: "ENTREGA_LLAVES",             label: "Entrega de llaves" },
  { value: "REVISION_OBSERVACIONES",     label: "Revisión de observaciones" },
  { value: "FIRMA_MINUTA",               label: "Firma de Minuta" },
  { value: "FIRMA_ESCRITURA",            label: "Firma de Escritura" },
  { value: "INSPECCION_OBRA",            label: "Inspección de obra" },
  { value: "JUNTA_PROPIETARIOS",         label: "Junta de propietarios" },
  { value: "OTRO",                       label: "Otro" },
];

const STATUS_META: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  PROGRAMADA:             { bg: "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",     text: "text-blue-800",   label: "Programada",     dot: "bg-blue-500" },
  CONFIRMADA:             { bg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300", text: "text-emerald-800", label: "Confirmada", dot: "bg-emerald-500" },
  CANCELADA:              { bg: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",          text: "text-red-700",    label: "Cancelada",      dot: "bg-red-500" },
  COMPLETADA:             { bg: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/50",      text: "text-slate-600",  label: "Completada",     dot: "bg-slate-400" },
  REPROGRAMACION_PENDIENTE: { bg: "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300", text: "text-amber-800", label: "Reprog. pend.", dot: "bg-amber-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCalendarGrid(currentDate: Date): CalDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let startDayOfWeek = new Date(year, month, 1).getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const grid: CalDay[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) grid.push({ day: prevMonthTotalDays - i, grey: true, events: [] });
  for (let day = 1; day <= totalDays; day++) grid.push({ day, today: isCurrentMonth && today.getDate() === day, events: [] });
  const remaining = grid.length % 7 === 0 ? 0 : 7 - (grid.length % 7);
  for (let day = 1; day <= remaining; day++) grid.push({ day, grey: true, events: [] });
  return grid;
}

function getGridDateRange(gridCells: CalDay[], currentDate: Date): { startDateStr: string; endDateStr: string } {
  const first = gridCells[0];
  const last = gridCells.at(-1);
  if (!first || !last) return { startDateStr: "", endDateStr: "" };
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  let sy = year, sm = month;
  if (first.grey && first.day > 15) { sm--; if (sm < 0) { sm = 11; sy--; } }
  let ey = year, em = month;
  if (last.grey && last.day < 15) { em++; if (em > 11) { em = 0; ey++; } }

  return {
    startDateStr: `${sy}-${String(sm + 1).padStart(2, "0")}-${String(first.day).padStart(2, "0")}T00:00:00`,
    endDateStr:   `${ey}-${String(em + 1).padStart(2, "0")}-${String(last.day).padStart(2, "0")}T23:59:59`,
  };
}

function rsvpMeta(confirmacion: boolean | null | undefined): { dot: string; text: string } {
  if (confirmacion === true) return { dot: "bg-emerald-500", text: "Confirmado" };
  if (confirmacion === false) return { dot: "bg-rose-500", text: "Declinado" };
  return { dot: "bg-slate-300", text: "Sin respuesta" };
}

function confirmacionLabel(confirmacion: boolean | null | undefined): string {
  if (confirmacion === true) return "✓ Confirmado";
  if (confirmacion === false) return "✕ Declinado";
  return "Sin respuesta";
}

function slotStateClass(isSelected: boolean, isDisabled: boolean): string {
  if (isSelected) return "border-arch-gold bg-arch-gold text-white shadow-sm scale-105";
  if (isDisabled) return "border-slate-100 dark:border-white/5 text-slate-200 dark:text-white/15 cursor-not-allowed";
  return "border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-arch-gold/60 hover:text-arch-gold";
}

function dayNumberClass(today: boolean | undefined, grey: boolean | undefined): string {
  if (today) return "bg-build-main text-white font-bold shadow-sm";
  if (grey) return "text-slate-300 dark:text-white/20";
  return "text-build-main dark:text-white";
}

function mapCitaToEvent(c: CitaResponse): CalEvent {
  const time = c.fechaInicio.split("T")[1]?.slice(0, 5) || "";
  const meta = STATUS_META[c.estadoCita] ?? STATUS_META.PROGRAMADA;
  const { dot: rsvpDot, text: rsvpText } = rsvpMeta(c.confirmacionCliente);

  return {
    id: c.id,
    label: c.titulo || c.tipoEvento,
    bg: meta.bg,
    dot: meta.dot,
    rsvpDot,
    rsvpText,
    time,
    client: c.clienteNombre || "Cliente",
    type: c.tipoEvento,
    estadoCita: c.estadoCita,
  };
}

function mapCitasToGrid(citas: CitaResponse[], gridCells: CalDay[], currentDate: Date): CalDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  return gridCells.map((cell) => {
    let cy = year, cm = month;
    if (cell.grey) {
      if (cell.day > 15) { cm--; if (cm < 0) { cm = 11; cy--; } }
      else { cm++; if (cm > 11) { cm = 0; cy++; } }
    }
    const dateStr = `${cy}-${String(cm + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    return { ...cell, events: citas.filter((c) => c.fechaInicio.startsWith(dateStr)).map(mapCitaToEvent) };
  });
}

function getTipoLabel(tipo: string) {
  if (tipo === "ESTACIONAMIENTO") return "Cochera";
  if (tipo === "DEPOSITO") return "Depósito";
  return "Dpto";
}

function mapExpedientesToUnits(exps: UsuarioActivoResponseDTO[]): { id: string; name: string }[] {
  return exps.flatMap((exp) =>
    (exp.activos || []).map((a) => ({ id: String(a.id), name: `${getTipoLabel(a.tipo)} ${a.nro}` }))
  );
}

function validateForm(clientId: string, unitId: string, date: string, start: string, end: string): string | null {
  if (!clientId || !unitId || !date || !start || !end) return "Por favor completa todos los campos requeridos.";
  if (new Date(`${date}T${start}`) < new Date()) return "No puedes agendar citas en fechas u horas pasadas.";
  return null;
}

// ─── Time / Date helpers ──────────────────────────────────────────────────────

function addMinutes(hhmm: string, mins: number): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** All 30-min slots from 07:00 to 20:00 */
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-build-main dark:text-white bg-white dark:bg-white/5 outline-none focus:border-arch-gold focus:ring-2 focus:ring-arch-gold/20 transition-colors";

/** Date picker: shortcut chips (Hoy / Mañana / Pasado) + hidden native input triggered by "Otra fecha" */
function DateQuickPicker({ value, onChange, id = "agenda-date-native" }: Readonly<{ value: string; onChange: (v: string) => void; id?: string }>) {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dat2   = new Date(today); dat2.setDate(today.getDate() + 2);

  const shortcuts = [
    { label: "Hoy",    val: fmtLocalDate(today) },
    { label: "Mañana", val: fmtLocalDate(tomorrow) },
    {
      label: dat2.toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
      val: fmtLocalDate(dat2),
    },
  ];

  const isShortcut = shortcuts.some((s) => s.val === value);

  function triggerNative() {
    const inp = document.getElementById(id) as HTMLInputElement | null;
    inp?.showPicker?.();
    inp?.click();
  }

  return (
    <div className="space-y-2">
      {/* Chip row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {shortcuts.map((s) => (
          <button
            key={s.val}
            type="button"
            onClick={() => onChange(s.val)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              value === s.val
                ? "border-arch-gold bg-arch-gold/10 text-arch-gold"
                : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-arch-gold/50 hover:text-arch-gold",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
        {/* "Otra fecha" chip opens the native date picker */}
        <button
          type="button"
          onClick={triggerNative}
          className={[
            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1",
            !isShortcut && value
              ? "border-arch-gold bg-arch-gold/10 text-arch-gold"
              : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-arch-gold/50 hover:text-arch-gold",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-[13px]">calendar_month</span>
          {!isShortcut && value
            ? new Date(value + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short" })
            : "Otra fecha"}
        </button>
        {/* Hidden native input */}
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {/* Human-readable confirmation */}
      {value && (
        <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5 pl-0.5">
          <span className="material-symbols-outlined text-[13px] text-arch-gold">event</span>
          {new Date(value + "T00:00:00").toLocaleDateString("es-PE", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

/** Scrollable grid of 30-min time slots */
function TimeSlotGrid({
  label,
  value,
  onChange,
  disabledBefore,
  extra,
}: Readonly<{
  label?: string;
  value: string;
  onChange: (v: string) => void;
  disabledBefore?: string;
  extra?: React.ReactNode;
}>) {
  return (
    <div className="space-y-1.5">
      {(label || extra) && (
        <div className="flex items-center justify-between">
          {label && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
              {label}
            </p>
          )}
          {extra}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5 py-0.5">
        {TIME_SLOTS.map((slot) => {
          const isDisabled = !!disabledBefore && slot <= disabledBefore;
          const isSelected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(slot)}
              className={[
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                slotStateClass(isSelected, isDisabled),
              ].join(" ")}
            >
              {slot}
            </button>
          );
        })}
      </div>
      {/* Selected display */}
      {value && (
        <p className="text-xs font-bold text-arch-gold flex items-center gap-1 pl-0.5">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          {value} hs seleccionado
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgendaView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calDays, setCalDays] = useState<CalDay[]>([]);
  const [rawCitas, setRawCitas] = useState<CitaResponse[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Clients + units
  const [clients, setClients] = useState<Usuario[]>([]);
  const [clientUnits, setClientUnits] = useState<{ id: string; name: string }[]>([]);

  // New appointment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0].value);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("Oficina Principal");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Detail / edit modal
  const [selectedCita, setSelectedCita] = useState<CitaResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [modalError, setModalError] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editEstado, setEditEstado] = useState<CitaResponse["estadoCita"]>("PROGRAMADA");
  const [editPermiteReprog, setEditPermiteReprog] = useState(false);

  const selectedClient = clients.find((c) => String(c.id) === clientId);

  // Load clients
  useEffect(() => {
    fetchUsuarios()
      .then((users) => setClients(users.filter((u) => u.tipoUsuario === "CLIENTE")))
      .catch(console.error);
  }, []);

  // Load units when client changes
  useEffect(() => {
    let active = true;

    async function loadUnits() {
      // Reset is synchronous (runs before the first await) so we never show
      // the previous client's units while the new ones are loading.
      setClientUnits([]);
      setSelectedUnitId("");
      if (!clientId) return;
      try {
        const exps = await fetchExpedientesPorUsuario(Number(clientId));
        if (!active) return;
        const units = mapExpedientesToUnits(exps ?? []);
        setClientUnits(units);
        if (units.length > 0) setSelectedUnitId(units[0].id);
      } catch (err) {
        console.error(err);
      }
    }

    loadUnits();
    return () => { active = false; };
  }, [clientId]);

  // Grid cells
  const gridCells = useMemo(() => generateCalendarGrid(currentDate), [currentDate]);

  // Fetch appointments
  const fetchAppointments = React.useCallback(async () => {
    if (!gridCells.length) return;
    const { startDateStr, endDateStr } = getGridDateRange(gridCells, currentDate);
    setLoadingEvents(true);
    try {
      const citas = await fetchCitasCalendario(startDateStr, endDateStr);
      setRawCitas(citas);
      setCalDays(mapCitasToGrid(citas, gridCells, currentDate));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  }, [gridCells, currentDate]);

  useEffect(() => {
    async function load() { await fetchAppointments(); }
    load();
  }, [fetchAppointments]);

  // Month nav
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday   = () => setCurrentDate(new Date());

  // New appointment
  function resetForm() {
    setClientId(""); setSelectedUnitId(""); setEventType(EVENT_TYPES[0].value);
    setEventDate(""); setStartTime(""); setEndTime(""); setLocation("Oficina Principal");
    setFormError(""); setSaveSuccess(false);
  }

  function openModal(prefilledDate?: string) {
    resetForm();
    setModalOpen(true);
    if (prefilledDate) setEventDate(prefilledDate);
  }

  function handleCellClick(cell: CalDay) {
    if (cell.grey) return;
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    openModal(`${y}-${String(m + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`);
  }

  function handleEventClick(id: string) {
    const cita = rawCitas.find((c) => c.id === id);
    if (cita) {
      setSelectedCita(cita); setModalError(""); setShowCancelForm(false);
      setMotivoCancelacion(""); setIsEditing(false); setDetailOpen(true);
    }
  }

  async function saveEvent(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validateForm(clientId, selectedUnitId, eventDate, startTime, endTime);
    if (err) { setFormError(err); return; }
    setIsSaving(true); setFormError("");
    const label = EVENT_TYPES.find((t) => t.value === eventType)?.label || eventType;
    try {
      await crearCita({
        clienteId: Number(clientId),
        activoId: selectedUnitId,
        tipoEvento: eventType,
        titulo: `${label} - ${selectedClient?.nombre || ""} ${selectedClient?.apellidos || ""}`.trim(),
        descripcion: "Cita sobre unidad inmobiliaria",
        ubicacion: location,
        fechaInicio: `${eventDate}T${startTime}:00`,
        fechaFin: `${eventDate}T${endTime}:00`,
        permiteReprogramacion: true,
        clienteUsaGoogle: false,
      });
      setSaveSuccess(true);
      setTimeout(() => { setModalOpen(false); fetchAppointments(); }, 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la cita.");
    } finally {
      setIsSaving(false);
    }
  }

  // Edit
  function startEdit() {
    if (!selectedCita) return;
    const [d, t] = selectedCita.fechaInicio.split("T");
    const [, t2] = selectedCita.fechaFin.split("T");
    setEditTitle(selectedCita.titulo); setEditDesc(selectedCita.descripcion);
    setEditLocation(selectedCita.ubicacion); setEditDate(d || "");
    setEditStartTime(t?.slice(0, 5) || ""); setEditEndTime(t2?.slice(0, 5) || "");
    setEditEstado(selectedCita.estadoCita); setEditPermiteReprog(selectedCita.permiteReprogramacion);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!selectedCita) return;
    if (!editTitle.trim() || !editDate || !editStartTime || !editEndTime) {
      setModalError("Completa los campos requeridos."); return;
    }
    setIsSaving(true); setModalError("");
    try {
      await actualizarCita(selectedCita.id, {
        titulo: editTitle, descripcion: editDesc, ubicacion: editLocation,
        fechaInicio: `${editDate}T${editStartTime}:00`,
        fechaFin: `${editDate}T${editEndTime}:00`,
        estadoCita: editEstado, permiteReprogramacion: editPermiteReprog,
      });
      setIsEditing(false); setDetailOpen(false); fetchAppointments();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error al actualizar la cita.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmCancel() {
    if (!selectedCita || !motivoCancelacion.trim()) return;
    setIsSaving(true); setModalError("");
    try {
      await cancelarCita(selectedCita.id, motivoCancelacion);
      setShowCancelForm(false); setDetailOpen(false); fetchAppointments();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error al cancelar la cita.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmBlock(bloqueId: number) {
    if (!selectedCita) return;
    setIsSaving(true); setModalError("");
    try {
      await seleccionarBloqueDisponibilidad(selectedCita.id, bloqueId);
      setDetailOpen(false); fetchAppointments();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error al confirmar la fecha.");
    } finally {
      setIsSaving(false);
    }
  }

  // Upcoming events (next 8, non-cancelled, sorted by time)
  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return rawCitas
      .filter((c) => c.fechaInicio >= todayStr && c.estadoCita !== "CANCELADA" && c.estadoCita !== "COMPLETADA")
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
      .slice(0, 8);
  }, [rawCitas]);

  const monthLabel = currentDate.toLocaleString("es-ES", { month: "long", year: "numeric" });

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
            Agenda y Citas
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Programa reuniones, firmas, entregas y eventos con clientes.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-build-main px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-main/90 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nueva cita</span>
        </button>
      </div>

      {/* ── Main grid: sidebar izquierda + calendario derecha ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* ── Panel izquierdo: próximas citas ── */}
        <div className="xl:col-span-4 space-y-3">

          {/* Header del panel */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-white/2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-arch-gold text-[18px]">event_upcoming</span>
                <h3 className="text-sm font-bold text-build-main dark:text-white">Próximas citas</h3>
              </div>
              {upcomingEvents.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-build-main/10 text-build-main dark:bg-white/10 dark:text-white/70">
                  {upcomingEvents.length}
                </span>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="px-4 py-12 flex flex-col items-center gap-2.5 text-center">
                <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/10">event_available</span>
                <p className="text-sm font-semibold text-slate-400 dark:text-white/30">Sin citas próximas</p>
                <p className="text-xs text-slate-300 dark:text-white/20">Las nuevas citas aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {upcomingEvents.map((c) => {
                  const meta   = STATUS_META[c.estadoCita] ?? STATUS_META.PROGRAMADA;
                  const dt     = new Date(c.fechaInicio);
                  const dtEnd  = new Date(c.fechaFin);
                  const isToday = dt.toDateString() === new Date().toDateString();
                  const dayNum  = dt.getDate();
                  const mon     = dt.toLocaleDateString("es-PE", { month: "short" });
                  const dow     = dt.toLocaleDateString("es-PE", { weekday: "short" });
                  const tStart  = dt.toLocaleTimeString("es-PE",  { hour: "2-digit", minute: "2-digit" });
                  const tEnd    = dtEnd.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleEventClick(c.id)}
                      className="w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group flex gap-3.5 items-start"
                    >
                      {/* Date block */}
                      <div className={[
                        "shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center border",
                        isToday
                          ? "bg-build-main border-build-main text-white"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-build-main dark:text-white",
                      ].join(" ")}>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? "text-white/70" : "text-slate-400 dark:text-white/40"}`}>
                          {isToday ? "HOY" : dow.replace(".", "")}
                        </span>
                        <span className="text-xl font-black leading-none">{dayNum}</span>
                        <span className={`text-[9px] font-semibold capitalize ${isToday ? "text-white/70" : "text-slate-400 dark:text-white/40"}`}>
                          {mon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-build-main dark:text-white leading-snug group-hover:text-arch-gold transition-colors line-clamp-2">
                            {c.titulo}
                          </p>
                          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg}`}>
                            {meta.label}
                          </span>
                        </div>

                        {/* Cliente */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-white/50 mb-1">
                          <span className="material-symbols-outlined text-[12px]">person</span>
                          <span className="truncate font-medium">{c.clienteNombre}</span>
                        </div>

                        {/* Hora + ubicación */}
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-arch-gold">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {tStart} – {tEnd}
                          </span>
                          {c.ubicacion && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/30 truncate">
                              <span className="material-symbols-outlined text-[11px]">location_on</span>
                              {c.ubicacion}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leyenda de estados */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2.5">
              Estados
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {Object.entries(STATUS_META).map(([, meta]) => (
                <div key={meta.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <span className="text-[11px] text-slate-500 dark:text-white/50">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calendario ── */}
        <div className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">

          {/* Month nav */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-build-main dark:text-white capitalize">{monthLabel}</h3>
              {loadingEvents && (
                <svg className="animate-spin h-4 w-4 text-slate-300 dark:text-white/20" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={goToday}
                className="px-3 h-8 text-xs font-bold text-build-main dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Days header */}
          <div role="grid" className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="py-2.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider">{d}</span>
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 border-l border-slate-100 dark:border-white/5">
            {calDays.map((cell, idx) => (
              <div
                key={`${cell.grey ? "g" : "m"}-${cell.day}-${idx}`}
                role="button"
                aria-label={cell.grey ? undefined : `Día ${cell.day}`}
                tabIndex={cell.grey ? -1 : 0}
                onClick={() => handleCellClick(cell)}
                onKeyDown={(e) => { if (!cell.grey && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); handleCellClick(cell); } }}
                className={[
                  "min-h-27.5 border-b border-r border-slate-100 dark:border-white/5 p-1.5 flex flex-col gap-1",
                  cell.grey
                    ? "bg-slate-50/60 dark:bg-white/1"
                    : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3 transition-colors",
                ].join(" ")}
              >
                {/* Day number */}
                <span className={[
                  "text-xs w-6 h-6 flex items-center justify-center rounded-full mb-0.5 font-semibold",
                  dayNumberClass(cell.today, cell.grey),
                ].join(" ")}>
                  {cell.day}
                </span>

                {/* Events */}
                {cell.events.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEventClick(ev.id); }}
                    className={`w-full text-left rounded-md px-1.5 py-1 flex items-center gap-1 hover:brightness-95 transition-all group/ev ${ev.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.dot}`} />
                    <span className="text-[10px] font-semibold truncate flex-1">{ev.label}</span>
                    {ev.time && <span className="text-[9px] opacity-60 shrink-0">{ev.time}</span>}
                  </button>
                ))}
                {cell.events.length > 3 && (
                  <span className="text-[9px] text-slate-400 dark:text-white/30 pl-1">
                    +{cell.events.length - 3} más
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── New Appointment Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={saveEvent}
            className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-arch-gold text-[20px]">edit_calendar</span>
                <h2 className="text-base font-bold text-build-main dark:text-white">Nueva cita</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {saveSuccess ? (
              <div className="p-10 flex flex-col items-center text-center gap-3">
                <span className="material-symbols-outlined text-[56px] text-emerald-500">check_circle</span>
                <p className="text-base font-bold text-build-main dark:text-white">¡Cita agendada!</p>
                <p className="text-sm text-slate-500 dark:text-white/50">La cita fue creada correctamente.</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                  {formError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
                      <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                      <p className="text-xs font-semibold">{formError}</p>
                    </div>
                  )}

                  <FormField label="Cliente *">
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
                      <option value="">Seleccionar cliente…</option>
                      {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre} {c.apellidos}</option>)}
                    </select>
                  </FormField>

                  {clientId && (
                    <FormField label="Unidad vinculada *">
                      <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className={inputCls}>
                        <option value="">Seleccionar unidad…</option>
                        {clientUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </FormField>
                  )}

                  <FormField label="Tipo de evento *">
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls}>
                      {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Fecha *">
                    <DateQuickPicker id="agenda-date-new" value={eventDate} onChange={setEventDate} />
                  </FormField>

                  {/* Hora inicio */}
                  <TimeSlotGrid
                    label="Hora de inicio *"
                    value={startTime}
                    onChange={(v) => {
                      setStartTime(v);
                      setEndTime(addMinutes(v, 30));
                    }}
                  />

                  {/* Hora fin — sólo visible cuando hay hora inicio */}
                  {startTime && (
                    <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/3 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                          Hora de fin *
                        </p>
                        <button
                          type="button"
                          onClick={() => setEndTime(addMinutes(endTime, 30))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-arch-gold/40 text-arch-gold text-[10px] font-bold hover:bg-arch-gold/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[12px]">add</span>
                          <span>+30 min</span>
                        </button>
                      </div>
                      <TimeSlotGrid
                        value={endTime}
                        onChange={setEndTime}
                        disabledBefore={startTime}
                      />
                    </div>
                  )}

                  <FormField label="Ubicación">
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
                  </FormField>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="px-5 py-2 bg-build-main text-white rounded-lg text-sm font-bold hover:bg-build-main/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isSaving && <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
                    {isSaving ? "Guardando…" : "Guardar cita"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* ── Detail / Edit Modal ── */}
      {detailOpen && selectedCita && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-arch-gold text-[20px]">
                  {isEditing ? "edit_calendar" : "event"}
                </span>
                <h2 className="text-base font-bold text-build-main dark:text-white">
                  {isEditing ? "Editar cita" : "Detalle de la cita"}
                </h2>
              </div>
              <button type="button" onClick={() => { setDetailOpen(false); setIsEditing(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
              {modalError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
                  <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                  <p className="text-xs font-semibold">{modalError}</p>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <FormField label="Título"><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} /></FormField>
                  <FormField label="Descripción"><textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${inputCls} h-20 resize-none`} /></FormField>
                  <FormField label="Ubicación"><input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className={inputCls} /></FormField>
                  <FormField label="Fecha">
                    <DateQuickPicker id="agenda-date-edit" value={editDate} onChange={setEditDate} />
                  </FormField>

                  <TimeSlotGrid
                    label="Hora de inicio"
                    value={editStartTime}
                    onChange={(v) => {
                      setEditStartTime(v);
                      setEditEndTime(addMinutes(v, 30));
                    }}
                  />

                  {editStartTime && (
                    <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/3 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                          Hora de fin
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditEndTime(addMinutes(editEndTime, 30))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-arch-gold/40 text-arch-gold text-[10px] font-bold hover:bg-arch-gold/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[12px]">add</span>
                          <span>+30 min</span>
                        </button>
                      </div>
                      <TimeSlotGrid
                        value={editEndTime}
                        onChange={setEditEndTime}
                        disabledBefore={editStartTime}
                      />
                    </div>
                  )}
                  <FormField label="Estado">
                    <select value={editEstado} onChange={(e) => setEditEstado(e.target.value as CitaResponse["estadoCita"])} className={inputCls}>
                      {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </FormField>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editPermiteReprog} onChange={(e) => setEditPermiteReprog(e.target.checked)} className="w-4 h-4 accent-arch-gold rounded" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-white/70">Permite reprogramación</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary card */}
                  <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-build-main dark:text-white leading-snug">{selectedCita.titulo}</p>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[selectedCita.estadoCita]?.bg ?? ""}`}>
                        {STATUS_META[selectedCita.estadoCita]?.label ?? selectedCita.estadoCita}
                      </span>
                    </div>
                    {selectedCita.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-white/50">{selectedCita.descripcion}</p>
                    )}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">Cliente</span>
                      <span className="font-semibold text-build-main dark:text-white">{selectedCita.clienteNombre}</span>
                      {selectedCita.clienteEmail && <span className="block text-slate-400 dark:text-white/40 truncate">{selectedCita.clienteEmail}</span>}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">Unidad</span>
                      <span className="font-semibold text-build-main dark:text-white">Dpto/Cochera {selectedCita.activoNro}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">Fecha y hora</span>
                      <span className="font-semibold text-build-main dark:text-white">{new Date(selectedCita.fechaInicio).toLocaleDateString("es-PE")}</span>
                      <span className="block text-slate-500 dark:text-white/50">
                        {new Date(selectedCita.fechaInicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(selectedCita.fechaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">Ubicación</span>
                      <span className="font-semibold text-build-main dark:text-white truncate block">{selectedCita.ubicacion || "Sin ubicación"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">Confirmación cliente</span>
                      <span className="font-semibold text-build-main dark:text-white">
                        {confirmacionLabel(selectedCita.confirmacionCliente)}
                      </span>
                    </div>
                  </div>

                  {/* Reprogramming blocks */}
                  {selectedCita.estadoCita === "REPROGRAMACION_PENDIENTE" && (selectedCita.disponibilidades?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Bloques propuestos por el cliente</p>
                      <div className="space-y-2">
                        {selectedCita.disponibilidades!.map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-100 dark:border-amber-900/20 bg-amber-50/60 dark:bg-amber-900/10">
                            <div>
                              <p className="text-xs font-bold text-build-main dark:text-white">{new Date(d.bloqueInicio).toLocaleDateString("es-PE")}</p>
                              <p className="text-[10px] text-slate-500">
                                {new Date(d.bloqueInicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                                {" – "}
                                {new Date(d.bloqueFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <button onClick={() => confirmBlock(d.id)} disabled={isSaving}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                              Confirmar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancel form */}
                  {showCancelForm && (
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Motivo de cancelación *</p>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Ej. Cambio de horario solicitado" value={motivoCancelacion}
                          onChange={(e) => setMotivoCancelacion(e.target.value)}
                          className={`${inputCls} text-xs`} />
                        <button onClick={confirmCancel} disabled={isSaving || !motivoCancelacion.trim()}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0">
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    Volver
                  </button>
                  <button onClick={saveEdit} disabled={isSaving}
                    className="px-5 py-2 bg-build-main text-white rounded-lg text-sm font-bold hover:bg-build-main/90 transition-colors disabled:opacity-50">
                    {isSaving ? "Guardando…" : "Guardar cambios"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    {selectedCita.estadoCita !== "CANCELADA" && selectedCita.estadoCita !== "COMPLETADA" && (
                      <button onClick={() => setShowCancelForm((v) => !v)}
                        className="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-bold transition-colors">
                        Cancelar cita
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedCita.estadoCita !== "CANCELADA" && selectedCita.estadoCita !== "COMPLETADA" && (
                      <button onClick={startEdit}
                        className="px-4 py-2 bg-build-main text-white hover:bg-build-main/90 rounded-lg text-xs font-bold transition-colors">
                        Editar
                      </button>
                    )}
                    <button onClick={() => { setDetailOpen(false); setIsEditing(false); }}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">
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
