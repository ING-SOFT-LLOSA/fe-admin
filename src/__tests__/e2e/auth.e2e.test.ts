/**
 * Pruebas E2E — Módulo de Autenticación (CP01–CP04, CP09–CP11)
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Inyecta una sesión mockeada en localStorage.
 * Simula haber completado el login exitosamente.
 */
async function injectSession(page: Page, perfil: Record<string, unknown>) {
  await page.goto('/login-empresa')
  await page.evaluate((p) => {
    localStorage.setItem('llosa_id_token', 'mock-token-e2e-test')
    localStorage.setItem('llosa_perfil', JSON.stringify(p))
  }, perfil)
}

/**
 * Intercepta GET /api/auth/me (llamada de AuthContext al restaurar sesión)
 */
async function mockAuthMe(page: Page, perfil: Record<string, unknown> | null, status = 200) {
  await page.route('**/api/auth/me', async (route) => {
    if (perfil === null) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    } else {
      await route.fulfill({ status, json: perfil })
    }
  })
}

/**
 * Intercepta la autenticación de Firebase (signInWithEmailAndPassword)
 * Firebase Web SDK usa la REST API de identitytoolkit internamente
 */
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
        localId: 'mock-uid-001',
      }),
    })
  })
}

async function mockFirebaseError(page: Page, errorCode: string) {
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 400, message: errorCode, errors: [{ message: errorCode }] },
      }),
    })
  })
}

// ─── CP01: Login corporativo exitoso ─────────────────────────────────────────

test.describe('CP01 — Login corporativo exitoso con dominio @llosaedificaciones.com', () => {
  test('admin@llosaedificaciones.com accede al backoffice tras login exitoso', async ({ page }) => {
    const perfilAdmin = {
      id: 1,
      nombre: 'Admin',
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockFirebaseSuccess(page, 'admin@llosaedificaciones.com')
    await mockAuthMe(page, perfilAdmin)
    await page.goto('/login-empresa')

    await page.fill('input[type="email"]', 'admin@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // Debe redirigir al dashboard de admin (proyectos según redirectTo="/proyectos")
    await expect(page).toHaveURL(/\/(proyectos|dashboard)/, { timeout: 8_000 })
  })

  test('no se muestran errores en login válido', async ({ page }) => {
    const perfilAsesor = {
      id: 2,
      nombre: 'Asesor Uno',
      email: 'asesor@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ASESOR',
      activo: true,
      funciones: ['PROYECTO_VER'],
    }

    await mockFirebaseSuccess(page, 'asesor@llosaedificaciones.com')
    await mockAuthMe(page, perfilAsesor)
    await page.goto('/login-empresa')

    await page.fill('input[type="email"]', 'asesor@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // No debe aparecer ningún alert de error
    const alert = page.locator('[role="alert"]')
    await expect(alert).toHaveCount(0)
  })
})

// ─── CP02: Rechazo de dominio externo ────────────────────────────────────────

test.describe('CP02 — Rechazo de dominio externo (@gmail.com)', () => {
  test('gmail.com debería mostrar error de dominio no autorizado sin llamar a Firebase', async ({ page }) => {
    let firebaseCalled = false
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      firebaseCalled = true
      await route.abort() // Si Firebase es llamado, abortamos para no complicar el test
    })

    await page.goto('/login-empresa')
    await page.fill('input[type="email"]', 'usuario@gmail.com')
    await page.fill('input[type="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // Debe mostrar error de dominio específico
    await expect(
      page.locator('text=/dominio|no autorizado|@llosaedificaciones/i')
    ).toBeVisible({ timeout: 3_000 })

    // Firebase NO debería haber sido llamado
    expect(firebaseCalled).toBe(false)
  })

  test('se muestra algún error al intentar login con dominio externo', async ({ page }) => {
    // Firebase rechaza porque el usuario no existe
    await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS')
    await page.goto('/login-empresa')

    await page.fill('input[type="email"]', 'intruso@hotmail.com')
    await page.fill('input[type="password"]', 'cualquierClave123')
    await page.click('button[type="submit"]')

    // Al menos debe mostrar algún error (aunque sea genérico)
    const error = page.locator('[role="alert"], .text-red-500, [class*="error"]')
    await expect(error).toBeVisible({ timeout: 5_000 })
  })
})

// ─── CP03: Recuperación de contraseña no existe en el backoffice ─────────────

test.describe('CP03 — La opción de recuperar contraseña no existe en el backoffice', () => {

  test('El formulario de /login-empresa no debe contener el botón de recuperar contraseña', async ({ page }) => {
    await page.goto('/login-empresa')
    const btn = page.locator('button:has-text("Olvidé"), button:has-text("Olvidaste"), a:has-text("contraseña"), button:has-text("contraseña")')
    await expect(btn).toHaveCount(0)
  })

  test('El formulario de /login no debe contener el botón de recuperar contraseña', async ({ page }) => {
    await page.goto('/login')
    const btn = page.locator('button:has-text("Olvidé"), button:has-text("Olvidaste"), a:has-text("contraseña"), button:has-text("contraseña")')
    await expect(btn).toHaveCount(0)
  })
})

// ─── CP04: Contraseña incorrecta ─────────────────────────────────────────────

test.describe('CP04 — Rechazo de credenciales inválidas', () => {
  test('muestra "Correo o contraseña incorrectos." con auth/invalid-credential', async ({ page }) => {
    await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS')
    await page.goto('/login-empresa')

    await page.fill('input[type="email"]', 'tecnico@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ClaveErronea000')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toContainText('Correo o contraseña incorrectos.', { timeout: 5_000 })
  })

  test('no redirige al dashboard cuando las credenciales son incorrectas', async ({ page }) => {
    await mockFirebaseError(page, 'INVALID_PASSWORD')
    await page.goto('/login-empresa')

    await page.fill('input[type="email"]', 'valido@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'ClaveErronea000')
    await page.click('button[type="submit"]')

    // Debe permanecer en /login-empresa
    await expect(page).toHaveURL(/login/, { timeout: 3_000 })
  })
})

// ─── CP09: Cliente "Vendido" → acceso completo al portal ─────────────────────

test.describe('CP09 — Cliente con unidad Vendido accede al portal sin restricciones', () => {
  test('Cliente con unidad Vendido es redirigido incorrectamente a /proyectos', async ({ page }) => {

    const perfilCliente = {
      id: 20,
      nombre: 'Cliente Vendido',
      email: 'cliente@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockFirebaseSuccess(page, 'cliente@gmail.com')
    await mockAuthMe(page, perfilCliente)
    await page.goto('/login')

    await page.fill('input[type="email"]', 'cliente@gmail.com')
    await page.fill('input[type="password"]', 'ClienteSeguro123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/portal/mis-activos', { timeout: 8_000 })
  })

  test('portal /mis-activos muestra estado "Vendido" del activo', async ({ page }) => {
    const perfilCliente = {
      id: 20,
      nombre: 'Cliente Vendido',
      email: 'cliente@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilCliente)
    await page.route('**/api/expedientes/mis-activos**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          content: [{ id: 1, estadoComercial: 'VENDIDO', nombreUnidad: 'Dpto 402', proyecto: 'Edificio Aurora' }],
          totalPages: 1,
          number: 0,
        },
      })
    })

    await injectSession(page, perfilCliente)
    await page.goto('/portal/mis-activos')

    await expect(page.locator('text=/VENDIDO|Vendido/i')).toBeVisible({ timeout: 5_000 })
  })
})

// ─── CP10: Cliente "Inactivo" bloqueado ──────────────────────────────────────

test.describe('CP10 — Cliente con perfil Inactivo no puede acceder al portal', () => {
  test('cuando el backend devuelve 401, el cliente inactivo es redirigido al login', async ({ page }) => {
    await mockAuthMe(page, null, 401) // Backend rechaza el token del inactivo

    const perfilInactivo = {
      id: 30,
      nombre: 'Ex Cliente',
      email: 'desistio@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: false,
      funciones: [],
    }

    await injectSession(page, perfilInactivo)
    await page.goto('/portal/mis-activos')

    // Con 401 del backend, AuthContext limpia sesión → redirect al login
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

  test('Cuando el backend NO rechaza pero activo=false, AuthGuard debería bloquear', async ({ page }) => {
    const perfilInactivo = {
      id: 30,
      email: 'desistio@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: false,
      funciones: [],
    }

    await mockAuthMe(page, perfilInactivo) // Backend responde OK (no detecta inactividad)
    await injectSession(page, perfilInactivo)
    await page.goto('/portal/mis-activos')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})

// ─── CP11: Cliente "Separado" → Modo de Espera ───────────────────────────────

test.describe('CP11 — Cliente con unidad Separado entra en Modo de Espera', () => {
  test('El portal no muestra un "Modo de Espera" diferenciado para unidades Separadas', async ({ page }) => {
 
    const perfilSeparado = {
      id: 40,
      email: 'separado@gmail.com',
      tipoUsuario: 'CLIENTE',
      rol: null,
      activo: true,
      funciones: [],
    }

    await mockAuthMe(page, perfilSeparado)
    await page.route('**/api/expedientes/mis-activos**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          content: [{ id: 2, estadoComercial: 'SEPARADO', nombreUnidad: 'Dpto 802', proyecto: 'Edificio Aurora' }],
          totalPages: 1,
          number: 0,
        },
      })
    })

    await injectSession(page, perfilSeparado)
    await page.goto('/portal/mis-activos')
    await expect(page.locator('text=/modo de espera|en espera/i')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('a[href*="obra"], button:has-text("Avance de Obra")')).toHaveCount(0)
    await expect(page.locator('a[href*="finanzas"], button:has-text("Finanzas")')).toHaveCount(0)
  })
})
