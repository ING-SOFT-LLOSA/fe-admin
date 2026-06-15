import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, clearSession, getStoredToken } from '../../lib/auth/session'
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

beforeEach(() => {
  // Limpiar cookies antes de cada test
  document.cookie = "llosa_id_token=; path=/; max-age=0; SameSite=Lax";
})

describe('saveSession — persiste token en Cookies', () => {
  it('guarda el token bajo la clave cookie "llosa_id_token"', () => {
    saveSession('my-jwt-token', mockPerfil)
    expect(document.cookie).toContain('llosa_id_token=my-jwt-token')
  })

  it('sobrescribe un token previo al llamarse de nuevo', () => {
    saveSession('token-viejo', mockPerfil)
    saveSession('token-nuevo', mockPerfil)
    expect(document.cookie).toContain('llosa_id_token=token-nuevo')
  })
})

describe('clearSession — elimina token de Cookies', () => {
  it('elimina el token de cookies', () => {
    saveSession('token-a-limpiar', mockPerfil)
    clearSession()
    expect(getStoredToken()).toBeNull()
  })

  it('no lanza error si no hay sesión previa', () => {
    expect(() => clearSession()).not.toThrow()
  })
})

describe('getStoredToken — recupera el token almacenado en Cookies', () => {
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
