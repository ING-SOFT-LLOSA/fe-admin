/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api/http";
import {
  fetchUsuarios,
  fetchUsuarioPorId,
  fetchUsuariosPaginado,
  registerCliente,
  updateCliente,
  registerEmpleado,
  asignarRol,
  fetchRoles,
  desactivarUsuario,
  eliminarUsuarioCompleto,
  mapUsuarioToClienteRow,
  fetchExpedientesPorUsuario,
  unlinkAssignment,
} from "./users";
import type { Usuario } from "@/types/user";

const mockApiFetch = vi.mocked(apiFetch);

function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    nombre: "Juan",
    apellidos: "Pérez",
    email: "juan@empresa.com",
    tipoUsuario: "CLIENTE",
    rol: "USER",
    activo: true,
    telefono: "999888777",
    documentoIdentidad: "12345678",
    createdAt: "2026-01-01",
    funciones: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockResolvedValue(undefined as any);
});

describe("users API", () => {
  describe("fetchUsuarios", () => {
    it("llama a /api/users", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchUsuarios();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users");
    });
  });

  describe("fetchUsuarioPorId", () => {
    it("llama a /api/users/{id}", async () => {
      mockApiFetch.mockResolvedValue(makeUsuario());
      await fetchUsuarioPorId(5);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/5");
    });
  });

  describe("fetchUsuariosPaginado", () => {
    it("llama con page, size y search codificado por defecto", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchUsuariosPaginado();
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("page=0");
      expect(url).toContain("size=10");
      expect(url).toContain("search=");
    });

    it("incluye los parámetros personalizados", async () => {
      mockApiFetch.mockResolvedValue({ content: [], totalElements: 0 });
      await fetchUsuariosPaginado(2, 20, "Ana García");
      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("size=20");
      expect(url).toContain("Ana");
    });
  });

  describe("registerCliente", () => {
    it("hace POST a /api/users/register con el payload", async () => {
      const payload = {
        nombre: "María",
        apellidos: "López",
        email: "maria@test.com",
        tipoUsuario: "CLIENTE" as const,
      };
      mockApiFetch.mockResolvedValue({ id: 2, ...payload, activo: true, rol: null, funciones: [] });
      await registerCliente(payload);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/users/register");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("updateCliente", () => {
    it("hace PATCH a /api/users/{id}", async () => {
      mockApiFetch.mockResolvedValue(makeUsuario({ nombre: "Actualizado" }));
      await updateCliente(1, { nombre: "Actualizado" });
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/users/1");
      expect((init as RequestInit).method).toBe("PATCH");
    });
  });

  describe("registerEmpleado", () => {
    it("hace POST a /api/users/register con payload de empleado", async () => {
      const payload = {
        nombre: "Pedro",
        apellidos: "Sánchez",
        email: "pedro@empresa.com",
        tipoUsuario: "EMPLEADO" as const,
        idRol: 3,
      };
      mockApiFetch.mockResolvedValue({ id: 3, ...payload, activo: true, rol: "VENDEDOR", funciones: [] });
      await registerEmpleado(payload);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/users/register");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  describe("asignarRol", () => {
    it("hace PUT a /api/users/{id}/role con el idRol", async () => {
      mockApiFetch.mockResolvedValue(makeUsuario({ rol: "ADMIN" }));
      await asignarRol(1, 2);
      const [url, init] = mockApiFetch.mock.calls[0];
      expect(url).toBe("/api/users/1/role");
      expect((init as RequestInit).method).toBe("PUT");
      expect((init as RequestInit).body).toContain('"idRol":2');
    });
  });

  describe("fetchRoles", () => {
    it("llama a /api/roles", async () => {
      mockApiFetch.mockResolvedValue([]);
      await fetchRoles();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/roles");
    });
  });

  describe("desactivarUsuario", () => {
    it("hace DELETE a /api/users/{id}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await desactivarUsuario(7);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/7", { method: "DELETE" });
    });
  });

  describe("eliminarUsuarioCompleto", () => {
    it("hace DELETE a /api/users/{id}/hard", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await eliminarUsuarioCompleto(8);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/users/8/hard", { method: "DELETE" });
    });
  });

  describe("unlinkAssignment", () => {
    it("hace DELETE a /api/expedientes/delete/{uuid}", async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await unlinkAssignment("exp-uuid-1");
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/expedientes/delete/exp-uuid-1",
        { method: "DELETE" }
      );
    });
  });

  describe("fetchExpedientesPorUsuario", () => {
    it("llama a /api/expedientes/{idUsuario} y mapea activo", async () => {
      const raw = [
        {
          uuidUsuarioActivo: "ua-1",
          tipoFinanciamiento: "Directo",
          activos: [{ id: "act-1", nro: "101" }],
          activo: null,
          clientes: [],
          fechaAdquisicion: null,
          createdAt: null,
          updatedAt: null,
          vigente: true,
        },
      ];
      mockApiFetch.mockResolvedValue(raw);
      const result = await fetchExpedientesPorUsuario(10);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/expedientes/10");
      expect(result[0].activo).toEqual({ id: "act-1", nro: "101" });
    });
  });
});

describe("mapUsuarioToClienteRow", () => {
  it("mapea un usuario activo correctamente", () => {
    const usuario = makeUsuario({ activo: true, nombre: "Ana", apellidos: "Gómez" });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.id).toBe(1);
    expect(row.name).toBe("Ana Gómez");
    expect(row.initials).toBe("AG");
    expect(row.status).toBe("ACTIVO");
    expect(row.email).toBe("juan@empresa.com");
  });

  it("mapea un usuario inactivo con status INACTIVO", () => {
    const usuario = makeUsuario({ activo: false });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.status).toBe("INACTIVO");
  });

  it("usa '—' cuando no hay teléfono ni DNI", () => {
    const usuario = makeUsuario({ telefono: undefined, documentoIdentidad: undefined });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.phone).toBe("—");
    expect(row.dni).toBe("—");
  });

  it("genera iniciales usando segunda letra del nombre si apellidos es null", () => {
    const usuario = makeUsuario({ nombre: "Pablo", apellidos: null as any });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.initials).toBe("PA");
  });

  it("usa rol del usuario o 'Empleado' por defecto", () => {
    const usuario = makeUsuario({ rol: null });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.rol).toBe("Empleado");
  });

  it("filtra apellidos vacíos en el nombre completo", () => {
    const usuario = makeUsuario({ apellidos: "" });
    const row = mapUsuarioToClienteRow(usuario);
    expect(row.name).toBe("Juan");
  });
});
