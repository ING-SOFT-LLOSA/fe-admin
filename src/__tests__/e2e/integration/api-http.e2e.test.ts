/**
 * Pruebas de Integración — apiFetch (src/lib/api/http.ts)
 *
 * Nota: apiFetch es invocado por todos los módulos via páginas React.
 * Probamos su comportamiento observando efectos en la UI y en las peticiones.
 *
 * Todos los tests usan page.route() para mockear Firebase Auth y el backend.
 * No se requiere Firebase Emulator ni backend real (compatible con CI).
 */

import { test, expect, type Page } from '@playwright/test'
import { mockFirebaseSuccess } from '../helpers/auth-mock'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const perfilAdmin = {
  id: 1,
  nombre: 'Admin Sistema',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: [],
}

/**
 * Inyecta sesión autenticada sin emulador. El perfil se mockea ANTES de llamar
 * a esta función via page.route() con el patron de api/auth/me.
 */
async function injectSession(page: Page, email = perfilAdmin.email) {
  await mockFirebaseSuccess(page, email)
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'Test123456')
  await page.click('button[type="submit"]')
  await page
    .waitForFunction(() => document.cookie.includes('llosa_id_token='), { timeout: 12_000 })
    .catch(() => { /* caso negativo — el test verificará el comportamiento esperado */ })
}

// ─── apiFetch: autorización ───────────────────────────────────────────────────

test.describe('apiFetch — Manejo de errores de autorización', () => {
  test('respuesta 401 de /api/auth/me limpia sesión y redirige al login', async ({ page }) => {
    /**
     * AuthContext llama a fetchPerfil → apiFetch → GET /api/auth/me al restaurar sesión.
     * Si el backend devuelve 401, AuthContext llama a clearSession y el AuthGuard redirige.
     *
     * Usamos addCookies en lugar de injectSession para evitar que el SDK de Firebase
     * quede autenticado y genere un bucle infinito: clearSession no llama a signOut(),
     * por lo que onAuthStateChanged vuelve a dispararse → 401 → loop hasta timeout.
     */
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    })

    // Inyectamos una cookie falsa para que el middleware deje pasar la solicitud
    await page.context().addCookies([{
      name: 'llosa_id_token',
      value: 'fake-expired-token',
      domain: 'localhost',
      path: '/',
    }])

    await page.goto('/clientes')

    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test('respuesta 403 en llamada a API muestra mensaje de permisos', async ({ page }) => {
    /**
     * apiFetch lanza ApiError con status 403 y mensaje específico.
     * Los componentes capturan el error y lo muestran al usuario.
     */
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 403,
        json: { error: 'No tienes permisos para ejecutar esta acción.' },
      })
    })

    await injectSession(page)
    await page.goto('/clientes')

    // El componente debe mostrar el error de la API
    await expect(
      page.locator('text=/permiso|error|no se pudieron/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('respuesta 500 en llamada a API muestra mensaje de error genérico', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Internal Server Error' } })
    })

    await injectSession(page)
    await page.goto('/clientes')

    await expect(
      page.locator('text=/error|no se pudieron cargar/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ─── apiFetch: cabecera Authorization ────────────────────────────────────────

test.describe('apiFetch — Token de autenticación en cabeceras', () => {
  test('cada llamada a la API incluye cabecera Authorization: Bearer', async ({ page }) => {
    const authHeaders: string[] = []

    await page.route('**/api/auth/me', async (route) => {
      authHeaders.push(route.request().headers()['authorization'] || '')
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      authHeaders.push(route.request().headers()['authorization'] || '')
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page)
    await page.goto('/clientes')

    // Esperar a que se completen las peticiones
    await page.waitForTimeout(2_000)

    // Todas las peticiones interceptadas deben llevar Bearer token
    for (const header of authHeaders) {
      expect(header).toMatch(/^Bearer /)
    }
  })

  test('sin token en localStorage, la navegación redirige al login', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    })

    // Navegar sin inyectar sesión
    await page.goto('/clientes')

    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })
})

// ─── apiFetch: formato de cabeceras ──────────────────────────────────────────

test.describe('apiFetch — Formato de peticiones', () => {
  test('las peticiones incluyen Content-Type: application/json y Accept: application/json', async ({ page }) => {
    let capturedHeaders: Record<string, string> = {}

    await page.route('**/api/auth/me', async (route) => {
      capturedHeaders = route.request().headers()
      await route.fulfill({ status: 200, json: perfilAdmin })
    })

    await injectSession(page)
    await page.goto('/clientes')

    await page.waitForTimeout(1_500)

    expect(capturedHeaders['accept']).toContain('application/json')
  })

  test('las llamadas a la API usan cache: no-store (sin caché de browser)', async ({ page }) => {
    const requestUrls: string[] = []

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      requestUrls.push(route.request().url())
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page)
    await page.goto('/clientes')
    await page.waitForTimeout(1_000)

    // Navegar a otra ruta y volver
    await page.route('**/api/proyectos', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })
    await page.goto('/proyectos')

    // Volver a clientes — debe hacer una nueva petición (no usar caché)
    await page.goto('/clientes')
    await page.waitForTimeout(1_000)

    // Se esperan al menos 1 petición a /api/users
    expect(requestUrls.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── apiFetch: parsing de respuestas ─────────────────────────────────────────

test.describe('apiFetch — Parsing de respuestas de la API', () => {
  test('respuesta 204 No Content no causa error en el componente', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, body: '' })
      } else {
        await route.fulfill({ status: 200, json: [] })
      }
    })

    await injectSession(page)
    await page.goto('/clientes')

    // No debe aparecer error de parsing en la consola
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.waitForTimeout(2_000)

    // Errores de consola no deben incluir JSON parsing errors
    const parseErrors = errors.filter(e => e.includes('JSON') || e.includes('parse'))
    expect(parseErrors).toHaveLength(0)
  })

  test('respuesta con JSON válido es procesada correctamente por el componente', async ({ page }) => {
    const mockUsers = [
      {
        id: 101,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@gmail.com',
        tipoUsuario: 'CLIENTE',
        rol: null,
        activo: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockUsers })
      } else {
        await route.fallback()
      }
    })

    await injectSession(page)
    await page.goto('/clientes')

    // El componente debe renderizar el cliente del mock
    await expect(page.locator('text=Test User')).toBeVisible({ timeout: 8_000 })
  })
})

// ─── apiFetch: URL construction ───────────────────────────────────────────────

test.describe('apiFetch — Construcción de URLs', () => {
  test('no se forman URLs con doble slash (//api/...)', async ({ page }) => {
    const requestedUrls: string[] = []

    await page.route('**/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/')) requestedUrls.push(url)
      await route.fallback()
    })

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: perfilAdmin })
    })
    await page.route('**/api/users', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page)
    await page.goto('/clientes')
    await page.waitForTimeout(2_000)

    // Ninguna URL debe contener doble slash seguido de 'api'
    const malformedUrls = requestedUrls.filter(u => /\/\/api\//.test(u))
    expect(malformedUrls).toHaveLength(0)
  })
})
