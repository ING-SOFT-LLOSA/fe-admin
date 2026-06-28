/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  fetchProyectos,
  fetchTorresPorProyecto,
  fetchPisosPorTorre,
  fetchActivosPorProyecto,
  updateProyecto,
  deleteProyecto,
  createActivo,
  updateActivo,
  deleteActivo,
} from '@/lib/api/proyectos';
import type { ProyectoCreateDTO, ActivoRequestDTO } from '@/lib/api/proyectos';

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("proyectos API", () => {
  describe("fetchProyectos", () => {
    it("llama a /api/proyectos", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchProyectos();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/proyectos?size=200");
    });

    it("retorna la lista de proyectos", async () => {
      const proyectos = [{ id: "p1", nombre: "Edificio Norte", fechaFin: "2027-01-01" }];
      // El backend devuelve Page<ProyectoResponseDTO> — simulamos el shape real
      mockApiFetch.mockResolvedValue({ content: proyectos, totalElements: 1 });
      const result = await fetchProyectos();
      expect(result[0]).toMatchObject({ id: "p1", nombre: "Edificio Norte" });
    });
  });

  describe("fetchTorresPorProyecto", () => {
    it("llama a /api/torres/{uuidProyecto}", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchTorresPorProyecto("proyecto-uuid");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/torres/proyecto-uuid");
    });
  });

  describe("fetchPisosPorTorre", () => {
    it("llama a /api/pisos/{idTorre}", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchPisosPorTorre(42);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/pisos/42");
    });
  });

  describe("fetchActivosPorProyecto", () => {
    it("llama al endpoint sin estado cuando no se pasa estado", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchActivosPorProyecto("proyecto-uuid");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/activos/proyecto/proyecto-uuid");
      expect(url).not.toContain("estado=");
      expect(url).toContain("size=100");
    });

    it("incluye el parámetro estado cuando se pasa", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchActivosPorProyecto("proyecto-uuid", "DISPONIBLE");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("estado=DISPONIBLE");
    });
  });

  describe("updateProyecto", () => {
    it("hace PUT a /api/proyectos/{uuid} con los datos", async () => {
      const data: ProyectoCreateDTO = {
        nombre: "Nuevo nombre",
        descripcion: "Descripción",
        precertificacionEdgeLeed: false,
        linkRecorridoVirtual: "",
        departamento: "Lima",
        distrito: "Miraflores",
        direccion: "Av. Principal 123",
        fechaInicio: "2026-01-01",
        fechaFin: "2027-01-01",
      };
      mockApiFetch.mockResolvedValue({ id: "p1", ...data });
      await updateProyecto("p1", data);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/proyectos/p1");
      expect((init as RequestInit).method).toBe("PUT");
      expect((init as RequestInit).body).toContain('"nombre":"Nuevo nombre"');
    });
  });

  describe("deleteProyecto", () => {
    it("hace DELETE a /api/proyectos/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteProyecto("p1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/proyectos/p1", { method: "DELETE" });
    });
  });

  describe("createActivo", () => {
    it("hace POST a /api/activos/{idPiso}/pisos con el payload", async () => {
      const data: ActivoRequestDTO = {
        nro: "101",
        tipo: "DEPARTAMENTO",
        areaM2: 80,
        areaTechada: 75,
        estadoComercial: "DISPONIBLE",
        precio: 200000,
        descripcion: "Dep bonito",
        tieneRecorridoVirtual: false,
      };
      mockApiFetch.mockResolvedValue({ id: "act-1", ...data });
      await createActivo(10, data);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/activos/10/pisos");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("updateActivo", () => {
    it("hace PUT a /api/activos/{uuid}", async () => {
      const data: ActivoRequestDTO = {
        nro: "102",
        tipo: "ESTACIONAMIENTO",
        areaM2: 14,
        areaTechada: 14,
        estadoComercial: "DISPONIBLE",
        precio: 30000,
        descripcion: "Parking",
        tieneRecorridoVirtual: false,
      };
      mockApiFetch.mockResolvedValue({ id: "act-2", ...data });
      await updateActivo("act-2", data);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/activos/act-2");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("deleteActivo", () => {
    it("hace DELETE a /api/activos/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteActivo("act-3");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/activos/act-3", { method: "DELETE" });
    });
  });
});
