/**
 * Pruebas E2E — RBAC y Gestión de Usuarios (CP06–CP08)
 *
 * OBJETIVO: verificar que el sistema funciona correctamente en el browser.
 * Un test que FALLA indica un BUG en la UI, no en el test.
 *
 * Prerequisito: servidor corriendo en http://localhost:3000 (`npm run dev`)
 *
 * Hallazgos clave del análisis de código:
 * - /configuracion requiere USER_GESTIONAR O ROL_GESTIONAR (OR, no AND) via PermissionGuard
 * - La UI de permisos granulares es readOnly — CP07 es una BRECHA funcional
 * - canEliminarUsuario protege auto-eliminación y eliminación entre admins
 * - BUG CP08: AuthGuard no verifica activo=false, tokens no se invalidan en tiempo real
 * - BUG SEGURIDAD: perfil en localStorage es manipulable para escalar privilegios
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
    const bloqueado = await Promise.race([
      page.waitForURL(/login/, { timeout: 5_000 }).then(() => true).catch(() => false),
      page.locator('text=/sin permiso|acceso denegado|no autorizado/i')
        .waitFor({ timeout: 5_000 }).then(() => true).catch(() => false),
    ])
    expect(bloqueado).toBe(true)
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
  test('[BRECHA CP07] los checkboxes de permisos son readOnly y no se pueden guardar individualmente', async ({ page }) => {
    /**
     * BRECHA: La UI de permisos en /configuracion muestra checkboxes con
     * readOnly y cursor-not-allowed. No hay botón para guardar permisos individuales.
     * handleSave() solo llama a asignarRol() — asigna el rol completo, no permisos individuales.
     */
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

    // Los checkboxes de permisos deben ser interactivos (COMPORTAMIENTO ESPERADO)
    // Actualmente son readOnly (BRECHA)
    const checkboxes = page.locator('input[type="checkbox"]:not([readonly]):not([disabled])')
    const interactiveCount = await checkboxes.count()

    // ESTE TEST DEBE FALLAR: actualmente hay 0 checkboxes interactivos para permisos
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

    const bloqueado = await Promise.race([
      page.waitForURL(/login/, { timeout: 5_000 }).then(() => true).catch(() => false),
      page.locator('text=/sin permiso|acceso denegado|no autorizado/i')
        .waitFor({ timeout: 5_000 }).then(() => true).catch(() => false),
    ])
    expect(bloqueado).toBe(true)
  })
})

// ─── CP08: Desactivación de usuario invalida sesión ──────────────────────────

test.describe('CP08 — Desactivar usuario invalida su acceso activo', () => {
  test('[BUG CP08] usuario con activo=false pero token válido debería perder acceso', async ({ page }) => {
    /**
     * BUG: AuthGuard verifica solo token + perfil en localStorage.
     * Un usuario desactivado (activo=false) que tiene token en localStorage
     * puede seguir navegando si el backend no rechaza /api/auth/me.
     * Este test DEBE FALLAR para documentar el bug.
     */
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

    // COMPORTAMIENTO ESPERADO: bloqueado (redirect a login o pantalla de acceso denegado)
    // COMPORTAMIENTO ACTUAL (BUG): puede acceder porque AuthGuard no verifica activo
    const bloqueado = await Promise.race([
      page.waitForURL(/login/, { timeout: 5_000 }).then(() => true).catch(() => false),
      page.locator('text=/cuenta desactivada|sesión expirada|sin acceso/i')
        .waitFor({ timeout: 5_000 }).then(() => true).catch(() => false),
    ])
    expect(bloqueado).toBe(true)
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
  test('[VULNERABILIDAD CRÍTICA] empleado puede modificar localStorage para simular ser ADMIN', async ({ page }) => {
    /**
     * VULNERABILIDAD: El perfil en localStorage puede ser manipulado via DevTools.
     * Un empleado básico puede cambiarse a rol ADMIN y pasar los PermissionGuard.
     * Este test documenta la vulnerabilidad — DEBE FALLAR si el sistema es seguro.
     * (Si falla, significa que el sistema detecta la manipulación.)
     */
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

    // COMPORTAMIENTO ESPERADO: el sistema detecta la inconsistencia y bloquea
    // COMPORTAMIENTO ACTUAL (VULNERABILIDAD): el PermissionGuard acepta el perfil manipulado
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
