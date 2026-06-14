import { describe, it, expect } from 'vitest'
import { canGestionarUsuarios, canEliminarUsuario } from '../../lib/auth/permissions'
import * as permissionsModule from '../../lib/auth/permissions'
import type { PerfilConPermisos } from '../../types/auth'
import type { ClienteRow } from '../../types/user'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeAdmin = (overrides?: Partial<PerfilConPermisos>): PerfilConPermisos => ({
  id: 1,
  nombre: 'Admin Sistema',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: [],
  ...overrides,
})

const makeEmpleado = (funciones: string[] = [], overrides?: Partial<PerfilConPermisos>): PerfilConPermisos => ({
  id: 2,
  nombre: 'Carlos Pérez',
  email: 'cperez@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'AREA_TECNICA',
  activo: true,
  funciones,
  ...overrides,
})

const makeClienteRow = (overrides?: Partial<ClienteRow>): ClienteRow => ({
  id: 10,
  initials: 'CP',
  name: 'Carlos Perez',
  dni: '12345678',
  email: 'cperez@llosaedificaciones.com',
  phone: '999999999',
  project: 'Aurora',
  status: 'Activo',
  statusBg: 'green',
  tipoUsuario: 'EMPLEADO',
  rol: 'AREA_TECNICA',
  ...overrides,
})

// ─── CP06: Admin puede gestionar usuarios ─────────────────────────────────────

describe('CP06 — canGestionarUsuarios: acceso a módulo de creación de usuarios', () => {
  it('ADMIN puede gestionar usuarios', () => {
    expect(canGestionarUsuarios(makeAdmin())).toBe(true)
  })

  it('empleado con USER_GESTIONAR puede gestionar usuarios', () => {
    expect(canGestionarUsuarios(makeEmpleado(['USER_GESTIONAR']))).toBe(true)
  })

  it('empleado sin USER_GESTIONAR NO puede gestionar usuarios', () => {
    expect(canGestionarUsuarios(makeEmpleado(['OBRA_VER', 'PROYECTO_VER']))).toBe(false)
  })

  it('empleado sin ningún permiso NO puede gestionar usuarios', () => {
    expect(canGestionarUsuarios(makeEmpleado([]))).toBe(false)
  })

  it('perfil null devuelve false (usuario no autenticado)', () => {
    expect(canGestionarUsuarios(null)).toBe(false)
  })

  it('cliente (tipoUsuario CLIENTE) sin USER_GESTIONAR no puede gestionar', () => {
    const cliente = makeEmpleado([], { tipoUsuario: 'CLIENTE', rol: null })
    expect(canGestionarUsuarios(cliente)).toBe(false)
  })
})

// ─── CP05: Admin NO debería ver "Olvidé mi contraseña" ───────────────────────

describe('CP05 — BRECHA: función canRecuperarContrasena no existe en el código', () => {
  it('[BRECHA CP05] canRecuperarContrasena no está definido actualmente en el código', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.canRecuperarContrasena).toBeUndefined()
  })
})

// ─── CP07: Permisos granulares por módulo ────────────────────────────────────

describe('CP07 — Asignación granular de permisos: evaluación de funciones', () => {
  it('permiso USER_GESTIONAR sobrescribe las restricciones del rol base', () => {
    const empleadoConOverride = makeEmpleado(['USER_GESTIONAR'])
    expect(canGestionarUsuarios(empleadoConOverride)).toBe(true)
  })

  it('permiso ROL_GESTIONAR solo NO es suficiente para USER_GESTIONAR', () => {
    const empleadoSoloRol = makeEmpleado(['ROL_GESTIONAR'])
    // canGestionarUsuarios requiere USER_GESTIONAR (no ROL_GESTIONAR)
    expect(canGestionarUsuarios(empleadoSoloRol)).toBe(false)
  })

  it('No existe función saveGranularPermisos en el módulo de permisos', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.saveGranularPermisos).toBeUndefined()
  })
})

// ─── CP08: Desactivar usuario ─────────────────────────────────────────────────

describe('CP08 — canEliminarUsuario: guardas de seguridad para desactivación', () => {
  const admin = makeAdmin()
  const otroAdmin = makeAdmin({ id: 99, email: 'otro@llosaedificaciones.com' })

  it('ADMIN puede eliminar a un empleado que no sea admin', () => {
    const target = makeClienteRow({ id: 10, rol: 'AREA_TECNICA' })
    expect(canEliminarUsuario(admin, target)).toBe(true)
  })

  it('ADMIN NO puede eliminarse a sí mismo', () => {
    const selfTarget = makeClienteRow({ id: admin.id, rol: 'ADMIN' })
    expect(canEliminarUsuario(admin, selfTarget)).toBe(false)
  })

  it('ADMIN NO puede eliminar a otro ADMIN', () => {
    const adminTarget = makeClienteRow({ id: otroAdmin.id, rol: 'ADMIN' })
    expect(canEliminarUsuario(admin, adminTarget)).toBe(false)
  })

  it('empleado sin rol ADMIN NO puede eliminar a nadie', () => {
    const empleado = makeEmpleado(['USER_GESTIONAR'])
    const target = makeClienteRow({ id: 20 })
    expect(canEliminarUsuario(empleado, target)).toBe(false)
  })

  it('perfil null devuelve false', () => {
    const target = makeClienteRow()
    expect(canEliminarUsuario(null, target)).toBe(false)
  })

  it('No existe función canDesactivarUsuario separada — solo canEliminarUsuario', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.canDesactivarUsuario).toBeUndefined()
  })
})

// ─── Autenticación de cliente — CP09/CP10/CP11 (lógica de permisos) ──────────

describe('CP09/CP10/CP11 — BRECHA: no existe lógica de permisos basada en estadoComercial', () => {
  it('[BRECHA CP09] no existe canAccederPortalCompleto(perfil, estadoUnidad)', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.canAccederPortalCompleto).toBeUndefined()
  })

  it('[BRECHA CP10] no existe isClienteActivo(perfil)', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.isClienteActivo).toBeUndefined()
  })

  it('[BRECHA CP11] no existe isModoEspera(estadoUnidad)', () => {
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.isModoEspera).toBeUndefined()
  })
})
