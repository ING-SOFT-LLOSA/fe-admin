/**
 * Pruebas E2E — Módulo de Autenticación (CP01–CP05, CP09–CP11)
 *
 * OBJETIVO: verificar que el sistema funciona correctamente en el browser.
 * Un test que FALLA indica un BUG en la UI, no en el test.
 *
 * Prerequisito: servidor corriendo en http://localhost:3000 (`npm run dev`)
 *
 * Hallazgos clave del análisis de código:
 * - Login URL: /login-empresa (y /login — ambas usan el mismo LoginForm)
 * - Token en localStorage: "llosa_id_token"
 * - Perfil en localStorage: "llosa_perfil"
 * - AuthContext restaura sesión via GET /api/auth/me con el token almacenado
 * - BUG CP02: loginWithEmail no valida dominio antes de llamar a Firebase
 * - BUG CP05: botón "Olvidé mi contraseña" visible para ADMIN (sin condicional de rol)
 * - BUG CP10: AuthGuard no verifica campo activo del perfil
 * - BRECHA CP11: no existe componente "Modo de Espera" en el frontend
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
  /**
   * BUG DETECTADO (CP02): loginWithEmail() en src/lib/auth/login.ts
   * NO valida el dominio antes de llamar a Firebase.
   * El frontend no puede mostrar un error de dominio específico sin implementarlo.
   *
   * Este test DEBE FALLAR en el estado actual del código:
   * - No muestra mensaje específico de dominio (solo genérico si Firebase rechaza)
   * - Firebase puede ser llamado antes del rechazo
   */
  test('[BUG CP02] gmail.com debería mostrar error de dominio no autorizado sin llamar a Firebase', async ({ page }) => {
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

// ─── CP03: Recuperación de contraseña ────────────────────────────────────────

test.describe('CP03 — Recuperación de contraseña para usuarios no-admin', () => {
  test('el botón "Olvidé mi contraseña" está visible en /login-empresa', async ({ page }) => {
    await page.goto('/login-empresa')
    const btn = page.locator('button:has-text("Olvidé"), button:has-text("contraseña"), a:has-text("contraseña")')
    await expect(btn.first()).toBeVisible()
  })

  test('[BUG CP03] al hacer click en "Olvidé mi contraseña" debe ocurrir alguna acción', async ({ page }) => {
    /**
     * BUG: El botón en LoginForm.tsx:258 no tiene onClick handler.
     * Es un <button type="button"> vacío que no ejecuta nada.
     * Este test DEBE FALLAR para documentar el bug.
     */
    let resetEmailCalled = false
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:sendOobCode**', async (route) => {
      resetEmailCalled = true
      await route.fulfill({ status: 200, json: { email: 'asesor@llosaedificaciones.com' } })
    })

    await page.goto('/login-empresa')
    await page.fill('input[type="email"]', 'asesor@llosaedificaciones.com')

    const btn = page.locator('button:has-text("Olvidé"), button:has-text("contraseña")').first()
    await btn.click()

    // Debe abrir un modal, mostrar un mensaje, o llamar a Firebase reset
    const modalVisible = await page.locator('[role="dialog"], [aria-modal="true"]').count()
    const msgVisible = await page.locator('text=/correo|enviado|restablecer|ingresa/i').count()

    expect(modalVisible + msgVisible + (resetEmailCalled ? 1 : 0)).toBeGreaterThan(0)
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

// ─── CP05: Admin NO ve "Olvidé mi contraseña" ────────────────────────────────

test.describe('CP05 — Admin no debe ver la opción de recuperar contraseña', () => {
  /**
   * BUG DETECTADO (CP05): El botón "¿Olvidaste tu contraseña?" en LoginForm.tsx
   * NO tiene condicional de rol. Se renderiza para TODOS los usuarios.
   * Además, el rol se conoce DESPUÉS del login, no antes.
   *
   * Arquitectónicamente este CP no puede cumplirse en la pantalla de login
   * sin una pantalla de login separada para admin o sin una pre-validación.
   *
   * Este test verifica si existe algún mecanismo post-login que oculte el botón.
   */
  test('[BUG CP05] la pantalla de login muestra "Olvidé mi contraseña" incluso para admin', async ({ page }) => {
    await page.goto('/login-empresa')

    // El botón está visible ANTES de saber si es admin (lo que es el bug)
    const btn = page.locator('button:has-text("Olvidé"), button:has-text("contraseña")').first()
    await expect(btn).toBeVisible()

    // COMPORTAMIENTO ESPERADO: para un admin, este botón NO debería aparecer
    // Como falla, dejamos el test para documentar la inconsistencia:
    // El CP espera que admin NO vea el botón, pero el botón siempre está visible
  })

  test('[BUG CP05] en configuración/perfil de admin no debe aparecer opción de cambio de contraseña por email', async ({ page }) => {
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
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    // En la pantalla de configuración, admin no debe ver enlace de recuperar contraseña
    const resetLink = page.locator('text=/Olvidé|recuperar contraseña|enviar correo de reset/i')
    await expect(resetLink).toHaveCount(0)
  })
})

// ─── CP09: Cliente "Vendido" → acceso completo al portal ─────────────────────

test.describe('CP09 — Cliente con unidad Vendido accede al portal sin restricciones', () => {
  test('[BRECHA CP09] cliente con unidad Vendido es redirigido incorrectamente a /proyectos', async ({ page }) => {
    /**
     * BUG: LoginForm redirige siempre a redirectTo="/proyectos" sin importar el rol.
     * Un cliente (tipoUsuario=CLIENTE) tras login va a /proyectos (vista admin),
     * no al portal de cliente /portal/mis-activos.
     * Este test documenta la redirección incorrecta.
     */
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

    // COMPORTAMIENTO ESPERADO: redirigir a /portal/mis-activos
    // COMPORTAMIENTO ACTUAL (BUG): redirige a /proyectos
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

  test('[BUG CP10] cuando el backend NO rechaza pero activo=false, AuthGuard debería bloquear', async ({ page }) => {
    /**
     * BUG: AuthGuard solo verifica que exista token + perfil en localStorage.
     * Si el backend acepta el token (no detecta la inactividad) pero el perfil
     * local tiene activo=false, el usuario puede acceder al portal.
     * Este test DEBE FALLAR para documentar el bug.
     */
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

    // COMPORTAMIENTO ESPERADO: bloqueado aunque el backend diga OK
    // COMPORTAMIENTO ACTUAL (BUG): permite el acceso porque AuthGuard no verifica activo
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})

// ─── CP11: Cliente "Separado" → Modo de Espera ───────────────────────────────

test.describe('CP11 — Cliente con unidad Separado entra en Modo de Espera', () => {
  test('[BRECHA CP11] el portal no muestra un "Modo de Espera" diferenciado para unidades Separadas', async ({ page }) => {
    /**
     * BRECHA: No existe ningún componente "Modo de Espera" en el frontend.
     * src/app/portal/mis-activos/page.tsx muestra el estadoComercial como texto,
     * pero no bloquea módulos ni muestra una UI diferente para "SEPARADO".
     * Este test DEBE FALLAR para documentar la brecha.
     */
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

    // COMPORTAMIENTO ESPERADO: ver solo resumen de separación, módulos bloqueados
    await expect(page.locator('text=/modo de espera|en espera/i')).toBeVisible({ timeout: 5_000 })

    // Los módulos de obra, finanzas y legal deben estar bloqueados
    await expect(page.locator('a[href*="obra"], button:has-text("Avance de Obra")')).toHaveCount(0)
    await expect(page.locator('a[href*="finanzas"], button:has-text("Finanzas")')).toHaveCount(0)
  })
})
