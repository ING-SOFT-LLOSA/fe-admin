/**
 * Helpers para autenticar tests E2E contra el Firebase Auth Emulator.
 *
 * Por qué: tras el refactor de auth, AuthContext restaura la sesión vía
 * `onAuthStateChanged` de Firebase (no desde localStorage). Sin un usuario
 * Firebase real, ningún flujo autenticado funciona. El emulador permite un
 * login real y reproducible sin tocar credenciales de producción.
 *
 * El `perfil` (rol/funciones) NO viene de Firebase: sigue llegando del backend
 * mockeado en cada test (`GET /api/auth/me`). El emulador solo aporta identidad.
 *
 * Requiere que el emulador esté corriendo (lo levanta playwright.config.ts) y
 * que la app corra con NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true (script dev:e2e).
 */

import type { Page } from '@playwright/test'

const AUTH_EMULATOR = 'http://127.0.0.1:9099'

export const TEST_EMAIL = 'e2e@llosaedificaciones.com'
export const TEST_PASSWORD = 'Test123456'

/** Crea (idempotente) el usuario de prueba en el emulador de Auth. */
export async function ensureTestUser(): Promise<void> {
  const url = `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      returnSecureToken: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // EMAIL_EXISTS es esperado en ejecuciones repetidas (el emulador persiste
    // usuarios durante toda la sesión).
    if (!body.includes('EMAIL_EXISTS')) {
      throw new Error(
        `No se pudo crear el usuario de prueba en el emulador (${res.status}): ${body}`,
      )
    }
  }
}

/**
 * Realiza un login real contra el emulador conduciendo el formulario de /login.
 *
 * PRE: el test debe haber mockeado `GET /api/auth/me` con el perfil deseado
 * ANTES de llamar a esta función (el login dispara `fetchPerfil`).
 *
 * Espera de forma acotada a que se establezca la cookie de sesión. No falla si
 * no aparece: en escenarios negativos (p.ej. /api/auth/me → 401) la sesión no
 * se establece a propósito y el test verifica la redirección a /login.
 */
export async function loginViaEmulator(page: Page): Promise<void> {
  await ensureTestUser()
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page
    .waitForFunction(() => document.cookie.includes('llosa_id_token='), {
      timeout: 12_000,
    })
    .catch(() => {
      /* sesión no establecida (caso negativo); el test lo verifica */
    })
}
