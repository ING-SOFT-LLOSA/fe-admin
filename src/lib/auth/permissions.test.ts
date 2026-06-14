import { describe, it, expect } from "vitest";
import { canGestionarUsuarios, canEliminarUsuario } from "./permissions";
import type { PerfilConPermisos } from "@/types/auth";
import type { ClienteRow } from "@/types/user";

describe("Permissions Helpers", () => {
  describe("canGestionarUsuarios", () => {
    it("should return false if profile is null", () => {
      expect(canGestionarUsuarios(null)).toBe(false);
    });

    it("should return true if profile role is ADMIN", () => {
      const adminProfile: PerfilConPermisos = {
        id: 1,
        nombre: "Admin User",
        email: "admin@test.com",
        tipoUsuario: "EMPLEADO",
        rol: "ADMIN",
        activo: true,
        funciones: [],
      };
      expect(canGestionarUsuarios(adminProfile)).toBe(true);
    });

    it("should return true if profile has USER_GESTIONAR function", () => {
      const userProfile: PerfilConPermisos = {
        id: 2,
        nombre: "Manager User",
        email: "manager@test.com",
        tipoUsuario: "EMPLEADO",
        rol: "USER",
        activo: true,
        funciones: ["USER_GESTIONAR"],
      };
      expect(canGestionarUsuarios(userProfile)).toBe(true);
    });

    it("should return false if profile is not ADMIN and lacks USER_GESTIONAR function", () => {
      const userProfile: PerfilConPermisos = {
        id: 3,
        nombre: "Regular User",
        email: "regular@test.com",
        tipoUsuario: "EMPLEADO",
        rol: "USER",
        activo: true,
        funciones: ["OTHER_FUNCTION"],
      };
      expect(canGestionarUsuarios(userProfile)).toBe(false);
    });
  });

  describe("canEliminarUsuario", () => {
    const adminPerfil: PerfilConPermisos = {
      id: 1,
      nombre: "Admin",
      email: "admin@test.com",
      tipoUsuario: "EMPLEADO",
      rol: "ADMIN",
      activo: true,
      funciones: [],
    };

    const regularPerfil: PerfilConPermisos = {
      id: 2,
      nombre: "User",
      email: "user@test.com",
      tipoUsuario: "EMPLEADO",
      rol: "USER",
      activo: true,
      funciones: [],
    };

    const targetUser: ClienteRow = {
      id: 3,
      name: "Target",
      email: "target@test.com",
      tipoUsuario: "CLIENTE",
      rol: "USER",
      initials: "T",
      dni: "12345678",
      phone: "999999999",
      project: "Proyecto A",
      status: "Activo",
      statusBg: "bg-green-100",
    };

    it("should return false if acting profile is null", () => {
      expect(canEliminarUsuario(null, targetUser)).toBe(false);
    });

    it("should return false if acting profile is not ADMIN", () => {
      expect(canEliminarUsuario(regularPerfil, targetUser)).toBe(false);
    });

    it("should return false if acting profile tries to delete themselves", () => {
      const selfTarget: ClienteRow = {
        id: 1,
        name: "Admin Target",
        email: "admin@test.com",
        tipoUsuario: "EMPLEADO",
        rol: "ADMIN",
        initials: "A",
        dni: "87654321",
        phone: "999999999",
        project: "Proyecto B",
        status: "Activo",
        statusBg: "bg-green-100",
      };
      expect(canEliminarUsuario(adminPerfil, selfTarget)).toBe(false);
    });

    it("should return false if target user is an ADMIN", () => {
      const adminTarget: ClienteRow = {
        id: 4,
        name: "Another Admin",
        email: "another-admin@test.com",
        tipoUsuario: "EMPLEADO",
        rol: "ADMIN",
        initials: "AA",
        dni: "11111111",
        phone: "999999999",
        project: "Proyecto C",
        status: "Activo",
        statusBg: "bg-green-100",
      };
      expect(canEliminarUsuario(adminPerfil, adminTarget)).toBe(false);
    });

    it("should return true if acting profile is ADMIN, target is not self, and target is not ADMIN", () => {
      expect(canEliminarUsuario(adminPerfil, targetUser)).toBe(true);
    });
  });
});
