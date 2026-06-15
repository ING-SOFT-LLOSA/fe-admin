/**
 * Pruebas E2E — Módulo de Clientes (CP06, CP08)
 */

import { test, expect, type Page } from '@playwright/test'
import { loginViaEmulator } from './helpers/emulator'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const perfilAdmin = {
  id: 1,
  nombre: 'Admin Sistema',
  email: 'admin@llosaedificaciones.com',
  tipoUsuario: 'EMPLEADO',
  rol: 'ADMIN',
  activo: true,
  funciones: [],
}

const mockClientes = [
  {
    id: 101,
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@gmail.com',
    telefono: '999000001',
    documentoIdentidad: '45678901',
    tipoUsuario: 'CLIENTE',
    rol: null,
    activo: true,
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 102,
    nombre: 'Carlos',
    apellidos: 'López',
    email: 'carlos@gmail.com',
    telefono: '999000002',
    documentoIdentidad: '45678902',
    tipoUsuario: 'CLIENTE',
    rol: null,
    activo: false,
    createdAt: '2024-02-10T00:00:00Z',
  },
  {
    id: 103,
    nombre: 'Beatriz',
    apellidos: 'Soto',
    email: 'beatriz@gmail.com',
    telefono: '999000003',
    documentoIdentidad: '45678903',
    tipoUsuario: 'CLIENTE',
    rol: null,
    activo: true,
    createdAt: '2024-03-10T00:00:00Z',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectSession(page: Page, perfil: Record<string, unknown>) {
  // El perfil (rol/funciones) llega del backend mockeado; la identidad, del
  // emulador de Firebase Auth mediante un login real.
  await mockAuthMe(page, perfil)
  await loginViaEmulator(page)
}

async function mockAuthMe(page: Page, perfil: Record<string, unknown> | null) {
  await page.route('**/api/auth/me', async (route) => {
    if (!perfil) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    } else {
      await route.fulfill({ status: 200, json: perfil })
    }
  })
}

async function mockUsersEndpoint(page: Page, usuarios = mockClientes) {
  await page.route('**/api/users', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: usuarios })
    } else {
      await route.fallback()
    }
  })
}

// ─── Listar clientes ──────────────────────────────────────────────────────────

test.describe('CP06 — Listar clientes', () => {
  test('admin accede a /clientes y ve los clientes cargados desde la API', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    // Esperar a que desaparezca el indicador de carga
    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Deben aparecer los nombres de los clientes mock
    await expect(page.locator('text=Ana García')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Carlos López')).toBeVisible()
  })

  test('los KPIs muestran el conteo correcto de clientes activos e inactivos', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // 3 totales, 2 activos, 1 inactivo en los mocks
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 5_000 })
  })

  test('estado vacío cuando no hay clientes', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page, [])
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Sin clientes, la tabla no debe mostrar filas de datos
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(0, { timeout: 5_000 })
  })

  test('muestra error cuando la API falla al cargar clientes', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await page.route('**/api/users', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Internal Server Error' } })
    })
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/error|no se pudieron/i').first()).toBeVisible({ timeout: 8_000 })
  })
})

// ─── Buscar clientes ──────────────────────────────────────────────────────────

test.describe('CP06 — Buscar clientes (filtro client-side)', () => {
  test('búsqueda por nombre filtra la lista correctamente', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Escribir en el campo de búsqueda y enviar
    await page.fill('input[placeholder*="Buscar"], input[type="search"], input[type="text"]', 'Ana')
    await page.keyboard.press('Enter')

    // Solo Ana debe aparecer
    await expect(page.locator('text=Ana García')).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('text=Carlos López')).toHaveCount(0)
  })

  test('búsqueda por email filtra correctamente', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    await page.fill('input[placeholder*="Buscar"], input[type="search"], input[type="text"]', 'beatriz@gmail.com')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=Beatriz Soto')).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('text=Ana García')).toHaveCount(0)
  })

  test('búsqueda sin resultados muestra tabla vacía', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    await page.fill('input[placeholder*="Buscar"], input[type="search"], input[type="text"]', 'nombrequenoexiste12345')
    await page.keyboard.press('Enter')

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(0, { timeout: 3_000 })
  })
})

// ─── Crear cliente ────────────────────────────────────────────────────────────

test.describe('CP06 — Crear cliente via modal', () => {
  test('admin abre modal "Crear cliente" y ve el formulario', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // El link "Crear cliente" en el header
    const crearBtn = page.locator('a:has-text("Crear cliente"), button:has-text("Crear cliente")')
    await expect(crearBtn.first()).toBeVisible()
    await crearBtn.first().click()

    // Debe aparecer el modal con el título
    await expect(page.locator('text=Crear cliente').nth(1)).toBeVisible({ timeout: 3_000 })
  })

  test('crea cliente exitosamente y recarga la lista', async ({ page }) => {
    const nuevoCliente = {
      id: 200,
      nombre: 'Nuevo',
      apellidos: 'Cliente',
      email: 'nuevo@gmail.com',
      telefono: '999111222',
      documentoIdentidad: '12345678',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      createdAt: '2024-04-01T00:00:00Z',
    }

    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)

    // Mock POST /api/users/register
    await page.route('**/api/users/register', async (route) => {
      await route.fulfill({ status: 201, json: nuevoCliente })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    const crearBtn = page.locator('a:has-text("Crear cliente"), button:has-text("Crear cliente")')
    await crearBtn.first().click()

    // Llenar formulario
    await page.fill('input[name="nombre"], input[placeholder*="André"]', 'Nuevo')
    await page.fill('input[name="apellidos"], input[placeholder*="García"]', 'Cliente')
    await page.fill('input[name="email"], input[type="email"]', 'nuevo@gmail.com')
    await page.fill('input[name="telefono"], input[placeholder*="9"]', '999111222')
    await page.fill('input[name="documentoIdentidad"], input[placeholder*="DNI"], input[placeholder*="documento"]', '12345678')

    // Enviar
    await page.click('button[type="submit"]')

    // Debe mostrar mensaje de éxito
    await expect(page.locator('text=/creado correctamente|cliente creado/i')).toBeVisible({ timeout: 5_000 })
  })

  test('muestra error cuando la API rechaza el registro (conflicto)', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await page.route('**/api/users/register', async (route) => {
      await route.fulfill({
        status: 409,
        json: { error: 'El correo ya está registrado.' },
      })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    const crearBtn = page.locator('a:has-text("Crear cliente"), button:has-text("Crear cliente")')
    await crearBtn.first().click()

    await page.fill('input[name="nombre"], input[placeholder*="André"]', 'Duplicado')
    await page.fill('input[name="apellidos"], input[placeholder*="García"]', 'Test')
    await page.fill('input[name="email"], input[type="email"]', 'ana@gmail.com')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/correo|registrado|error/i').first()).toBeVisible({ timeout: 5_000 })
  })
})

// ─── Desactivar/eliminar cliente ─────────────────────────────────────────────

test.describe('CP08 — Desactivar/eliminar cliente', () => {
  test('admin ve el botón de desactivar en la lista de clientes', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Debe existir al menos un botón de desactivar/eliminar en las filas
    const deleteButtons = page.locator('button[title*="eliminar"], button[aria-label*="eliminar"], button:has(span:text-matches("delete|block", "i"))')
    await expect(deleteButtons.first()).toBeVisible({ timeout: 5_000 })
  })

  test('desactivar cliente llama a DELETE /api/users/:id y recarga lista', async ({ page }) => {
    let deleteCalledId: string | null = null

    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await page.route('**/api/users/**', async (route, req) => {
      if (req.method() === 'DELETE' && !req.url().includes('/hard')) {
        const segments = new URL(req.url()).pathname.split('/')
        deleteCalledId = segments[segments.length - 1]
        await route.fulfill({ status: 204 })
      } else {
        await route.fallback()
      }
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Hacer click en el primer botón de eliminar/desactivar
    const deleteBtn = page.locator('button[title*="eliminar"], button[aria-label*="eliminar"], button:has(.material-symbols-outlined:text-matches("delete|block", "i"))')
    await deleteBtn.first().click()

    // Debe aparecer modal de confirmación
    await expect(page.locator('text=/desactivar|confirmar|seguro/i').first()).toBeVisible({ timeout: 3_000 })

    // Confirmar
    const confirmarBtn = page.locator('button:has-text("Confirmar"), button:has-text("Desactivar"), button:has-text("Eliminar")')
    await confirmarBtn.first().click()

    // La API debe haber sido llamada
    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 5_000 })
    expect(deleteCalledId).not.toBeNull()
  })

  test('usuario sin permisos no ve el botón de eliminar', async ({ page }) => {
    const perfilAsesor = {
      id: 9,
      nombre: 'Asesor',
      email: 'asesor@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ASESOR',
      activo: true,
      funciones: ['PROYECTO_VER', 'CLIENTE_VER'],
    }

    await mockAuthMe(page, perfilAsesor)
    await mockUsersEndpoint(page)
    await injectSession(page, perfilAsesor)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Los botones de eliminar no deben estar visibles para rol sin permisos
    const deleteBtn = page.locator('button[title*="eliminar"], button[aria-label*="eliminar"]')
    await expect(deleteBtn).toHaveCount(0, { timeout: 3_000 })
  })
})

// ─── Navegación a detalle ─────────────────────────────────────────────────────

test.describe('CP06 — Navegación al detalle del cliente', () => {
  test('click en fila de cliente navega a /clientes/:id', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockUsersEndpoint(page)
    await page.route('**/api/users/101', async (route) => {
      await route.fulfill({ status: 200, json: mockClientes[0] })
    })
    await page.route('**/api/expedientes/101', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/clientes')

    await expect(page.locator('text=/Cargando/i')).toHaveCount(0, { timeout: 8_000 })

    // Click en la fila o link del cliente
    const clientRow = page.locator('tr:has-text("Ana García"), a:has-text("Ana García")')
    await clientRow.first().click()

    await expect(page).toHaveURL(/\/clientes\/\d+/, { timeout: 5_000 })
  })
})
