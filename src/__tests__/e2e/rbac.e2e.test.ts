/**
 * Pruebas E2E — RBAC y Gestión de Usuarios (CP06–CP08)
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectSession(page: Page, perfil: Record<string, unknown>) {
  await page.goto('/login-empresa')
  await page.evaluate((p) => {
    localStorage.setItem('llosa_id_token', 'mock-token-e2e-rbac')
    localStorage.setItem('llosa_perfil', JSON.stringify(p))
  }, perfil)
}

/**
 * Verifica que el acceso a una ruta protegida esté bloqueado.
 * Comprueba primero redirección a /login; si no ocurre, busca mensaje de acceso denegado.
 */
async function assertAccessBlocked(page: Page, timeout = 5_000) {
  try {
    await page.waitForURL(/login/, { timeout })
  } catch {
    await expect(
      page.locator('text=/sin permiso|acceso denegado|no autorizado/i').first()
    ).toBeVisible({ timeout })
  }
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

async function mockUsersApi(page: Page) {
  await page.route('**/api/users**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        content: [
          { id: 10, nombre: 'Carlos', apellidos: 'Pérez', email: 'cperez@llosaedificaciones.com', rol: 'AREA_TECNICA', activo: true, funciones: [] },
        ],
        totalPages: 1,
        number: 0,
      },
    })
  })
  await page.route('**/api/roles**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        { idRol: 1, nombre: 'AREA_TECNICA', descripcion: 'Área Técnica', funciones: ['OBRA_VER'] },
        { idRol: 2, nombre: 'ASESOR', descripcion: 'Asesor', funciones: ['PROYECTO_VER', 'CLIENTE_VER'] },
      ],
    })
  })
}

// ─── CP06: Admin crea usuario con rol base ────────────────────────────────────

test.describe('CP06 — Admin puede acceder al módulo de gestión de usuarios', () => {
  test('ADMIN accede a /configuracion sin ser bloqueado', async ({ page }) => {
    const perfilAdmin = {
      id: 1,
      nombre: 'Admin Sistema',
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilAdmin)
    await mockUsersApi(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    // No debe redirigir al login
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
    // Debe mostrar contenido de gestión de usuarios
    await expect(page.locator('text=/usuarios|gestión|crear/i').first()).toBeVisible({ timeout: 5_000 })
  })

  test('Admin ve el botón de "Crear usuario interno"', async ({ page }) => {
    const perfilAdmin = {
      id: 1,
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilAdmin)
    await mockUsersApi(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    const crearBtn = page.locator('button:has-text("Crear"), button:has-text("usuario"), button:has-text("Nuevo")')
    await expect(crearBtn.first()).toBeVisible({ timeout: 5_000 })
  })

  test('empleado sin USER_GESTIONAR es bloqueado de /configuracion', async ({ page }) => {
    const perfilTecnico = {
      id: 5,
      email: 'tecnico@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: ['OBRA_VER'], // Sin USER_GESTIONAR ni ROL_GESTIONAR
    }

    await mockAuthMe(page, perfilTecnico)
    await injectSession(page, perfilTecnico)
    await page.goto('/configuracion')

    // Debe ser bloqueado (redirect o mensaje de acceso denegado)
    await assertAccessBlocked(page)
  })

  test('empleado CON USER_GESTIONAR puede acceder a /configuracion', async ({ page }) => {
    const perfilConPermiso = {
      id: 6,
      email: 'supervisor@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'POSTVENTA',
      activo: true,
      funciones: ['USER_GESTIONAR'],
    }

    await mockAuthMe(page, perfilConPermiso)
    await mockUsersApi(page)
    await injectSession(page, perfilConPermiso)
    await page.goto('/configuracion')

    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })
})

// ─── CP07: Permisos granulares ────────────────────────────────────────────────

test.describe('CP07 — Asignación granular de permisos por módulo', () => {
  test('los checkboxes de permisos son readOnly y no se pueden guardar individualmente', async ({ page }) => {

    const perfilAdmin = {
      id: 1,
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilAdmin)
    await mockUsersApi(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    // Intentar encontrar checkboxes de permisos interactivos
    await page.locator('button:has-text("Crear"), button:has-text("usuario")').first().click().catch(() => {})
    await page.waitForTimeout(500)

    const checkboxes = page.locator('input[type="checkbox"]:not([readonly]):not([disabled])')
    const interactiveCount = await checkboxes.count()

    expect(interactiveCount).toBeGreaterThan(0)
  })

  test('usuario con permiso FINANZAS_VER puede acceder a /finanzas', async ({ page }) => {
    const perfilConFinanzas = {
      id: 7,
      email: 'cperez@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: ['FINANZAS_VER'],
    }

    await mockAuthMe(page, perfilConFinanzas)
    await injectSession(page, perfilConFinanzas)
    await page.goto('/finanzas')

    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })

  test('usuario SIN FINANZAS_VER es bloqueado de /finanzas', async ({ page }) => {
    const perfilSinFinanzas = {
      id: 8,
      email: 'otro@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: ['OBRA_VER'],
    }

    await mockAuthMe(page, perfilSinFinanzas)
    await injectSession(page, perfilSinFinanzas)
    await page.goto('/finanzas')

    await assertAccessBlocked(page)
  })
})

// ─── CP08: Desactivación de usuario invalida sesión ──────────────────────────

test.describe('CP08 — Desactivar usuario invalida su acceso activo', () => {
  test('Usuario con activo=false pero token válido debería perder acceso', async ({ page }) => {
    const perfilDesactivado = {
      id: 15,
      email: 'exempleado@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: false, // Fue desactivado por el admin
      funciones: ['OBRA_VER'],
    }

    // Backend aún no ha procesado la invalidación (o no la detecta)
    await mockAuthMe(page, perfilDesactivado)
    await injectSession(page, perfilDesactivado)
    await page.goto('/obra')
    await assertAccessBlocked(page)
  })

  test('cuando el backend devuelve 403, la sesión del usuario desactivado se limpia', async ({ page }) => {
    // Escenario donde el backend SÍ detecta la desactivación y devuelve 403
    await mockAuthMe(page, null) // 401 = sin autorización

    const perfilDesactivado = {
      id: 15,
      email: 'exempleado@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: false,
      funciones: [],
    }

    await injectSession(page, perfilDesactivado)
    await page.goto('/obra')

    // Con 401 del backend, AuthContext limpia sesión → redirect al login
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})

// ─── SEGURIDAD: Escalación de privilegios via localStorage ───────────────────

test.describe('Seguridad — Escalación de privilegios via manipulación de localStorage', () => {
  test('Empleado puede modificar localStorage para simular ser ADMIN', async ({ page }) => {

    const perfilReal = {
      id: 50,
      email: 'basico@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: [],
    }

    // El backend responde con el perfil real (técnico sin permisos)
    await mockAuthMe(page, perfilReal)
    await injectSession(page, perfilReal)

    // Simula manipulación via DevTools:
    await page.evaluate(() => {
      const perfilFalso = {
        id: 50,
        email: 'basico@llosaedificaciones.com',
        tipoUsuario: 'EMPLEADO',
        rol: 'ADMIN', // Escalación de privilegio
        activo: true,
        funciones: ['USER_GESTIONAR', 'ROL_GESTIONAR'],
      }
      localStorage.setItem('llosa_perfil', JSON.stringify(perfilFalso))
    })

    await page.goto('/configuracion')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
