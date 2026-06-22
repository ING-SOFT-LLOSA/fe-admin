import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AgendaView from '@/modules/agenda/components/AgendaView';

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock("@/lib/api/agenda", () => ({
  fetchCitasCalendario: vi.fn(),
  crearCita: vi.fn(),
  cancelarCita: vi.fn(),
  actualizarCita: vi.fn(),
  seleccionarBloqueDisponibilidad: vi.fn(),
  forzarSincronizacionManual: vi.fn(),
  getGoogleAuthUrl: vi.fn(),
  disconnectGoogleCalendar: vi.fn(),
}));

import { fetchUsuarios, fetchExpedientesPorUsuario } from "@/lib/api/users";
import {
  fetchCitasCalendario,
  crearCita,
  actualizarCita,
  cancelarCita,
} from "@/lib/api/agenda";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockFetchExpedientesPorUsuario = vi.mocked(fetchExpedientesPorUsuario);
const mockFetchCitas = vi.mocked(fetchCitasCalendario);
const mockCrearCita = vi.mocked(crearCita);
const mockActualizarCita = vi.mocked(actualizarCita);
const mockCancelarCita = vi.mocked(cancelarCita);

const sampleClient = {
  id: 1,
  nombre: "Ana",
  apellidos: "García",
  email: "ana@test.com",
  tipoUsuario: "CLIENTE" as const,
  activo: true,
};

const sampleCita = {
  id: "cita-1",
  titulo: "Firma de minuta",
  descripcion: "Firma de minuta con el cliente",
  tipoEvento: "FIRMA_MINUTA",
  fechaInicio: "2026-06-20T10:00:00",
  fechaFin: "2026-06-20T11:00:00",
  estadoCita: "PROGRAMADA" as const,
  estadoSincronizacion: "PENDIENTE" as const,
  clienteNombre: "Ana García",
  clienteEmail: "ana@test.com",
  clienteUsaGoogle: false,
  confirmacionCliente: null,
  ubicacion: "Oficina",
  activoNro: "402",
  disponibilidades: [],
};

describe("AgendaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsuarios.mockResolvedValue([sampleClient] as any);
        mockFetchExpedientesPorUsuario.mockResolvedValue([{
      uuidUsuarioActivo: "uuid-1",
      activos: [{ id: "unit-1", nro: "402", tipo: "DEPARTAMENTO", pisoId: 0, areaM2: 0, areaTechada: 0, estadoComercial: "", precio: 0, descripcion: "" }],
    }] as any);
        mockFetchCitas.mockResolvedValue([sampleCita as any]);
    window.alert = vi.fn();
    window.open = vi.fn(() => null);
    window.confirm = vi.fn(() => true);
  });

  it("renders title and subtitle", async () => {
    render(<AgendaView />);
    expect(await screen.findByText("Agenda y Citas")).toBeDefined();
    expect(
      screen.getByText(/Programa reuniones, firmas, entregas y eventos importantes/i),
    ).toBeDefined();
  });

  it("renders day-of-week headers", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    expect(screen.getByText("Lun")).toBeDefined();
    expect(screen.getByText("Mar")).toBeDefined();
    expect(screen.getByText("Mié")).toBeDefined();
    expect(screen.getByText("Jue")).toBeDefined();
    expect(screen.getByText("Vie")).toBeDefined();
    expect(screen.getByText("Sáb")).toBeDefined();
    expect(screen.getByText("Dom")).toBeDefined();
  });

  it("renders buttons: Nueva cita and Hoy", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    expect(screen.getByText("Nueva cita")).toBeDefined();
    expect(screen.getByText("Hoy")).toBeDefined();
  });

  it("renders calendar navigation with previous/next month buttons", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    expect(screen.getByText("chevron_left")).toBeDefined();
    expect(screen.getByText("chevron_right")).toBeDefined();
  });

  it("shows loading indicator when fetching events", async () => {
    mockFetchCitas.mockReturnValue(new Promise(() => {}));
    render(<AgendaView />);
    expect(await screen.findByText("Actualizando...")).toBeDefined();
  });

  it("opens create appointment modal on Nueva cita click", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    expect(screen.getByText("Agendar cita")).toBeDefined();
    expect(screen.getByDisplayValue("-- Seleccionar Cliente --")).toBeDefined();
  });

  it("closes create appointment modal on close button", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    expect(screen.getByText("Agendar cita")).toBeDefined();
    fireEvent.click(screen.getByText("close"));
    await waitFor(() => {
      expect(screen.queryByText("Agendar cita")).toBeNull();
    });
  });

  it("loads clients in create modal dropdown", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    expect(await screen.findByText("Ana García")).toBeDefined();
  });

  it("shows unit select when a client is selected in modal", async () => {
    mockFetchUsuarios.mockResolvedValue([sampleClient] as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    const clientSelect = await screen.findByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(clientSelect, { target: { value: "1" } });
    expect(await screen.findByText("Unidad vinculada *")).toBeDefined();
  });

  it("submits create appointment form successfully", async () => {
    mockCrearCita.mockResolvedValue({} as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));

    await screen.findByDisplayValue("-- Seleccionar Cliente --");

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "2026-12-20" } });
    if (inputs.length > 1) fireEvent.change(inputs[1], { target: { value: "10:00" } });
    if (inputs.length > 2) fireEvent.change(inputs[2], { target: { value: "11:00" } });

    const clientSelect = screen.getByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(clientSelect, { target: { value: "1" } });

    await screen.findByText("Dpto 402");

    fireEvent.click(screen.getByText("Guardar y sincronizar calendario"));

    await waitFor(() => {
      expect(mockCrearCita).toHaveBeenCalled();
    });
  });

  it("shows error when creating appointment fails", async () => {
    mockCrearCita.mockRejectedValue(new Error("Campo requerido faltante"));
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));

    await screen.findByDisplayValue("-- Seleccionar Cliente --");

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "2026-12-20" } });
    if (inputs.length > 1) fireEvent.change(inputs[1], { target: { value: "10:00" } });
    if (inputs.length > 2) fireEvent.change(inputs[2], { target: { value: "11:00" } });

    const clientSelect = screen.getByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(clientSelect, { target: { value: "1" } });

    await screen.findByText("Dpto 402");

    fireEvent.click(screen.getByText("Guardar y sincronizar calendario"));

    expect(await screen.findByText("Campo requerido faltante")).toBeDefined();
  });

  it("shows 'No hay eventos próximos' when no upcoming events", async () => {
    mockFetchCitas.mockResolvedValue([]);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    expect(await screen.findByText("No hay eventos próximos en este período.")).toBeDefined();
  });

  it("opens detail modal when clicking an event", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    const events = screen.getAllByText("Firma de minuta");
    expect(events.length).toBeGreaterThan(0);
    fireEvent.click(events[0]);
    await waitFor(() => {
      expect(screen.getByText("Detalle de la Cita")).toBeDefined();
    });
  });

  it("opens edit form from detail modal", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    const events = screen.getAllByText("Firma de minuta");
    expect(events.length).toBeGreaterThan(0);
    fireEvent.click(events[0]);
    const editBtn = await screen.findByText("Editar");
    fireEvent.click(editBtn);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Firma de minuta")).toBeDefined();
    });
  });

  it("saves edit changes", async () => {
    mockActualizarCita.mockResolvedValue({} as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    const events = screen.getAllByText("Firma de minuta");
    expect(events.length).toBeGreaterThan(0);
    fireEvent.click(events[0]);
    const editBtn = await screen.findByText("Editar");
    fireEvent.click(editBtn);
    const titleInput = await screen.findByDisplayValue("Firma de minuta");
    fireEvent.change(titleInput, { target: { value: "Firma actualizada" } });
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await waitFor(() => {
      expect(mockActualizarCita).toHaveBeenCalled();
    });
  });

  it("cancels an event from detail modal", async () => {
    mockCancelarCita.mockResolvedValue({} as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    const events = screen.getAllByText("Firma de minuta");
    expect(events.length).toBeGreaterThan(0);
    fireEvent.click(events[0]);
    const cancelBtn = await screen.findByText("Cancelar Cita");
    fireEvent.click(cancelBtn);
    const motivoInput = await screen.findByPlaceholderText("Ej. Cambio de horario solicitado");
    fireEvent.change(motivoInput, { target: { value: "Cambio de fecha" } });
    fireEvent.click(screen.getByText("Confirmar"));
    await waitFor(() => {
      expect(mockCancelarCita).toHaveBeenCalled();
    });
  });

  it("shows cancellation error in detail modal", async () => {
    mockCancelarCita.mockRejectedValue(new Error("Error al cancelar"));
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    fireEvent.click(screen.getAllByText("Firma de minuta")[0]);
    const cancelBtn = await screen.findByText("Cancelar Cita");
    fireEvent.click(cancelBtn);
    fireEvent.change(await screen.findByPlaceholderText("Ej. Cambio de horario solicitado"), { target: { value: "Motivo" } });
    fireEvent.click(screen.getByText("Confirmar"));
    expect(await screen.findByText("Error al cancelar")).toBeDefined();
  });

  it("shows status badges for different appointment statuses", async () => {
    const confirmedCita = { ...sampleCita, titulo: "Cita confirmada", estadoCita: "CONFIRMADA" as const, clienteNombre: "Ana García" };
    const canceledCita = { ...sampleCita, id: "cita-2", titulo: "Reunion cancelada", estadoCita: "CANCELADA" as const, clienteNombre: "Luis Pérez" };
    mockFetchCitas.mockResolvedValue([confirmedCita as any, canceledCita as any]);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    expect(screen.getAllByText("Reunion cancelada").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText("Reunion cancelada")[0]);
    expect(await screen.findByText("CANCELADA")).toBeDefined();
    // Also verify CONFIRMADA badge gets its style applied
    fireEvent.click(screen.getByText("Cerrar"));
    await waitFor(() => {
      expect(screen.queryByText("Detalle de la Cita")).toBeNull();
    });
    fireEvent.click(screen.getAllByText("Cita confirmada")[0]);
    expect(await screen.findByText("CONFIRMADA")).toBeDefined();
  });

  it("shows COMPLETADA and REPROGRAMACION_PENDIENTE status badges", async () => {
    const completedCita = { ...sampleCita, id: "cita-3", titulo: "Cita completada", estadoCita: "COMPLETADA" as const, clienteNombre: "Ana García" };
    const reprogCita = { ...sampleCita, id: "cita-4", titulo: "Cita reprogramada", estadoCita: "REPROGRAMACION_PENDIENTE" as const, clienteNombre: "Luis Pérez" };
    mockFetchCitas.mockResolvedValue([completedCita as any, reprogCita as any]);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    fireEvent.click(screen.getAllByText("Cita completada")[0]);
    expect(await screen.findByText("COMPLETADA")).toBeDefined();
    fireEvent.click(screen.getByText("Cerrar"));
    await waitFor(() => {
      expect(screen.queryByText("Detalle de la Cita")).toBeNull();
    });
    fireEvent.click(screen.getAllByText("Cita reprogramada")[0]);
    expect(await screen.findByText("REPROGRAMACION_PENDIENTE")).toBeDefined();
  });

  it("shows client confirmation badges", async () => {
    const confirmedCita = { ...sampleCita, id: "cita-5", titulo: "Cita confirmada", confirmacionCliente: true, clienteNombre: "Ana García" };
    const declinedCita = { ...sampleCita, id: "cita-6", titulo: "Cita declinada", confirmacionCliente: false, clienteNombre: "Luis Pérez" };
    mockFetchCitas.mockResolvedValue([confirmedCita as any, declinedCita as any]);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    fireEvent.click(screen.getAllByText("Cita confirmada")[0]);
    expect(await screen.findByText("Confirmado ✓")).toBeDefined();
    fireEvent.click(screen.getByText("Cerrar"));
    await waitFor(() => {
      expect(screen.queryByText("Detalle de la Cita")).toBeNull();
    });
    fireEvent.click(screen.getAllByText("Cita declinada")[0]);
    expect(await screen.findByText("Declinado ✕")).toBeDefined();
  });

  it("shows validation error for missing required fields in create form", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    await screen.findByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.click(screen.getByText("Guardar y sincronizar calendario"));
    expect(await screen.findByText("Por favor completa todos los campos requeridos.")).toBeDefined();
  });

  it("shows validation error for missing fields when editing", async () => {
    mockActualizarCita.mockResolvedValue({} as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    fireEvent.click(screen.getAllByText("Firma de minuta")[0]);
    const editBtn = await screen.findByText("Editar");
    fireEvent.click(editBtn);
    const titleInput = await screen.findByDisplayValue("Firma de minuta");
    fireEvent.change(titleInput, { target: { value: "" } });
    fireEvent.click(screen.getByText("Guardar Cambios"));
    expect(await screen.findByText("Por favor completa los campos requeridos.")).toBeDefined();
  });

  it("opens create modal when clicking a calendar cell", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    // Click on day number (non-grey cell) in the grid — any number in 1-30
    const dayCells = screen.getAllByText(/^\d+$/).filter(el => {
      const day = parseInt(el.textContent || "", 10);
      return day >= 1 && day <= 31 && !el.textContent?.includes(":");
    });
    expect(dayCells.length).toBeGreaterThan(0);
    fireEvent.click(dayCells[0]);
    expect(await screen.findByText("Agendar cita")).toBeDefined();
    expect(screen.getByDisplayValue("-- Seleccionar Cliente --")).toBeDefined();
  });

  it("shows parking unit type label in create modal", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([{
      uuidUsuarioActivo: "uuid-2",
      activos: [{ id: "unit-2", nro: "5", tipo: "ESTACIONAMIENTO", pisoId: 0, areaM2: 0, areaTechada: 0, estadoComercial: "", precio: 0, descripcion: "" }],
    }] as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    await screen.findByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(screen.getByDisplayValue("-- Seleccionar Cliente --"), { target: { value: "1" } });
    expect(await screen.findByText("Cochera 5")).toBeDefined();
  });

  it("shows deposito unit type label in create modal", async () => {
    mockFetchExpedientesPorUsuario.mockResolvedValue([{
      uuidUsuarioActivo: "uuid-3",
      activos: [{ id: "unit-3", nro: "3", tipo: "DEPOSITO", pisoId: 0, areaM2: 0, areaTechada: 0, estadoComercial: "", precio: 0, descripcion: "" }],
    }] as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    await screen.findByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(screen.getByDisplayValue("-- Seleccionar Cliente --"), { target: { value: "1" } });
    expect(await screen.findByText("Depósito 3")).toBeDefined();
  });

  it("renders events with Google sync states", async () => {
    const syncedCita = { ...sampleCita, id: "s1", titulo: "Sincronizado", clienteUsaGoogle: true, estadoSincronizacion: "SINCRONIZADO" as const };
    const pendingCita = { ...sampleCita, id: "s2", titulo: "Pendiente sync", clienteUsaGoogle: true, estadoSincronizacion: "PENDIENTE" as const };
    mockFetchCitas.mockResolvedValue([syncedCita as any, pendingCita as any]);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    expect(screen.getAllByText("Sincronizado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pendiente sync").length).toBeGreaterThan(0);
  });

  it("navigates to previous and next month", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    mockFetchCitas.mockClear();
    fireEvent.click(screen.getByText("chevron_left"));
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    mockFetchCitas.mockClear();
    fireEvent.click(screen.getByText("chevron_right"));
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
  });

  it("goes to today", async () => {
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
    mockFetchCitas.mockClear();
    fireEvent.click(screen.getByText("Hoy"));
    await waitFor(() => {
      expect(mockFetchCitas).toHaveBeenCalled();
    });
  });

  it("shows error when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchCitas.mockRejectedValue(new Error("Network error"));
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it("shows validation error for past date", async () => {
    mockCrearCita.mockResolvedValue({} as any);
    render(<AgendaView />);
    await screen.findByText("Agenda y Citas");
    fireEvent.click(screen.getByText("Nueva cita"));
    await screen.findByDisplayValue("-- Seleccionar Cliente --");

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "2020-01-01" } });
    if (inputs.length > 1) fireEvent.change(inputs[1], { target: { value: "10:00" } });
    if (inputs.length > 2) fireEvent.change(inputs[2], { target: { value: "11:00" } });

    const clientSelect = screen.getByDisplayValue("-- Seleccionar Cliente --");
    fireEvent.change(clientSelect, { target: { value: "1" } });
    await screen.findByText("Dpto 402");

    fireEvent.click(screen.getByText("Guardar y sincronizar calendario"));
    expect(await screen.findByText(/No puedes agendar citas en fechas/)).toBeDefined();
  });
});
