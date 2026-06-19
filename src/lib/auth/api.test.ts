import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPerfil } from "./api";

describe("fetchPerfil", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("retorna el perfil cuando la respuesta es ok", async () => {
    const mockPerfil = { id: 1, nombre: "Admin", email: "admin@empresa.com", rol: "ADMIN", tipoUsuario: "EMPLEADO", activo: true, funciones: [] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPerfil),
    });

    const result = await fetchPerfil("token-valid");
    expect(result).toEqual(mockPerfil);
    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/auth/me");
    expect(init.headers.Authorization).toBe("Bearer token-valid");
  });

  it("lanza error genérico para respuestas de error no especificadas", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal Server Error"),
    });

    await expect(fetchPerfil("token-bad")).rejects.toThrow("Internal Server Error");
  });

  it("lanza error 503 con mensaje descriptivo del backend", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: "Firebase no configurado" })),
    });

    await expect(fetchPerfil("token")).rejects.toThrow("Firebase no configurado");
  });

  it("lanza mensaje genérico de 503 si el body está vacío", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue(""),
    });

    await expect(fetchPerfil("token")).rejects.toThrow("El backend no tiene configurado Firebase");
  });

  it("lanza error 403 con mensaje de cuenta inactiva para respuesta genérica", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Forbidden"),
    });

    await expect(fetchPerfil("token")).rejects.toThrow(
      "Tu cuenta de usuario está inactiva o deshabilitada"
    );
  });

  it("lanza error 403 con mensaje específico del backend cuando no es genérico", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: "Dominio no autorizado" })),
    });

    await expect(fetchPerfil("token")).rejects.toThrow("Dominio no autorizado");
  });

  it("usa mensaje por defecto cuando el cuerpo de error está vacío", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue(""),
    });

    await expect(fetchPerfil("token")).rejects.toThrow("No se pudo cargar el perfil (404)");
  });

  it("parsea el campo 'error' del JSON del backend", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: "Parámetro inválido" })),
    });

    await expect(fetchPerfil("token")).rejects.toThrow("Parámetro inválido");
  });

  it("usa mensaje del JSON cuando no tiene error ni message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(JSON.stringify({ code: 500 })),
    });

    await expect(fetchPerfil("token")).rejects.toThrow(JSON.stringify({ code: 500 }));
  });
});
