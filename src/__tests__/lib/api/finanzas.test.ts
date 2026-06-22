/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getFreshToken: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import { getFreshToken } from "@/lib/auth/session";
import {
  fetchCronograma,
  createCronograma,
  updateCronograma,
  deleteCronograma,
  fetchPagos,
  fetchResumenPagos,
  addPago,
  updatePago,
  deletePago,
  updatePagoEstado,
  uploadPagoComprobante,
} from '@/lib/api/finanzas';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetFreshToken = vi.mocked(getFreshToken);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
  mockGetFreshToken.mockResolvedValue("token-test");
});

describe("finanzas API", () => {
  describe("fetchCronograma", () => {
    it("llama a /api/cronogramas/{uuid}", async () => {
      mockApiFetch.mockResolvedValue({ uuidCronograma: "crono-1" });
      await fetchCronograma("ua-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/cronogramas/ua-1");
    });
  });

  describe("createCronograma", () => {
    it("hace POST a /api/cronogramas con el payload", async () => {
      mockApiFetch.mockResolvedValue({ uuidCronograma: "crono-new" });
      await createCronograma({ uuidUsuarioActivo: "ua-1", totalPactado: 100000, cuotaInicial: 10000, numeroCuotas: 12 });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/cronogramas");
      expect((init as RequestInit).method).toBe("POST");
      expect((init as RequestInit).body).toContain('"totalPactado":100000');
    });
  });

  describe("updateCronograma", () => {
    it("hace PUT a /api/cronogramas/{uuid}", async () => {
      mockApiFetch.mockResolvedValue({ uuidCronograma: "crono-1" });
      await updateCronograma("crono-1", { uuidUsuarioActivo: "ua-1", totalPactado: 120000, cuotaInicial: 12000, numeroCuotas: 10 });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/cronogramas/crono-1");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("deleteCronograma", () => {
    it("hace DELETE a /api/cronogramas/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteCronograma("crono-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/cronogramas/crono-1", { method: "DELETE" });
    });
  });

  describe("fetchPagos", () => {
    it("llama a /api/cronogramas/{uuid}/pagos", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchPagos("crono-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/cronogramas/crono-1/pagos");
    });
  });

  describe("fetchResumenPagos", () => {
    it("llama a /api/cronogramas/{uuid}/resumen", async () => {
      mockApiFetch.mockResolvedValue({ estadoGlobal: "AL_DIA" });
      await fetchResumenPagos("crono-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/cronogramas/crono-1/resumen");
    });
  });

  describe("addPago", () => {
    it("hace POST a /api/cronogramas/{uuid}/pagos", async () => {
      mockApiFetch.mockResolvedValue({ uuidPago: "pago-1" });
      await addPago("crono-1", { nroCuota: 1, montoProgramado: 5000, fechaVencimiento: "2026-07-01" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/cronogramas/crono-1/pagos");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("updatePago", () => {
    it("hace PUT a /api/pagos/{uuid}", async () => {
      mockApiFetch.mockResolvedValue({ uuidPago: "pago-1" });
      await updatePago("pago-1", { nroCuota: 1, montoProgramado: 6000, fechaVencimiento: "2026-08-01" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/pagos/pago-1");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("deletePago", () => {
    it("hace DELETE a /api/pagos/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deletePago("pago-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/pagos/pago-1", { method: "DELETE" });
    });
  });

  describe("updatePagoEstado", () => {
    it("hace PATCH al endpoint con el estado en query param", async () => {
      mockApiFetch.mockResolvedValue({ uuidPago: "pago-1" });
      await updatePagoEstado("pago-1", "PAGADO");
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/pagos/pago-1/estado");
      expect(url).toContain("estado=PAGADO");
      expect((init as RequestInit).method).toBe("PATCH");
    });
  });

  describe("uploadPagoComprobante", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("lanza error si no hay token", async () => {
      mockGetFreshToken.mockResolvedValue(null);
      const file = new File(["content"], "comprobante.pdf", { type: "application/pdf" });
      await expect(uploadPagoComprobante("pago-1", file)).rejects.toThrow(
        "No hay sesión activa. Inicia sesión de nuevo."
      );
    });

    it("hace POST con FormData cuando hay token", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: true,
        json: vi.fn().mockResolvedValue({ uuidPago: "pago-1" }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["pdf content"], "comprobante.pdf", { type: "application/pdf" });
      const result = await uploadPagoComprobante("pago-1", file);

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/pagos/pago-1/comprobante");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer token-valid");
      expect(result).toEqual({ uuidPago: "pago-1" });
    });

    it("lanza error si el servidor responde con error", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue("Error al subir"),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "file.pdf");
      await expect(uploadPagoComprobante("pago-1", file)).rejects.toThrow("Error al subir");
    });

    it("usa mensaje genérico si el cuerpo del error está vacío", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "file.pdf");
      await expect(uploadPagoComprobante("pago-1", file)).rejects.toThrow(
        "Error al subir el comprobante"
      );
    });

    it("envía comentario como parte del FormData", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: true,
        json: vi.fn().mockResolvedValue({ uuidPago: "pago-1" }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "comprobante.pdf");
      await uploadPagoComprobante("pago-1", file, "Comentario de prueba");

      const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(init.body).toBeInstanceOf(FormData);
      expect((init.body as FormData).get("comentario")).toBe("Comentario de prueba");
    });

    it("extrae mensaje de error desde JSON del backend en upload fallido", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: "Archivo corrupto" })),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "file.pdf");
      await expect(uploadPagoComprobante("pago-1", file)).rejects.toThrow("Archivo corrupto");
    });

    it("extrae mensaje desde campo message en JSON del backend en upload fallido", async () => {
      mockGetFreshToken.mockResolvedValue("token-valid");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ message: "Archivo muy grande" })),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "file.pdf");
      await expect(uploadPagoComprobante("pago-1", file)).rejects.toThrow("Archivo muy grande");
  });
});



});
