import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  getAvanceGeneral,
  crearEtapaProyecto,
  getEtapasByProyecto,
  getHitosActivo,
  getAvancesActivo,
  updateAvanceUnidad,
} from "./obra";

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("obra API", () => {
  describe("getAvanceGeneral", () => {
    it("llama a /api/proyectos/{uuid}/avance-general", async () => {
      mockApiFetch.mockResolvedValue({ proyectoId: "p-1", nombre: "Torre Norte", porcentajeAvance: 65 });
      const result = await getAvanceGeneral("p-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/proyectos/p-1/avance-general");
      expect(result.porcentajeAvance).toBe(65);
    });
  });

  describe("crearEtapaProyecto", () => {
    it("hace POST a /api/proyectos/{uuid}/hitos con tipo OBRA", async () => {
      mockApiFetch.mockResolvedValue({ id: 1, titulo: "Cimentación", orden: 1, tipo: "OBRA", estado: "PENDIENTE", fechaCompletado: null });
      await crearEtapaProyecto("p-1", { nombre: "Cimentación", descripcion: "Base del edificio", orden: 1 });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/proyectos/p-1/hitos");
      expect((init as RequestInit).method).toBe("POST");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.titulo).toBe("Cimentación");
      expect(body.tipo).toBe("OBRA");
    });
  });

  describe("getEtapasByProyecto", () => {
    it("llama a /api/proyectos/{uuid}/hitos y mapea a EtapaResponseDTO", async () => {
      const rawHitos = [
        { id: 1, titulo: "Cimentación", orden: 1, tipo: "OBRA", estado: "COMPLETADO", fechaCompletado: "2026-03-01" },
        { id: 2, titulo: "Estructura", orden: 2, tipo: "OBRA", estado: "EN_PROGRESO", fechaCompletado: null },
      ];
      mockApiFetch.mockResolvedValue(rawHitos);
      const result = await getEtapasByProyecto("p-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/proyectos/p-1/hitos");
      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe("Cimentación");
      expect(result[0].id).toBe(1);
      expect(result[0].hitos).toEqual([]);
      expect(result[1].estado).toBe("EN_PROGRESO");
    });
  });

  describe("getHitosActivo", () => {
    it("llama a /api/activos/{uuid}/hitos", async () => {
      mockApiFetch.mockResolvedValue([]);
      await getHitosActivo("activo-uuid");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/activos/activo-uuid/hitos");
    });
  });

  describe("getAvancesActivo", () => {
    it("llama a /api/activos/{uuid}/avances", async () => {
      mockApiFetch.mockResolvedValue([]);
      await getAvancesActivo("activo-uuid");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/activos/activo-uuid/avances");
    });
  });

  describe("updateAvanceUnidad", () => {
    it("hace PUT a /api/avances-unidad/{id} con el estado", async () => {
      mockApiFetch.mockResolvedValue({ id: "av-1", estado: "COMPLETADO" });
      await updateAvanceUnidad("av-1", "COMPLETADO");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/avances-unidad/av-1");
      expect((init as RequestInit).method).toBe("PUT");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.estado).toBe("COMPLETADO");
    });
  });
});
