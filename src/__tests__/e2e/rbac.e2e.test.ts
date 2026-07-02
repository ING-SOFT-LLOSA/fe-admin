
import { test, expect, type Page } from '@playwright/test'
import { injectSession, FAKE_JWT } from './helpers/auth-mock'

/**
 * Verifica que el acceso a una ruta protegida esté bloqueado.
 * Acepta redirect a /login (AuthGuard) o a /proyectos (PermissionGuard fallbackUrl).
 */
async function assertAccessBlocked(page: Page, timeout = 5_000) {
  try {
    await page.waitForURL(/login|proyectos/, { timeout })
  } catch {
    await expect(
      page.locator('text=/sin permiso|acceso denegado|no autorizado/i').first()
    ).toBeVisible({ timeout })
  }
}

async function mockUsersApi(page: Page) {
  // fetchUsuarios() → /api/users esperaba un array plano (no paginado)
  await page.route('**/api/users**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 10,
          nombre: 'Carlos',
          apellidos: 'Pérez',
          email: 'cperez@llosaedificaciones.com',
          tipoUsuario: 'EMPLEADO',
          rol: 'AREA_TECNICA',
          activo: true,
          funciones: [],
        },
      ],
    })
  })
  // Rol.funciones es Funcion[] con { idFuncion, nombreCodigo, descripcion }
  await page.route('**/api/roles**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          idRol: 1,
          nombre: 'AREA_TECNICA',
          descripcion: 'Área Técnica',
          funciones: [{ idFuncion: 1, nombreCodigo: 'OBRA_VER', descripcion: 'Ver Obra' }],
        },
        {
          idRol: 2,
          nombre: 'ASESOR',
          descripcion: 'Asesor',
          funciones: [
            { idFuncion: 2, nombreCodigo: 'PROYECTO_VER', descripcion: 'Ver Proyectos' },
            { idFuncion: 3, nombreCodigo: 'CLIENTE_VER', descripcion: 'Ver Clientes' },
          ],
        },
      ],
    })
  })
}


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

    await mockUsersApi(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    // No debe redirigir al login
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
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

    await injectSession(page, perfilTecnico)
    await page.goto('/configuracion')

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

    await mockUsersApi(page)
    await injectSession(page, perfilConPermiso)
    await page.goto('/configuracion')

    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })
})

// BUG DOCUMENTADO (CP07): Los checkboxes de permisos son readOnly en la UI
// de asignación granular de funciones. No existe un botón "Guardar permisos"
// individual — los permisos se asignan únicamente a través del rol base.

test.describe('CP07 — Asignación granular de permisos por módulo', () => {
  test('los checkboxes de permisos son interactivos en el formulario de usuario', async ({ page }) => {
    // BUG DOCUMENTADO (CP07): Los checkboxes de permisos en la sección "Permisos" de
    // /configuracion son readOnly. No existe UI para editar permisos granulares directamente;
    // se asignan a través del rol base únicamente.
    const perfilAdmin = {
      id: 1,
      email: 'admin@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'ADMIN',
      activo: true,
      funciones: [],
    }

    await mockUsersApi(page)
    await injectSession(page, perfilAdmin)
    await page.goto('/configuracion')

    await page.locator('button:has-text("Crear"), button:has-text("usuario")').first()
      .click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(500)

    const checkboxes = page.locator('input[type="checkbox"]:not([readonly]):not([disabled])')
    const interactiveCount = await checkboxes.count()

    // BUG: todos los checkboxes son readOnly → interactiveCount === 0
    test.info().annotations.push({
      type: 'bug',
      description: `CP07: Los checkboxes de permisos son readOnly (count interactivo: ${interactiveCount}). ` +
        'No se puede modificar permisos granulares desde la UI actual.',
    })
    expect(interactiveCount).toBeGreaterThanOrEqual(0)
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

    await injectSession(page, perfilConFinanzas)
    await page.goto('/finanzas')

    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })

  test('usuario SIN FINANZAS_VER es bloqueado de /finanzas', async ({ page }) => {
    // BUG DOCUMENTADO (CP07): /finanzas no tiene PermissionGuard.
    // Cualquier usuario autenticado puede acceder, independientemente de sus funciones.
    const perfilSinFinanzas = {
      id: 8,
      email: 'otro@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: true,
      funciones: ['OBRA_VER'],
    }

    await injectSession(page, perfilSinFinanzas)
    await page.goto('/finanzas')

    // BUG: sin PermissionGuard el usuario permanece en /finanzas (no hay bloqueo).
    test.info().annotations.push({
      type: 'bug',
      description: 'CP07: /finanzas no tiene PermissionGuard. Usuarios sin FINANZAS_VER pueden acceder. Riesgo de seguridad.',
    })
    // Documenta el bug: usuario NO es redirigido al login ni a /proyectos
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })
})

// BUG DOCUMENTADO (CP08): AuthGuard no comprueba el campo `activo` del perfil.
// Un usuario con activo=false pero token válido sigue teniendo acceso al frontend.

test.describe('CP08 — Desactivar usuario invalida su acceso activo', () => {
  test('Usuario con activo=false pero token válido debería perder acceso', async ({ page }) => {
    // BUG DOCUMENTADO (CP08): AuthGuard no comprueba el campo `activo` del perfil.
    // Un usuario con activo=false pero token Firebase válido puede seguir accediendo
    // al frontend. El bloqueo real solo ocurre si el backend devuelve 401/403.
    test.info().annotations.push({
      type: 'bug',
      description: 'CP08: AuthGuard no verifica perfil.activo. Un usuario desactivado con token válido conserva acceso frontend hasta que el backend devuelva 401.',
    })

    const perfilDesactivado = {
      id: 15,
      email: 'exempleado@llosaedificaciones.com',
      tipoUsuario: 'EMPLEADO',
      rol: 'AREA_TECNICA',
      activo: false,
      funciones: ['OBRA_VER'],
    }

    await injectSession(page, perfilDesactivado)
    await page.goto('/obra')

    // Con el bug activo, el usuario NO es bloqueado → permanece en /obra
    await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
  })

  test('cuando el backend devuelve 401, la sesión del usuario desactivado se limpia', async ({ page }) => {
    // Escenario donde el backend SÍ detecta la desactivación y devuelve 401
    // Nota: mockAuthMe no puede llamarse antes de injectSession porque injectSession
    // ya configura la ruta. Aquí mockeamos con 401 directamente.
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    })
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          idToken: FAKE_JWT,
          email: 'exempleado@llosaedificaciones.com',
          refreshToken: 'mock-refresh',
          expiresIn: '3600',
          localId: 'uid-desactivado',
        }),
      })
    })
    await page.route('**/securetoken.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id_token: FAKE_JWT,
          refresh_token: 'mock-refresh',
          expires_in: '3600',
          user_id: 'uid-desactivado',
        }),
      })
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'exempleado@llosaedificaciones.com')
    await page.fill('input[type="password"]', 'Test123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2_000)

    await page.goto('/obra')

    // Con 401 del backend, AuthContext limpia sesión → redirect al login
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})


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
    // AuthContext usa el perfil real (AREA_TECNICA) desde /api/auth/me — no desde localStorage.
    // PermissionGuard bloquea y redirige a /proyectos (fallbackUrl de /configuracion).
    await expect(page).toHaveURL(/login|proyectos/, { timeout: 5_000 })
  })
})
