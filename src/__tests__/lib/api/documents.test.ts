/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  getStoredToken: vi.fn(),
  getFreshToken: vi.fn(),
}));

import { apiFetch } from "@/lib/api/http";
import { getFreshToken } from "@/lib/auth/session";
import {
  uploadDocument,
  uploadDocumentExplicito,
  fetchDocumentosByReferencia,
  fetchSignedUrl,
  deleteDocumento,
} from '@/lib/api/documents';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetFreshToken = vi.mocked(getFreshToken);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
  mockGetFreshToken.mockResolvedValue("token-test");
});

describe("documents API", () => {
  describe("uploadDocument", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("lanza error si no hay token", async () => {
      mockGetFreshToken.mockResolvedValue(null);
      const file = new File(["content"], "doc.pdf");
      await expect(uploadDocument("ref-1", file, "PDF_LEGAL")).rejects.toThrow(
        "No hay sesión activa. Inicia sesión de nuevo."
      );
    });

    it("hace POST con FormData al endpoint correcto", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: "doc-1" }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
      const result = await uploadDocument("ref-1", file, "PDF_LEGAL");

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/documentos/ref-1");
      expect(init.method).toBe("POST");
      expect(result).toEqual({ id: "doc-1" });
    });

    it("lanza error si el servidor responde con error", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue("Error al subir"),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadDocument("ref-1", file, "PDF_LEGAL")).rejects.toThrow("Error al subir");
    });

    it("usa mensaje genérico si el error está vacío", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadDocument("ref-1", file, "PDF_LEGAL")).rejects.toThrow(
        "Error al subir el documento"
      );
    });

    it("extrae mensaje de error desde JSON del backend", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: "Archivo demasiado grande" })),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadDocument("ref-1", file, "PDF_LEGAL")).rejects.toThrow(
        "Archivo demasiado grande"
      );
    });
  });

  describe("uploadDocumentExplicito", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("lanza error si no hay token", async () => {
      mockGetFreshToken.mockResolvedValue(null);
      const file = new File(["content"], "doc.pdf");
      await expect(
        uploadDocumentExplicito("ref-1", file, "PDF_LEGAL", "REPORTE")
      ).rejects.toThrow("No hay sesión activa. Inicia sesión de nuevo.");
    });

    it("hace POST al endpoint explícito con los parámetros correctos", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: "doc-2" }),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "foto.jpg", { type: "image/jpeg" });
      await uploadDocumentExplicito("ref-2", file, "FOTO_OBRA", "REPORTE");

      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/documentos/explicito");
      expect(url).toContain("entidad=REPORTE");
      expect(url).toContain("idReferencia=ref-2");
    });

    it("lanza error si el servidor responde con texto de error", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue("Error del servidor"),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(
        uploadDocumentExplicito("ref-1", file, "PDF_LEGAL", "REPORTE")
      ).rejects.toThrow("Error del servidor");
    });

    it("usa mensaje genérico si el error de upload explícito está vacío", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(
        uploadDocumentExplicito("ref-1", file, "PDF_LEGAL", "REPORTE")
      ).rejects.toThrow("Error al subir el documento");
    });

    it("extrae mensaje de error desde JSON del backend en upload explícito", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ message: "Formato no soportado" })),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(
        uploadDocumentExplicito("ref-1", file, "PDF_LEGAL", "REPORTE")
      ).rejects.toThrow("Formato no soportado");
    });
  });

  describe("fetchDocumentosByReferencia", () => {
    it("llama a /api/documentos/{id} sin filtros opcionales", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchDocumentosByReferencia("ref-1");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/documentos/ref-1");
    });

    it("incluye tipoDocumento en query params cuando se pasa", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchDocumentosByReferencia("ref-1", "PDF_LEGAL");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("tipoDocumento=PDF_LEGAL");
    });

    it("incluye entidadReferencia en query params cuando se pasa", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchDocumentosByReferencia("ref-1", undefined, "REPORTE");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("entidadReferencia=REPORTE");
    });

    it("incluye ambos filtros cuando se pasan", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchDocumentosByReferencia("ref-1", "COMPROBANTE", "PAGO");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("tipoDocumento=COMPROBANTE");
      expect(url).toContain("entidadReferencia=PAGO");
    });
  });

  describe("fetchSignedUrl", () => {
    it("llama a /api/documentos/{id}/signed-url", async () => {
      mockApiFetch.mockResolvedValue({ url: "https://cdn.example.com/doc", expiracion: "2026-12-31" });
      const result = await fetchSignedUrl("doc-1");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/documentos/doc-1/signed-url");
      expect(result).toEqual({ url: "https://cdn.example.com/doc", expiracion: "2026-12-31" });
    });
  });

  describe("deleteDocumento", () => {
    it("hace DELETE a /api/documentos/{id}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteDocumento("doc-2");
      expect(mockApiFetch).toHaveBeenCalledWith("/api/documentos/doc-2", { method: "DELETE" });
    });
  });
});
