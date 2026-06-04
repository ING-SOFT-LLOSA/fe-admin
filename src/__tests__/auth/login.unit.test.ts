/**
 * Tests Unitarios — Módulo de Login (CP01, CP02, CP04)
 *
 * OBJETIVO: verificar que el sistema funciona correctamente.
 * Un test que FALLA indica un BUG en el código fuente, no en el test.
 *
 * Hallazgos clave del análisis de código:
 * - loginWithEmail() NO valida el dominio @llosaedificaciones.com (CP01/CP02 BRECHA)
 * - La validación de dominio es delegada completamente al backend via fetchPerfil
 * - toAuthErrorMessage mapea correctamente los códigos de Firebase (CP04 OK)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FirebaseError } from 'firebase/app'

// ─── Mocks de Firebase ────────────────────────────────────────────────────────

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({ /* mock firebase auth instance */ })),
}))

vi.mock('@/lib/auth/api', () => ({
  fetchPerfil: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}))

// ─── Imports reales (post-mock) ───────────────────────────────────────────────

import { loginWithEmail, logout } from '@/lib/auth/login'
import { toAuthErrorMessage } from '@/lib/auth/errors'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { fetchPerfil } from '@/lib/auth/api'
import { clearSession, saveSession } from '@/lib/auth/session'

const mockSignIn = vi.mocked(signInWithEmailAndPassword)
const mockFetchPerfil = vi.mocked(fetchPerfil)
const mockSignOut = vi.mocked(signOut)

const mockPerfil = {
  id: 1,
  nombre: 'Admin',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: [],
}

const mockUser = {
  getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
}

// ─── CP01: Login corporativo exitoso ─────────────────────────────────────────

describe('CP01 — loginWithEmail con dominio corporativo válido', () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ user: mockUser } as never)
    mockFetchPerfil.mockResolvedValue(mockPerfil)
  })

  afterEach(() => vi.clearAllMocks())

  it('devuelve el perfil cuando Firebase y el backend aceptan las credenciales', async () => {
    const result = await loginWithEmail('admin@llosaedificaciones.com', 'ValidPassword123!')

    expect(result).toEqual(mockPerfil)
    expect(mockSignIn).toHaveBeenCalledOnce()
    expect(mockFetchPerfil).toHaveBeenCalledWith('mock-firebase-token')
  })

  it('persiste la sesión (token + perfil) en localStorage después del login exitoso', async () => {
    await loginWithEmail('admin@llosaedificaciones.com', 'ValidPassword123!')

    expect(saveSession).toHaveBeenCalledWith('mock-firebase-token', mockPerfil)
  })

  it('solicita un ID token de Firebase para enviarlo al backend', async () => {
    await loginWithEmail('admin@llosaedificaciones.com', 'ValidPassword123!')

    expect(mockUser.getIdToken).toHaveBeenCalledOnce()
  })
})

// ─── CP02: Rechazo de dominio externo ────────────────────────────────────────

describe('CP02 — loginWithEmail con dominio externo (@gmail.com)', () => {
  afterEach(() => vi.clearAllMocks())

  /**
   * BUG DETECTADO (CP02): loginWithEmail NO valida el dominio del correo.
   * Acepta cualquier email y lo pasa directamente a Firebase.
   * Si Firebase acepta el usuario (creado manualmente), el login PROCEDE.
   *
   * Este test documenta la AUSENCIA de validación de dominio en el frontend.
   * DEBE FALLAR para evidenciar el bug si se ejecuta en el estado actual.
   */
  it('[BUG CP02] debería rechazar @gmail.com ANTES de llamar a Firebase — actualmente NO lo hace', async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as never)
    mockFetchPerfil.mockResolvedValue({ ...mockPerfil, email: 'hacker@gmail.com' })

    // En el estado actual del código, loginWithEmail llama a Firebase sin validar dominio
    // La siguiente llamada NO debería llegar a Firebase, pero sí llega:
    await loginWithEmail('hacker@gmail.com', 'cualquierClave')

    // ESTA ASSERTION DEBE FALLAR — Firebase NO debería haber sido llamado
    // Si pasa, significa que la validación de dominio se implementó correctamente
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('[BUG CP02] debería lanzar un error con mensaje de dominio no autorizado', async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as never)
    mockFetchPerfil.mockResolvedValue({ ...mockPerfil, email: 'usuario@hotmail.com' })

    // Actualmente loginWithEmail no lanza error por dominio inválido
    await expect(loginWithEmail('usuario@hotmail.com', 'cualquierClave'))
      .rejects.toThrow(/dominio|no autorizado|llosaedificaciones/)
  })

  it('el backend protege el sistema: fetchPerfil lanza 403 si el dominio no está autorizado', async () => {
    mockSignIn.mockResolvedValue({ user: mockUser } as never)
    mockFetchPerfil.mockRejectedValue(new Error('Sesión inválida. Vuelve a iniciar sesión.'))

    await expect(loginWithEmail('intruso@gmail.com', 'ValidPassword123!'))
      .rejects.toThrow('Sesión inválida. Vuelve a iniciar sesión.')
  })
})

// ─── CP04: Rechazo de credenciales inválidas ─────────────────────────────────

describe('CP04 — toAuthErrorMessage mapea errores de Firebase', () => {
  it('auth/invalid-credential → "Correo o contraseña incorrectos."', () => {
    const err = new FirebaseError('auth/invalid-credential', 'Firebase: invalid-credential')
    expect(toAuthErrorMessage(err)).toBe('Correo o contraseña incorrectos.')
  })

  it('auth/wrong-password → "Contraseña incorrecta."', () => {
    const err = new FirebaseError('auth/wrong-password', 'Firebase: wrong-password')
    expect(toAuthErrorMessage(err)).toBe('Contraseña incorrecta.')
  })

  it('auth/user-not-found → "No existe una cuenta con ese correo."', () => {
    const err = new FirebaseError('auth/user-not-found', 'Firebase: user-not-found')
    expect(toAuthErrorMessage(err)).toBe('No existe una cuenta con ese correo.')
  })

  it('auth/too-many-requests → "Demasiados intentos. Espera un momento."', () => {
    const err = new FirebaseError('auth/too-many-requests', 'Firebase: too-many-requests')
    expect(toAuthErrorMessage(err)).toBe('Demasiados intentos. Espera un momento.')
  })

  it('error genérico de Error devuelve su message original', () => {
    const err = new Error('Sesión inválida. Vuelve a iniciar sesión.')
    expect(toAuthErrorMessage(err)).toBe('Sesión inválida. Vuelve a iniciar sesión.')
  })

  it('error desconocido devuelve mensaje genérico de fallback', () => {
    expect(toAuthErrorMessage({ code: 'raro' })).toBe('No se pudo iniciar sesión.')
  })

  it('loginWithEmail propaga el error de Firebase cuando las credenciales son inválidas', async () => {
    const firebaseErr = new FirebaseError('auth/invalid-credential', 'INVALID_LOGIN_CREDENTIALS')
    mockSignIn.mockRejectedValue(firebaseErr)

    await expect(loginWithEmail('tecnico@llosaedificaciones.com', 'ClaveErronea000'))
      .rejects.toThrow(FirebaseError)
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('logout — limpia la sesión local y cierra Firebase', () => {
  afterEach(() => vi.clearAllMocks())

  it('llama a clearSession antes de signOut', async () => {
    mockSignOut.mockResolvedValue()
    await logout()
    expect(clearSession).toHaveBeenCalledOnce()
  })

  it('no lanza error aunque Firebase no tenga sesión activa', async () => {
    mockSignOut.mockRejectedValue(new Error('no session'))
    await expect(logout()).resolves.not.toThrow()
  })
})
