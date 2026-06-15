/**
 * Pruebas E2E — Portal de Cliente (CP09, CP10, CP11)
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectSession(page: Page, perfil: Record<string, unknown>) {
  await page.goto('/login-empresa')
  await page.evaluate((p) => {
    localStorage.setItem('llosa_id_token', 'mock-token-e2e-portal')
    localStorage.setItem('llosa_perfil', JSON.stringify(p))
  }, perfil)
}

async function mockAuthMe(page: Page, perfil: Record<string, unknown> | null, status = 200) {
  await page.route('**/api/auth/me', async (route) => {
    if (perfil === null || status !== 200) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    } else {
      await route.fulfill({ status, json: perfil })
    }
  })
}

async function mockFirebaseSuccess(page: Page, email: string) {
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        idToken: 'mock-firebase-id-token',
        email,
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        localId: 'mock-uid-cliente',
      }),
    })
  })
}

async function mockMisActivosEndpoint(page: Page, content: unknown[]) {
  await page.route('**/api/expedientes/mis-activos**', async (route) => {
    await route.fulfill({
      status: 200,
      json: { content, totalPages: 1, number: 0, totalElements: content.length },
    })
  })
}

// ─── CP09: Redirección del cliente tras login ─────────────────────────────────

test.describe('CP09 — Redirección de cliente al portal correcto tras login', () => {
  test('[BUG CP09] cliente con tipoUsuario=CLIENTE es redirigido incorrectamente a /proyectos', async ({ page }) => {
    const perfilCliente = {
      id: 20,
      nombre: 'Ana Cliente',
      email: 'ana@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockFirebaseSuccess(page, 'ana@gmail.com')
    await mockAuthMe(page, perfilCliente)
    await mockMisActivosEndpoint(page, [])
    await page.goto('/login')

    await page.fill('input[type="email"]', 'ana@gmail.com')
    await page.fill('input[type="password"]', 'ClientePass123!')
    await page.click('button[type="submit"]')

    // COMPORTAMIENTO ESPERADO: redirigir a /portal/mis-activos
    // COMPORTAMIENTO ACTUAL (BUG): redirige a /proyectos
    await expect(page).toHaveURL('/portal/mis-activos', { timeout: 8_000 })
  })

  test('cliente con VENDIDO puede acceder directamente a /portal/mis-activos', async ({ page }) => {
    const perfilClienteVendido = {
      id: 21,
      nombre: 'María Vendida',
      email: 'maria@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilClienteVendido)
    await mockMisActivosEndpoint(page, [
      {
        id: 'exp-001',
        estadoComercial: 'VENDIDO',
        nombreUnidad: 'Dpto 402',
        proyecto: 'Edificio Aurora',
        nroPiso: 4,
        torreNombre: 'Torre A',
      },
    ])

    await injectSession(page, perfilClienteVendido)
    await page.goto('/portal/mis-activos')

    await expect(page.locator('text=/VENDIDO|Vendido/i').first()).toBeVisible({ timeout: 8_000 })
  })

  test('página /portal/mis-activos carga para cliente autenticado', async ({ page }) => {
    const perfilCliente = {
      id: 22,
      nombre: 'Pedro Portal',
      email: 'pedro@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilCliente)
    await mockMisActivosEndpoint(page, [])

    await injectSession(page, perfilCliente)
    await page.goto('/portal/mis-activos')

    // La página debe cargar sin redirigir al login
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })
})

// ─── CP10: Bloqueo de cliente inactivo ───────────────────────────────────────

test.describe('CP10 — Cliente inactivo no puede acceder al portal', () => {
  test('cuando backend devuelve 401, cliente inactivo es redirigido al login', async ({ page }) => {
    const perfilInactivo = {
      id: 30,
      nombre: 'Ex Cliente',
      email: 'excliente@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: false,
      funciones: [],
    }

    await mockAuthMe(page, null, 401) // Backend rechaza al inactivo
    await injectSession(page, perfilInactivo)
    await page.goto('/portal/mis-activos')

    // Con 401 del backend, AuthContext limpia sesión → redirect al login
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test('Cuando backend NO rechaza pero activo=false, AuthGuard debería bloquear', async ({ page }) => {

    const perfilInactivo = {
      id: 30,
      nombre: 'Ex Cliente',
      email: 'excliente@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: false,
      funciones: [],
    }

    // Backend responde OK (no detecta la inactividad a tiempo)
    await mockAuthMe(page, perfilInactivo)
    await mockMisActivosEndpoint(page, [])
    await injectSession(page, perfilInactivo)
    await page.goto('/portal/mis-activos')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

  test('empleado desactivado es redirigido al login cuando backend devuelve 401', async ({ page }) => {
    const perfilDesactivado = {
      id: 31,
      nombre: 'Ex Empleado',
      email: 'exempelado@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: false,
      funciones: [],
    }

    await mockAuthMe(page, null, 401)
    await injectSession(page, perfilDesactivado)
    await page.goto('/proyectos')

    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })
})

// ─── CP11: Cliente separado — Modo de Espera ─────────────────────────────────

test.describe('CP11 — Cliente con unidad Separado entra en Modo de Espera', () => {
  test('Portal no muestra UI diferenciada para estadoComercial=SEPARADO', async ({ page }) => {
    const perfilSeparado = {
      id: 40,
      nombre: 'Cliente Separado',
      email: 'separado@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilSeparado)
    await mockMisActivosEndpoint(page, [
      {
        id: 'exp-002',
        estadoComercial: 'SEPARADO',
        nombreUnidad: 'Dpto 802',
        proyecto: 'Edificio Aurora',
        nroPiso: 8,
        torreNombre: 'Torre A',
      },
    ])

    await injectSession(page, perfilSeparado)
    await page.goto('/portal/mis-activos')

    // COMPORTAMIENTO ESPERADO: UI "Modo de Espera" visible y módulos bloqueados
    await expect(page.locator('text=/modo de espera|en espera/i')).toBeVisible({ timeout: 5_000 })

    // Los módulos de obra, finanzas y legal deben estar bloqueados o ausentes
    await expect(page.locator('a[href*="obra"], button:has-text("Avance de Obra")')).toHaveCount(0)
    await expect(page.locator('a[href*="finanzas"], button:has-text("Finanzas")')).toHaveCount(0)
  })

  test('Cliente separado debería ver solo resumen de separación', async ({ page }) => {
    const perfilSeparado = {
      id: 41,
      nombre: 'Cliente Separado 2',
      email: 'separado2@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilSeparado)
    await mockMisActivosEndpoint(page, [
      {
        id: 'exp-003',
        estadoComercial: 'SEPARADO',
        nombreUnidad: 'Dpto 301',
        proyecto: 'Torres del Sol',
        nroPiso: 3,
        torreNombre: 'Torre B',
      },
    ])

    await injectSession(page, perfilSeparado)
    await page.goto('/portal/mis-activos')

    // La página debe cargar (no redirigir al login)
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })

    // El estado SEPARADO debe mostrarse de alguna forma
    await expect(page.locator('text=/SEPARADO|Separado/i').first()).toBeVisible({ timeout: 5_000 })
  })
})

// ─── Portal: Multi-propiedad ──────────────────────────────────────────────────

test.describe('Portal — Multipropiedad', () => {
  test('cliente con múltiples unidades ve selector de propiedades', async ({ page }) => {
    const perfilMulti = {
      id: 50,
      nombre: 'Cliente Multi',
      email: 'multi@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilMulti)
    await mockMisActivosEndpoint(page, [
      { id: 'exp-a', estadoComercial: 'VENDIDO', nombreUnidad: 'Dpto 101', proyecto: 'Edificio Aurora' },
      { id: 'exp-b', estadoComercial: 'VENDIDO', nombreUnidad: 'Dpto 201', proyecto: 'Torres del Sol' },
    ])

    await injectSession(page, perfilMulti)
    await page.goto('/portal/mis-activos')

    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
    // Con múltiples unidades debería existir algún selector o lista de propiedades
    await expect(page.locator('text=Dpto 101, text=Dpto 201').first()).toBeVisible({ timeout: 5_000 })
  })
})
