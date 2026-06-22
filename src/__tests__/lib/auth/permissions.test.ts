import { describe, it, expect } from "vitest";
import { canGestionarUsuarios, canEliminarUsuario } from '@/lib/auth/permissions';
import * as permissionsModule from '@/lib/auth/permissions';
import type { PerfilConPermisos } from "@/types/auth";
import type { ClienteRow } from "@/types/user";

const makeAdmin = (overrides?: Partial<PerfilConPermisos>): PerfilConPermisos => ({
  id: 1,
  nombre: "Admin Sistema",
  email: "admin@llosaedificaciones.com",
  tipoUsuario: "EMPLEADO",
  rol: "ADMIN",
  activo: true,
  funciones: [],
  ...overrides,
});

const makeEmpleado = (funciones: string[] = [], overrides?: Partial<PerfilConPermisos>): PerfilConPermisos => ({
  id: 2,
  nombre: "Carlos Pérez",
  email: "cperez@llosaedificaciones.com",
  tipoUsuario: "EMPLEADO",
  rol: "AREA_TECNICA",
  activo: true,
  funciones,
  ...overrides,
});

const makeClienteRow = (overrides?: Partial<ClienteRow>): ClienteRow => ({
  id: 10,
  initials: "CP",
  name: "Carlos Perez",
  dni: "12345678",
  email: "cperez@llosaedificaciones.com",
  phone: "999999999",
  project: "Aurora",
  status: "Activo",
  statusBg: "green",
  tipoUsuario: "EMPLEADO",
  rol: "AREA_TECNICA",
  ...overrides,
});

describe("canGestionarUsuarios", () => {
  it("ADMIN puede gestionar usuarios", () => {
    expect(canGestionarUsuarios(makeAdmin())).toBe(true);
  });

  it("empleado con USER_GESTIONAR puede gestionar usuarios", () => {
    expect(canGestionarUsuarios(makeEmpleado(["USER_GESTIONAR"]))).toBe(true);
  });

  it("empleado sin USER_GESTIONAR NO puede gestionar usuarios", () => {
    expect(canGestionarUsuarios(makeEmpleado(["OBRA_VER", "PROYECTO_VER"]))).toBe(false);
  });

  it("empleado sin ningún permiso NO puede gestionar usuarios", () => {
    expect(canGestionarUsuarios(makeEmpleado([]))).toBe(false);
  });

  it("perfil null devuelve false (usuario no autenticado)", () => {
    expect(canGestionarUsuarios(null)).toBe(false);
  });

  it("cliente (tipoUsuario CLIENTE) sin USER_GESTIONAR no puede gestionar", () => {
    const cliente = makeEmpleado([], { tipoUsuario: "CLIENTE", rol: null as any });
    expect(canGestionarUsuarios(cliente)).toBe(false);
  });

  it("permiso USER_GESTIONAR sobrescribe las restricciones del rol base", () => {
    const empleadoConOverride = makeEmpleado(["USER_GESTIONAR"]);
    expect(canGestionarUsuarios(empleadoConOverride)).toBe(true);
  });

  it("permiso ROL_GESTIONAR solo NO es suficiente para gestionar usuarios", () => {
    const empleadoSoloRol = makeEmpleado(["ROL_GESTIONAR"]);
    expect(canGestionarUsuarios(empleadoSoloRol)).toBe(false);
  });
});

describe("canEliminarUsuario", () => {
  const admin = makeAdmin();
  const otroAdmin = makeAdmin({ id: 99, email: "otro@llosaedificaciones.com" });

  it("ADMIN puede eliminar a un empleado que no sea admin", () => {
    const target = makeClienteRow({ id: 10, rol: "AREA_TECNICA" });
    expect(canEliminarUsuario(admin, target)).toBe(true);
  });

  it("ADMIN NO puede eliminarse a sí mismo", () => {
    const selfTarget = makeClienteRow({ id: admin.id, rol: "ADMIN" });
    expect(canEliminarUsuario(admin, selfTarget)).toBe(false);
  });

  it("ADMIN NO puede eliminar a otro ADMIN", () => {
    const adminTarget = makeClienteRow({ id: otroAdmin.id, rol: "ADMIN" });
    expect(canEliminarUsuario(admin, adminTarget)).toBe(false);
  });

  it("empleado sin rol ADMIN NO puede eliminar a nadie", () => {
    const empleado = makeEmpleado(["USER_GESTIONAR"]);
    const target = makeClienteRow({ id: 20 });
    expect(canEliminarUsuario(empleado, target)).toBe(false);
  });

  it("perfil null devuelve false", () => {
    const target = makeClienteRow();
    expect(canEliminarUsuario(null, target)).toBe(false);
  });
});

describe("brechas de funcionalidad pendiente", () => {
  const permissions = permissionsModule as unknown as Record<string, unknown>;

  it("canRecuperarContrasena no está definido en el módulo de permisos", () => {
    expect(permissions.canRecuperarContrasena).toBeUndefined();
  });

  it("saveGranularPermisos no está definido en el módulo de permisos", () => {
    expect(permissions.saveGranularPermisos).toBeUndefined();
  });

  it("canDesactivarUsuario no está definido — solo existe canEliminarUsuario", () => {
    expect(permissions.canDesactivarUsuario).toBeUndefined();
  });

  it("canAccederPortalCompleto no está definido", () => {
    expect(permissions.canAccederPortalCompleto).toBeUndefined();
  });

  it("isClienteActivo no está definido", () => {
    expect(permissions.isClienteActivo).toBeUndefined();
  });

  it("isModoEspera no está definido", () => {
    expect(permissions.isModoEspera).toBeUndefined();
  });
});
