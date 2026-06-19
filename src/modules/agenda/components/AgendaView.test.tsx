/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AgendaView from "./AgendaView";

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api/agenda", () => ({
  fetchCitasCalendario: vi.fn().mockResolvedValue({ data: [] }),
  crearCita: vi.fn(),
  cancelarCita: vi.fn(),
  actualizarCita: vi.fn(),
  seleccionarBloqueDisponibilidad: vi.fn(),
  forzarSincronizacionManual: vi.fn(),
  getGoogleAuthUrl: vi.fn().mockResolvedValue({ url: "https://accounts.google.com/auth" }),
  disconnectGoogleCalendar: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock("@/lib/api/proyectos", () => ({
  fetchProyectos: vi.fn().mockResolvedValue([]),
}));

import { fetchUsuarios } from "@/lib/api/users";
import { fetchCitasCalendario, getGoogleAuthUrl } from "@/lib/api/agenda";

const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockFetchCitas = vi.mocked(fetchCitasCalendario);
const mockGoogleAuth = vi.mocked(getGoogleAuthUrl);

describe("AgendaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsuarios.mockResolvedValue([]);
    mockFetchCitas.mockResolvedValue({ data: [] } as any);
    mockGoogleAuth.mockResolvedValue({ url: "https://accounts.google.com/auth" });
  });

  it("muestra el título Agenda y Citas", async () => {
    render(<AgendaView />);
    expect(await screen.findByText("Agenda y Citas")).toBeDefined();
  });

  it("muestra el botón de nueva cita", async () => {
    render(<AgendaView />);
    const btn = await screen.findByText(/Nueva/i);
    expect(btn).toBeDefined();
  });

  it("muestra los botones de navegación del calendario", async () => {
    render(<AgendaView />);
    expect(await screen.findByText("Hoy")).toBeDefined();
  });

  it("muestra los días de la semana", async () => {
    render(<AgendaView />);
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    for (const day of days) {
      expect(await screen.findByText(day)).toBeDefined();
    }
  });
});
