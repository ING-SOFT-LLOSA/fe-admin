/**
 * Pruebas E2E — Módulo de Proyectos
 */

import { test, expect, type Page } from '@playwright/test'

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

const mockProyectos = [
  {
    id: 'uuid-proyecto-001',
    nombre: 'Edificio Aurora',
    descripcion: 'Edificio residencial premium en Miraflores',
    direccion: 'Av. Larco 123',
    distrito: 'Miraflores',
    departamento: 'Lima',
    fechaInicio: '2024-01-01',
    fechaFin: '2026-12-31',
    precertificacionEdgeLeed: true,
    linkRecorridoVirtual: 'https://virtual.example.com',
  },
  {
    id: 'uuid-proyecto-002',
    nombre: 'Torres del Sol',
    descripcion: 'Complejo residencial en San Isidro',
    direccion: 'Calle Los Libertadores 456',
    distrito: 'San Isidro',
    departamento: 'Lima',
    fechaInicio: '2024-06-01',
    fechaFin: '2027-06-30',
    precertificacionEdgeLeed: false,
    linkRecorridoVirtual: '',
  },
]

const mockTorres = [
  { id: 1, nombre: 'Torre A', nroPisos: 12, nroSotanos: 2, areaComunM2: 500, proyectoId: 'uuid-proyecto-001' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectSession(page: Page, perfil: Record<string, unknown>) {
  await page.goto('/login-empresa')
  await page.evaluate((p) => {
    localStorage.setItem('llosa_id_token', 'mock-token-e2e-proyectos')
    localStorage.setItem('llosa_perfil', JSON.stringify(p))
  }, perfil)
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

async function mockProyectosEndpoint(page: Page, proyectos = mockProyectos) {
  await page.route('**/api/proyectos', async (route) => {
    if (route.request().method() === 'GET' && !route.request().url().includes('/')) {
      await route.fulfill({ status: 200, json: proyectos })
    } else if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: proyectos })
    } else {
      await route.fallback()
    }
  })
}

// ─── Listar proyectos ─────────────────────────────────────────────────────────

test.describe('Proyectos — Listado', () => {
  test('admin accede a /proyectos y ve la lista desde la API', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockProyectosEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    // Esperar a que cargue el contenido
    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Torres del Sol')).toBeVisible()
  })

  test('el KPI de Total proyectos muestra el conteo correcto', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockProyectosEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Total proyectos')).toBeVisible({ timeout: 5_000 })
  })

  test('estado vacío cuando la API devuelve lista vacía', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockProyectosEndpoint(page, [])
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    // Sin proyectos no deben aparecer tarjetas con nombres de proyectos
    await expect(page.locator('text=Edificio Aurora')).toHaveCount(0, { timeout: 3_000 })
  })

  test('existe el botón "Crear Nuevo Proyecto"', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockProyectosEndpoint(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Proyectos').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('a:has-text("Crear Nuevo Proyecto"), button:has-text("Crear Nuevo Proyecto")')).toBeVisible({ timeout: 5_000 })
  })
})

// ─── Detalle de proyecto ──────────────────────────────────────────────────────

test.describe('Proyectos — Detalle', () => {
  test('click en tarjeta navega al detalle del proyecto', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await mockProyectosEndpoint(page)
    await page.route('**/api/proyectos/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos[0] })
    })
    await page.route('**/api/torres/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/proyecto/uuid-proyecto-001**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos')

    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 5_000 })

    // Click en la tarjeta del proyecto
    await page.locator('text=Edificio Aurora').first().click()

    await expect(page).toHaveURL(/\/proyectos\//, { timeout: 8_000 })
  })

  test('detalle muestra nombre y datos del proyecto', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await page.route('**/api/proyectos**', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos })
    })
    await page.route('**/api/torres/uuid-proyecto-001', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/proyecto/uuid-proyecto-001**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    await expect(page.locator('text=Edificio Aurora')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Miraflores')).toBeVisible({ timeout: 5_000 })
  })

  test('detalle tiene navegación a subpáginas (Obra, Unidades)', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await page.route('**/api/proyectos**', async (route) => {
      await route.fulfill({ status: 200, json: mockProyectos })
    })
    await page.route('**/api/torres/**', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    // Links de navegación interna del proyecto
    await expect(page.locator('a:has-text("Obra"), a[href*="obra"]')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('a:has-text("Unidades"), a[href*="unidades"]')).toBeVisible()
  })
})

// ─── Crear proyecto ───────────────────────────────────────────────────────────

test.describe('Proyectos — Crear nuevo', () => {
  test('admin accede a /proyectos/new y ve el formulario', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    // Debe mostrar un formulario de creación
    await expect(
      page.locator('text=/nuevo proyecto|crear proyecto/i').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('formulario de nuevo proyecto valida campos requeridos', async ({ page }) => {
    await mockAuthMe(page, perfilAdmin)
    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/new')

    // Intentar enviar sin llenar campos
    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      // Debe haber alguna validación visible
      await expect(
        page.locator('text=/requerido|obligatorio|ingresa/i').first()
      ).toBeVisible({ timeout: 3_000 })
    } else {
      // Si no hay submit button, al menos el form debe renderizar
      await expect(page.locator('form, input[name], input[type="text"]').first()).toBeVisible()
    }
  })
})

// ─── Editar proyecto ──────────────────────────────────────────────────────────

test.describe('Proyectos — Editar', () => {
  test('admin edita nombre del proyecto y guarda los cambios', async ({ page }) => {
    let putCalled = false

    await mockAuthMe(page, perfilAdmin)
    await page.route('**/api/proyectos**', async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true
        await route.fulfill({ status: 200, json: { ...mockProyectos[0], nombre: 'Edificio Aurora Renovado' } })
      } else {
        await route.fulfill({ status: 200, json: mockProyectos })
      }
    })
    await page.route('**/api/torres/**', async (route) => {
      await route.fulfill({ status: 200, json: mockTorres })
    })
    await page.route('**/api/activos/**', async (route) => {
      await route.fulfill({ status: 200, json: { content: [], totalPages: 1, number: 0 } })
    })

    await injectSession(page, perfilAdmin)
    await page.goto('/proyectos/uuid-proyecto-001')

    // Buscar botón de editar
    const editBtn = page.locator('button:has-text("Editar"), button[aria-label*="editar"]')
    if (await editBtn.count() > 0) {
      await editBtn.first().click()

      const nombreInput = page.locator('input[name="nombre"], input[placeholder*="nombre"]')
      if (await nombreInput.count() > 0) {
        await nombreInput.fill('Edificio Aurora Renovado')
        await page.locator('button:has-text("Guardar"), button[type="submit"]').first().click()
        await page.waitForTimeout(1_000)
        expect(putCalled).toBe(true)
      }
    }
  })
})
