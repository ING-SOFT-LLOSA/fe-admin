import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError } from '@/lib/api/http';

vi.mock("@/lib/auth/session", () => ({
  getFreshToken: vi.fn(),
  clearSession: vi.fn(),
}));

import { getFreshToken, clearSession } from "@/lib/auth/session";

const mockGetFreshToken = vi.mocked(getFreshToken);
const mockClearSession = vi.mocked(clearSession);

async function importApiFetch() {
  const mod = await import("@/lib/api/http");
  return mod.apiFetch;
}

describe("ApiError", () => {
  it("tiene name, status y path correctos", () => {
    const err = new ApiError("Error de prueba", 404, "/api/test");
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Error de prueba");
    expect(err.status).toBe(404);
    expect(err.path).toBe("/api/test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  it("es instancia de Error", () => {
    const err = new ApiError("msg", 500, "/");
    expect(err instanceof Error).toBe(true);
  });
});

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("lanza error si no hay token", async () => {
    mockGetFreshToken.mockResolvedValue(null);
    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/test")).rejects.toThrow(
      "No hay sesión activa. Inicia sesión de nuevo."
    );
  });

  it("hace fetch con Authorization header correcto", async () => {
    mockGetFreshToken.mockResolvedValue("token-123");
    const mockRes = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ data: "value" })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    const result = await apiFetch("/api/test");

    expect(global.fetch).toHaveBeenCalledOnce();
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(result).toEqual({ data: "value" });
  });

  it("retorna undefined en respuesta 204", async () => {
    mockGetFreshToken.mockResolvedValue("token-abc");
    const mockRes = { ok: true, status: 204, text: vi.fn() };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    const result = await apiFetch("/api/noop");
    expect(result).toBeUndefined();
  });

  it("retorna undefined si el cuerpo está vacío", async () => {
    mockGetFreshToken.mockResolvedValue("token-abc");
    const mockRes = { ok: true, status: 200, text: vi.fn().mockResolvedValue("") };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    const result = await apiFetch("/api/empty");
    expect(result).toBeUndefined();
  });

  it("retorna texto plano si el body no es JSON", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("plain text response"),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    const result = await apiFetch<string>("/api/plain");
    expect(result).toBe("plain text response");
  });

  it("lanza ApiError 401 y llama clearSession", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/protected")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(mockClearSession).toHaveBeenCalledOnce();
  });

  it("lanza ApiError 403 con mensaje genérico si el body está vacío", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue(""),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/forbidden")).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("No tienes permisos"),
    });
  });

  it("lanza ApiError 403 con mensaje del backend si viene en JSON", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: "Acceso denegado" })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/forbidden")).rejects.toMatchObject({
      status: 403,
      message: "Acceso denegado",
    });
  });

  it("lanza ApiError genérico para otros status de error", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal Server Error"),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/crash")).rejects.toMatchObject({
      status: 500,
      message: "Internal Server Error",
    });
  });

  it("parsea mensaje de error desde campo 'message' en JSON del backend", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 422,
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: "Dato inválido" })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/validate")).rejects.toMatchObject({
      message: "Dato inválido",
    });
  });

  it("incluye cache: no-store en el request", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("{}"),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await apiFetch("/api/test");
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.cache).toBe("no-store");
  });

  it("lanza ApiError genérico con body vacío — usa el fallback", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(""),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/crash")).rejects.toMatchObject({
      status: 500,
      message: "Error 500 en /api/crash",
    });
  });

  it("lanza ApiError con body JSON sin campos error ni message — usa texto crudo", async () => {
    mockGetFreshToken.mockResolvedValue("token");
    const mockRes = {
      ok: false,
      status: 422,
      text: vi.fn().mockResolvedValue(JSON.stringify({ code: "BAD_DATA" })),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    const apiFetch = await importApiFetch();
    await expect(apiFetch("/api/validate")).rejects.toMatchObject({
      status: 422,
      message: JSON.stringify({ code: "BAD_DATA" }),
    });
  });
});
