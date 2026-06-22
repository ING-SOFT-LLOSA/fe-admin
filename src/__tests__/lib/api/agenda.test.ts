/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  fetchCitasCalendario,
  crearCita,
  cancelarCita,
  fetchCitasPorActivo,
  actualizarCita,
  seleccionarBloqueDisponibilidad,
  fetchTodasLasCitas,
  forzarSincronizacionManual,
  fetchCitasCliente,
  fetchProximasCitasCliente,
  getGoogleAuthUrl,
  disconnectGoogleCalendar,
  responderCitaCliente,
  proponerDisponibilidadCliente,
} from '@/lib/api/agenda';

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("agenda API", () => {
  describe("fetchCitasCalendario", () => {
    it("llama al endpoint correcto con los parámetros codificados", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchCitasCalendario("2026-06-01T00:00:00", "2026-06-30T23:59:59");
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/agenda/empresa/citas/calendario")
      );
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("inicio=");
      expect(url).toContain("fin=");
    });

    it("retorna el array de citas", async () => {
      const citas = [{ id: "c1", titulo: "Visita" }];
      mockApiFetch.mockResolvedValue(citas);
      const result = await fetchCitasCalendario("2026-01-01", "2026-01-31");
      expect(result).toEqual(citas);
    });
  });

  describe("crearCita", () => {
    it("hace POST a /api/agenda/empresa/citas con el payload", async () => {
      const payload = {
        clienteId: 1,
        activoId: "act-1",
        tipoEvento: "VISITA",
        titulo: "Visita inmueble",
        descripcion: "Primera visita",
        ubicacion: "Lima",
        fechaInicio: "2026-06-15T10:00:00",
        fechaFin: "2026-06-15T11:00:00",
        permiteReprogramacion: false,
        clienteUsaGoogle: false,
      };
      mockApiFetch.mockResolvedValue({ id: "cita-1", ...payload });
      await crearCita(payload);
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/agenda/empresa/citas",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("cancelarCita", () => {
    it("hace DELETE al endpoint con el motivo codificado", async () => {
      mockApiFetch.mockResolvedValue({ id: "c1", estadoCita: "CANCELADA" });
      await cancelarCita("c1", "No disponible");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/agenda/empresa/citas/c1");
      expect(url).toContain("motivo=");
      expect((init as RequestInit).method).toBe("DELETE");
    });
  });

  describe("fetchCitasPorActivo", () => {
    it("llama al endpoint correcto con el activoId", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchCitasPorActivo("activo-uuid-1");
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/agenda/empresa/citas/activo/activo-uuid-1"
      );
    });
  });

  describe("actualizarCita", () => {
    it("hace PUT al endpoint de la cita con el payload", async () => {
      mockApiFetch.mockResolvedValue({ id: "c1" });
      await actualizarCita("c1", { titulo: "Nuevo título" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/agenda/empresa/citas/c1");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("seleccionarBloqueDisponibilidad", () => {
    it("hace PATCH al endpoint con el bloqueId en el body", async () => {
      mockApiFetch.mockResolvedValue({ id: "c1" });
      await seleccionarBloqueDisponibilidad("c1", 5);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/agenda/empresa/citas/c1/seleccionar-bloque");
      expect((init as RequestInit).method).toBe("PATCH");
      expect((init as RequestInit).body).toContain('"bloqueId":5');
    });
  });

  describe("fetchTodasLasCitas", () => {
    it("llama a /api/agenda/empresa/citas", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchTodasLasCitas();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/agenda/empresa/citas");
    });
  });

  describe("forzarSincronizacionManual", () => {
    it("hace POST a /api/agenda/empresa/sincronizar", async () => {
      mockApiFetch.mockResolvedValue({ mensaje: "OK", citasProcesadas: 3 });
      const result = await forzarSincronizacionManual();
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/agenda/empresa/sincronizar");
      expect((init as RequestInit).method).toBe("POST");
      expect(result).toEqual({ mensaje: "OK", citasProcesadas: 3 });
    });
  });

  describe("fetchCitasCliente", () => {
    it("llama a /api/agenda/cliente/citas", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchCitasCliente();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/agenda/cliente/citas");
    });
  });

  describe("fetchProximasCitasCliente", () => {
    it("llama a /api/agenda/cliente/citas/proximas", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchProximasCitasCliente();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/agenda/cliente/citas/proximas");
    });
  });

  describe("getGoogleAuthUrl", () => {
    it("llama a /api/auth/google/url", async () => {
      mockApiFetch.mockResolvedValue({ url: "https://google.com/oauth" });
      const result = await getGoogleAuthUrl();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/google/url");
      expect(result).toEqual({ url: "https://google.com/oauth" });
    });
  });

  describe("disconnectGoogleCalendar", () => {
    it("hace DELETE a /api/auth/google", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await disconnectGoogleCalendar();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/auth/google", { method: "DELETE" });
    });
  });

  describe("responderCitaCliente", () => {
    it("hace PATCH al endpoint de respuesta del cliente", async () => {
      mockApiFetch.mockResolvedValue({ id: "c1" });
      await responderCitaCliente("c1", { confirmado: true, nota: "OK" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/agenda/cliente/citas/c1/respuesta");
      expect((init as RequestInit).method).toBe("PATCH");
    });
  });

  describe("proponerDisponibilidadCliente", () => {
    it("hace POST al endpoint de disponibilidad con los bloques", async () => {
      mockApiFetch.mockResolvedValue([]);
      const bloques = [{ inicio: "2026-06-15T09:00:00", fin: "2026-06-15T10:00:00" }];
      await proponerDisponibilidadCliente("c1", bloques);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/agenda/cliente/citas/c1/disponibilidad");
      expect((init as RequestInit).method).toBe("POST");
      expect((init as RequestInit).body).toContain('"bloques"');
    });
  });
});
