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
  fetchStageDocuments,
  uploadRequisitoArchivo,
  deleteRequisitoArchivo,
  createRequisito,
  updateRequisito,
  deleteRequisito,
} from '@/lib/api/requisitos';

const mockApiFetch = vi.mocked(apiFetch);
const mockGetFreshToken = vi.mocked(getFreshToken);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
  mockGetFreshToken.mockResolvedValue("token-test");
});

describe("requisitos API", () => {
  describe("fetchStageDocuments", () => {
    it("llama al endpoint con etapa y uuidUsuarioActivo", async () => {
      mockApiFetch.mockResolvedValue({ title: "Separación", totalCount: 3, documents: [] });
      await fetchStageDocuments("SEPARACION", "ua-uuid-1");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("/api/stage/SEPARACION/documents");
      expect(url).toContain("uuidUsuarioActivo=ua-uuid-1");
    });
  });

  describe("uploadRequisitoArchivo", () => {
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
      await expect(uploadRequisitoArchivo("req-1", file)).rejects.toThrow(
        "No hay sesión activa. Inicia sesión de nuevo."
      );
    });

    it("hace POST con FormData cuando hay token", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = { ok: true };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await uploadRequisitoArchivo("req-1", file);

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/requisitos-documentales/req-1/upload");
      expect(init.method).toBe("POST");
    });

    it("lanza error si la respuesta no es ok", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = { ok: false, text: vi.fn().mockResolvedValue("Error del servidor") };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadRequisitoArchivo("req-1", file)).rejects.toThrow("Error del servidor");
    });

    it("usa mensaje genérico si el cuerpo de error está vacío", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = { ok: false, text: vi.fn().mockResolvedValue("") };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadRequisitoArchivo("req-1", file)).rejects.toThrow(
        "Error al subir el archivo del requisito"
      );
    });

    it("extrae mensaje de error desde JSON", async () => {
      mockGetFreshToken.mockResolvedValue("token-ok");
      const mockRes = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: "Archivo inválido" })),
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

      const file = new File(["content"], "doc.pdf");
      await expect(uploadRequisitoArchivo("req-1", file)).rejects.toThrow("Archivo inválido");
    });
  });

  describe("deleteRequisitoArchivo", () => {
    it("hace DELETE al endpoint de upload", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteRequisitoArchivo("req-2");
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/requisitos-documentales/req-2/upload",
        { method: "DELETE" }
      );
    });
  });

  describe("createRequisito", () => {
    it("hace POST a /api/requisitos-documentales", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await createRequisito({
        etapaProcesoCompraId: "etapa-1",
        titulo: "DNI del cliente",
        descripcion: "Copia del DNI",
      });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/requisitos-documentales");
      expect((init as RequestInit).method).toBe("POST");
      expect((init as RequestInit).body).toContain('"titulo":"DNI del cliente"');
    });
  });

  describe("updateRequisito", () => {
    it("hace PUT a /api/requisitos-documentales/{id}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await updateRequisito("req-3", { titulo: "Título actualizado" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/requisitos-documentales/req-3");
      expect((init as RequestInit).method).toBe("PUT");
    });
  });

  describe("deleteRequisito", () => {
    it("hace DELETE a /api/requisitos-documentales/{id}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await deleteRequisito("req-4");
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/requisitos-documentales/req-4",
        { method: "DELETE" }
      );
    });
  });
});
