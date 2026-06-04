/**
 * Tests Unitarios — Módulo de Permisos RBAC (CP05, CP06, CP07, CP08)
 *
 * OBJETIVO: verificar que el sistema funciona correctamente.
 * Un test que FALLA indica un BUG en el código fuente, no en el test.
 *
 * Hallazgos clave del análisis de código:
 * - canGestionarUsuarios(): implementado correctamente (ADMIN | USER_GESTIONAR) — CP06 OK
 * - canEliminarUsuario(): implementado, protege contra auto-eliminación y entre admins — CP08 parcial
 * - BRECHA CP05: No existe canRecuperarContrasena() — el botón "Olvidé mi contraseña"
 *   se muestra a todos los roles incluyendo ADMIN
 * - BRECHA CP07: Los permisos granulares son de solo lectura en la UI — no hay guardado
 */

import { describe, it, expect } from 'vitest'
import { canGestionarUsuarios, canEliminarUsuario } from '@/lib/auth/permissions'
import * as permissionsModule from '@/lib/auth/permissions'
import type { PerfilConPermisos } from '@/types/auth'
import type { ClienteRow } from '@/types/user'

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
  /**
   * BUG DETECTADO (CP05): No existe ninguna función canRecuperarContrasena()
   * en src/lib/auth/permissions.ts. El botón "¿Olvidaste tu contraseña?"
   * en LoginForm.tsx se renderiza sin condicional de rol.
   *
   * Este describe documenta la brecha. El test falla porque la función no existe.
   */

  it('[BRECHA CP05] canRecuperarContrasena debería devolver false para ADMIN', () => {
    // BRECHA: esta función no existe en src/lib/auth/permissions.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>

    expect(permissions.canRecuperarContrasena).toBeDefined()
    expect(permissions.canRecuperarContrasena(makeAdmin())).toBe(false)
  })

  it('[BRECHA CP05] canRecuperarContrasena debería devolver true para rol ASESOR', () => {
    // BRECHA: esta función no existe en src/lib/auth/permissions.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>
    const asesor = makeEmpleado([], { rol: 'ASESOR' })

    expect(permissions.canRecuperarContrasena).toBeDefined()
    expect(permissions.canRecuperarContrasena(asesor)).toBe(true)
  })
})

// ─── CP07: Permisos granulares por módulo ────────────────────────────────────

describe('CP07 — Asignación granular de permisos: evaluación de funciones', () => {
  /**
   * La UI muestra checkboxes de permisos (readOnly). No hay función
   * saveGranularPermisos() en el frontend — esto es una BRECHA de CP07.
   * Lo que SÍ existe es la evaluación de funciones en canGestionarUsuarios.
   * Documentamos el comportamiento esperado de evaluación de permisos.
   */

  it('permiso USER_GESTIONAR sobrescribe las restricciones del rol base', () => {
    const empleadoConOverride = makeEmpleado(['USER_GESTIONAR'])
    expect(canGestionarUsuarios(empleadoConOverride)).toBe(true)
  })

  it('permiso ROL_GESTIONAR solo NO es suficiente para USER_GESTIONAR', () => {
    const empleadoSoloRol = makeEmpleado(['ROL_GESTIONAR'])
    // canGestionarUsuarios requiere USER_GESTIONAR (no ROL_GESTIONAR)
    expect(canGestionarUsuarios(empleadoSoloRol)).toBe(false)
  })

  it('[BRECHA CP07] no existe función saveGranularPermisos en el módulo de permisos', () => {
    // BRECHA: el guardado de permisos individuales no está implementado en el frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('[BRECHA CP08] no existe función canDesactivarUsuario separada — solo canEliminarUsuario', () => {
    /**
     * CP08 habla de "desactivar" (estado Inactivo), pero la función disponible
     * es canEliminarUsuario que apunta al endpoint DELETE /api/users/:id/hard.
     * No hay distinción entre "desactivar" (soft) y "eliminar" (hard) en permissions.ts.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.canDesactivarUsuario).toBeUndefined()
  })
})

// ─── Autenticación de cliente — CP09/CP10/CP11 (lógica de permisos) ──────────

describe('CP09/CP10/CP11 — BRECHA: no existe lógica de permisos basada en estadoComercial', () => {
  /**
   * BUG DETECTADO (CP09-CP11): No existe ninguna función en permissions.ts
   * que evalúe el estado de la unidad del cliente (Vendido/Inactivo/Separado)
   * para determinar el nivel de acceso al portal.
   */

  it('[BRECHA CP09] no existe canAccederPortalCompleto(perfil, estadoUnidad)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.canAccederPortalCompleto).toBeUndefined()
  })

  it('[BRECHA CP10] no existe isClienteActivo(perfil)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.isClienteActivo).toBeUndefined()
  })

  it('[BRECHA CP11] no existe isModoEspera(estadoUnidad)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = permissionsModule as unknown as Record<string, unknown>
    expect(permissions.isModoEspera).toBeUndefined()
  })
})
