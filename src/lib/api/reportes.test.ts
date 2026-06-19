/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  fetchReportesProyecto,
  fetchReportesActivo,
  createReporte,
  updateReporte,
  deleteReporte,
} from "./reportes";

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("reportes API", () => {
  describe("fetchReportesProyecto", () => {
    it("llama al endpoint con page y size por defecto", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchReportesProyecto("proyecto-uuid");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/reportes/proyecto/proyecto-uuid");
      expect(url).toContain("page=0");
      expect(url).toContain("size=10");
      expect(url).toContain("sort=fecha,desc");
    });

    it("usa los parámetros personalizados", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchReportesProyecto("p-uuid", 2, 5);
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("size=5");
    });
  });

  describe("fetchReportesActivo", () => {
    it("llama al endpoint de activo con sort desc", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchReportesActivo("activo-uuid");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/reportes/proyecto/activo-uuid/activo");
      expect(url).toContain("sort=fecha,desc");
    });
  });

  describe("createReporte", () => {
    it("hace POST a /api/reportes con el payload", async () => {
      const payload = {
        uuidProyecto: "p-1",
        tituloPeriodo: "Q2 2026",
        descripcion: "Avance del trimestre",
      };
      mockApiFetch.mockResolvedValue({ id: "r-1", ...payload });
      await createReporte(payload);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/reportes");
      expect((init as RequestInit).method).toBe("POST");
      expect((init as RequestInit).body).toContain('"tituloPeriodo":"Q2 2026"');
    });
  });

  describe("updateReporte", () => {
    it("hace PUT a /api/reportes/{id}", async () => {
      mockApiFetch.mockResolvedValue({ id: "r-1" });
      await updateReporte("r-1", { tituloPeriodo: "Q3 2026" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/reportes/r-1");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("deleteReporte", () => {
    it("hace DELETE a /api/reportes/{id}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteReporte("r-1");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/reportes/r-1");
      expect((init as RequestInit).method).toBe("DELETE");
    });
  });
});
