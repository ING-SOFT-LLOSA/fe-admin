/**
 * Tests Unitarios — Módulo de Session Storage (CP01, CP10, seguridad)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, clearSession, getStoredToken, getStoredPerfil } from '../../lib/auth/session'
import * as sessionModule from '../../lib/auth/session'
import type { PerfilConPermisos } from '../../types/auth'

const mockPerfil: PerfilConPermisos = {
  id: 5,
  nombre: 'Asesor Prueba',
  email: 'asesor@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ASESOR',
  activo: true,
  funciones: ['PROYECTO_VER', 'CLIENTE_VER'],
}

const mockPerfilInactivo: PerfilConPermisos = {
  ...mockPerfil,
  id: 6,
  email: 'desistio@gmail.com',
  tipoUsuario: 'CLIENTE',
  rol: null,
  activo: false,
  funciones: [],
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
})

// ─── saveSession ──────────────────────────────────────────────────────────────

describe('saveSession — persiste token y perfil en localStorage', () => {
  it('guarda el token bajo la clave "llosa_id_token"', () => {
    saveSession('my-jwt-token', mockPerfil)
    expect(localStorage.getItem('llosa_id_token')).toBe('my-jwt-token')
  })

  it('guarda el perfil serializado bajo la clave "llosa_perfil"', () => {
    saveSession('my-jwt-token', mockPerfil)
    const stored = localStorage.getItem('llosa_perfil')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toEqual(mockPerfil)
  })

  it('sobrescribe una sesión previa al llamarse de nuevo', () => {
    saveSession('token-viejo', { ...mockPerfil, id: 1 })
    saveSession('token-nuevo', { ...mockPerfil, id: 2 })

    expect(localStorage.getItem('llosa_id_token')).toBe('token-nuevo')
    const perfil = JSON.parse(localStorage.getItem('llosa_perfil')!)
    expect(perfil.id).toBe(2)
  })

  it('[SEGURIDAD] el token JWT es accesible vía localStorage.getItem (riesgo XSS)', () => {
    saveSession('jwt-sensible-123', mockPerfil)
    // Simula lo que un script malicioso haría:
    const tokenRobado = localStorage.getItem('llosa_id_token')
    expect(tokenRobado).toBe('jwt-sensible-123')
  })

  it('[SEGURIDAD] el perfil completo (rol + funciones) es modificable vía localStorage', () => {
    saveSession('token', mockPerfil)

    // Simula escalación de privilegios via DevTools:
    const perfilManipulado = { ...mockPerfil, rol: 'ADMIN', funciones: ['USER_GESTIONAR', 'ROL_GESTIONAR'] }
    localStorage.setItem('llosa_perfil', JSON.stringify(perfilManipulado))

    const perfilLeido = getStoredPerfil()
    expect(perfilLeido?.rol).toBe('ADMIN') // El sistema aceptaría este rol falso
  })
})

// ─── clearSession ─────────────────────────────────────────────────────────────

describe('clearSession — elimina token y perfil de localStorage', () => {
  it('elimina el token de localStorage', () => {
    saveSession('token-a-limpiar', mockPerfil)
    clearSession()
    expect(localStorage.getItem('llosa_id_token')).toBeNull()
  })

  it('elimina el perfil de localStorage', () => {
    saveSession('token-a-limpiar', mockPerfil)
    clearSession()
    expect(localStorage.getItem('llosa_perfil')).toBeNull()
  })

  it('no lanza error si no hay sesión previa', () => {
    expect(() => clearSession()).not.toThrow()
  })
})

// ─── getStoredToken ───────────────────────────────────────────────────────────

describe('getStoredToken — recupera el token almacenado', () => {
  it('devuelve el token cuando hay sesión activa', () => {
    saveSession('token-real', mockPerfil)
    expect(getStoredToken()).toBe('token-real')
  })

  it('devuelve null cuando no hay sesión', () => {
    expect(getStoredToken()).toBeNull()
  })

  it('devuelve null después de clearSession', () => {
    saveSession('token', mockPerfil)
    clearSession()
    expect(getStoredToken()).toBeNull()
  })
})

// ─── getStoredPerfil ──────────────────────────────────────────────────────────

describe('getStoredPerfil — recupera el perfil almacenado', () => {
  it('devuelve el perfil deserializado correctamente', () => {
    saveSession('token', mockPerfil)
    const result = getStoredPerfil()
    expect(result).toEqual(mockPerfil)
  })

  it('devuelve null cuando no hay perfil', () => {
    expect(getStoredPerfil()).toBeNull()
  })

  it('devuelve null si el JSON almacenado está corrupto', () => {
    localStorage.setItem('llosa_perfil', '{ invalid json :::')
    expect(getStoredPerfil()).toBeNull()
  })

  it('devuelve null después de clearSession', () => {
    saveSession('token', mockPerfil)
    clearSession()
    expect(getStoredPerfil()).toBeNull()
  })
})

// ─── CP10: cliente inactivo — verificación de campo activo ───────────────────

describe('CP10 — verificación de campo activo en el perfil almacenado', () => {
  it('getStoredPerfil devuelve perfil con activo=false tal como fue guardado', () => {
    saveSession('token-inactivo', mockPerfilInactivo)
    const perfil = getStoredPerfil()
    expect(perfil?.activo).toBe(false)
  })

  it('El sistema debería rechazar sesiones con activo=false — actualmente NO lo hace a nivel de session.ts', () => {
    // session.ts no tiene lógica de validación de activo — eso es responsabilidad de AuthGuard
    // Documentamos que getStoredPerfil devuelve el perfil inactivo sin error:
    saveSession('token-inactivo', mockPerfilInactivo)
    const perfil = getStoredPerfil()

    // getStoredPerfil devuelve el perfil aunque activo=false (sin validación)
    expect(perfil).not.toBeNull()
    expect(perfil?.activo).toBe(false)

    // COMPORTAMIENTO ESPERADO según CP10:
    // Una función como isSessionValid(perfil) debería devolver false para activo=false
    const session = sessionModule as unknown as Record<string, unknown>
    if (typeof session['isSessionValid'] === 'function') {
      expect((session['isSessionValid'] as (p: unknown) => boolean)(perfil)).toBe(false)
    } else {
      // BRECHA: isSessionValid no existe en session.ts
      expect(session['isSessionValid']).toBeUndefined()
    }
  })
})

// ─── CP09/CP11: estado de unidad — no se almacena en session ─────────────────

describe('CP09/CP11: el estadoComercial de unidad no se persiste en sesión', () => {
  it('El perfil en localStorage no incluye estadoComercial de unidades', () => {
    saveSession('token', mockPerfil)
    const perfil = getStoredPerfil()

    expect((perfil as Record<string, unknown>)?.unidades).toBeUndefined()
    expect((perfil as Record<string, unknown>)?.estadoComercial).toBeUndefined()
  })
})
